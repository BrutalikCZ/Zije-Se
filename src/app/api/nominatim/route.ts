import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const place = searchParams.get('place');

    if (!place) {
        return NextResponse.json({ error: 'Missing place parameter' }, { status: 400 });
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', place);
    url.searchParams.set('format', 'geojson');
    url.searchParams.set('polygon_geojson', '1');
    url.searchParams.set('limit', '5'); // Fetch more to find polygon
    url.searchParams.set('countrycodes', 'cz');

    const NOMINATIM_TIMEOUT_MS = 8000;
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);

        try {
            const res = await fetch(url.toString(), {
                headers: {
                    'User-Agent': 'ZijeSe/1.0 (contact@zijese.cz)',
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            });

            if (!res.ok) {
                if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
                    console.warn(`[Nominatim] Attempt ${attempt + 1} failed with ${res.status}, retrying...`);
                    continue;
                }
                return NextResponse.json({ error: `Nominatim error: ${res.status}` }, { status: 502 });
            }

            const data = await res.json();

            if (!data.features || data.features.length === 0) {
                return NextResponse.json({ error: 'Place not found' }, { status: 404 });
            }

            // Prioritize features with Polygon or MultiPolygon geometry
            const bestFeature = data.features.find((f: any) =>
                f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
            ) || data.features[0];

            return NextResponse.json({
                type: 'FeatureCollection',
                features: [bestFeature]
            });

        } catch (error: any) {
            const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
            if ((isTimeout || error.code === 'ECONNRESET') && attempt < MAX_RETRIES - 1) {
                console.warn(`[Nominatim] Attempt ${attempt + 1} timeout/reset, retrying...`);
                continue;
            }

            console.error('[Nominatim] Final error:', error);
            const status = isTimeout ? 504 : 503;
            return NextResponse.json({ error: isTimeout ? 'Nominatim timeout' : (error.message || 'Internal connection error') }, { status });
        } finally {
            clearTimeout(timeout);
        }
    }

    return NextResponse.json({ error: 'All connection attempts to Nominatim failed' }, { status: 503 });
}
