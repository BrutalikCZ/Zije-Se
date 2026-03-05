import { NextRequest, NextResponse } from 'next/server';

const OVERPASS_SERVERS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter',
];

async function fetchOverpass(query: string): Promise<Response> {
    let lastError: Error | null = null;
    for (const server of OVERPASS_SERVERS) {
        try {
            const res = await fetch(server, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`,
            });
            if (res.ok) return res;
            if (res.status === 429 || res.status >= 500) {
                lastError = new Error(`Server ${server} returned ${res.status}`);
                continue;
            }
            return res;
        } catch (e) {
            lastError = e as Error;
        }
    }
    throw lastError ?? new Error('All Overpass servers failed');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            amenity, shop, leisure,
            tag,          // generic: "office=government" or ["amenity=townhall","government=register_office"]
            nameFilter,   // optional JS regex string for server-side name filtering (e.g. "ZŠ|Základní škola")
            lat: bodyLat, lng: bodyLng,
            radius,       // optional, default 1000m, clamped 10–5000m (ignored when placeName sets its own radius)
            placeName,
        } = body;

        // Build list of OSM tag expressions
        const tagExprs: string[] = [];
        if (amenity) tagExprs.push(`amenity="${amenity}"`);
        if (shop) tagExprs.push(`shop="${shop}"`);
        if (leisure) tagExprs.push(`leisure="${leisure}"`);
        if (tag) {
            const tags: string[] = Array.isArray(tag) ? tag : [tag];
            for (const t of tags) {
                const eqIdx = t.indexOf('=');
                if (eqIdx > 0) {
                    const k = t.slice(0, eqIdx).trim();
                    const v = t.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
                    if (k && v) tagExprs.push(`${k}="${v}"`);
                }
            }
        }

        if (tagExprs.length === 0) {
            return NextResponse.json({ error: 'No tag specified (amenity / shop / leisure / tag)' }, { status: 400 });
        }

        let lat: number | null = bodyLat ?? null;
        let lng: number | null = bodyLng ?? null;
        // User-provided radius clamped to 10–5000m; default 1000m
        let queryRadius = radius != null ? Math.max(10, Math.min(5000, Number(radius))) : 1000;

        // Resolve placeName to coordinates via Nominatim (much faster than Overpass area queries)
        if (placeName && (lat == null || lng == null)) {
            const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
            nominatimUrl.searchParams.set('q', `${placeName}, Česká republika`);
            nominatimUrl.searchParams.set('format', 'json');
            nominatimUrl.searchParams.set('limit', '1');
            nominatimUrl.searchParams.set('countrycodes', 'cz');

            const nominatimRes = await fetch(nominatimUrl.toString(), {
                headers: { 'User-Agent': 'ZijeSe/1.0 (contact@zijese.cz)' },
            });

            if (nominatimRes.ok) {
                const nominatimData = await nominatimRes.json();
                if (nominatimData.length > 0) {
                    const place = nominatimData[0];
                    lat = parseFloat(place.lat);
                    lng = parseFloat(place.lon);
                    const bb: string[] = place.boundingbox;
                    if (bb?.length === 4) {
                        const latSpan = Math.abs(parseFloat(bb[1]) - parseFloat(bb[0]));
                        const lngSpan = Math.abs(parseFloat(bb[3]) - parseFloat(bb[2]));
                        queryRadius = Math.max(2000, Math.min(50000,
                            Math.round(Math.max(latSpan, lngSpan) * 111000 / 2)
                        ));
                    }
                    console.log(`[Overpass] Resolved "${placeName}" → lat:${lat} lng:${lng} radius:${queryRadius}`);
                }
            }
        }

        if (lat == null || lng == null) {
            return NextResponse.json({ error: 'Could not resolve location — provide lat/lng or a valid placeName' }, { status: 400 });
        }

        // Build union query — node + way + relation to catch all OSM types
        const nodeLines = tagExprs.map(t => `  node[${t}](around:${queryRadius},${lat},${lng});`).join('\n');
        const wayLines = tagExprs.map(t => `  way[${t}](around:${queryRadius},${lat},${lng});`).join('\n');
        const relLines = tagExprs.map(t => `  relation[${t}](around:${queryRadius},${lat},${lng});`).join('\n');

        const query = `[out:json][timeout:25];
(
${nodeLines}
${wayLines}
${relLines}
);
out center 100;`;

        console.log(`[Overpass] Tags: ${tagExprs.join(', ')} | lat:${lat} lng:${lng} r:${queryRadius}m`);

        const res = await fetchOverpass(query);
        const data = await res.json();

        console.log(`[Overpass] Raw elements from API: ${(data.elements || []).length}`);

        const features: GeoJSON.Feature[] = (data.elements || [])
            .filter((el: any) => el.lat != null || el.center?.lat != null)
            .map((el: any) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [
                        el.lon ?? el.center?.lon,
                        el.lat ?? el.center?.lat,
                    ],
                },
                properties: {
                    id: el.id,
                    name: el.tags?.name || el.tags?.['name:cs'] || '',
                    opening_hours: el.tags?.opening_hours,
                    phone: el.tags?.phone,
                    website: el.tags?.website,
                    addr_street: el.tags?.['addr:street'],
                    addr_city: el.tags?.['addr:city'],
                },
            }));

        // Server-side name filtering (more reliable than Overpass regex for Unicode/diacritics)
        const filteredFeatures = nameFilter
            ? features.filter(f => {
                const name: string = (f.properties as any)?.name || '';
                try { return new RegExp(nameFilter, 'i').test(name); } catch { return true; }
            })
            : features;

        console.log(`[Overpass] Found ${features.length} features${nameFilter ? `, ${filteredFeatures.length} after name filter` : ''}`);

        const geojson: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: filteredFeatures };
        return NextResponse.json(geojson);

    } catch (error: any) {
        console.error('[Overpass] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
