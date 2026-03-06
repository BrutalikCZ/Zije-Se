import { NextRequest, NextResponse } from 'next/server';

const PLACES_API_BASE = 'https://places.googleapis.com/v1/places';
const FIELD_MASK = 'places.id,places.displayName,places.location,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri';

async function resolvePlace(placeName: string): Promise<{ lat: number; lng: number; radius: number } | null> {
    const normalizedPlace = placeName.toLowerCase().includes('česká republika')
        ? placeName
        : `${placeName}, Česká republika`;

    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
    nominatimUrl.searchParams.set('q', normalizedPlace);
    nominatimUrl.searchParams.set('format', 'json');
    nominatimUrl.searchParams.set('limit', '1');
    nominatimUrl.searchParams.set('countrycodes', 'cz');

    const res = await fetch(nominatimUrl.toString(), {
        headers: { 'User-Agent': 'ZijeSe/1.0 (contact@zijese.cz)' },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.length === 0) return null;

    const place = data[0];
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    let radius = 5000;

    const bb: string[] = place.boundingbox;
    if (bb?.length === 4) {
        const latSpan = Math.abs(parseFloat(bb[1]) - parseFloat(bb[0]));
        const lngSpan = Math.abs(parseFloat(bb[3]) - parseFloat(bb[2]));
        radius = Math.max(2000, Math.min(50000, Math.round(Math.max(latSpan, lngSpan) * 111000 / 2)));
    }

    return { lat, lng, radius };
}

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Chybí GOOGLE_PLACES_API_KEY v nastavení serveru.' }, { status: 500 });
        }

        const body = await request.json();
        const {
            type,       // Google Places type string or array (e.g. "pharmacy", ["restaurant","cafe"])
            keyword,    // Text search keyword (e.g. "ZŠ základní škola")
            lat: bodyLat,
            lng: bodyLng,
            radius,
            placeName,
        } = body;

        let lat: number | null = bodyLat ?? null;
        let lng: number | null = bodyLng ?? null;
        let queryRadius = radius != null ? Math.max(100, Math.min(50000, Number(radius))) : 1000;

        if (placeName && (lat == null || lng == null)) {
            const resolved = await resolvePlace(placeName);
            if (resolved) {
                lat = resolved.lat;
                lng = resolved.lng;
                queryRadius = resolved.radius;
                console.log(`[Places] Resolved "${placeName}" → lat:${lat} lng:${lng} radius:${queryRadius}`);
            }
        }

        if (lat == null || lng == null) {
            return NextResponse.json({ error: 'Nelze určit polohu — zadejte lat/lng nebo platný placeName.' }, { status: 400 });
        }

        if (!type && !keyword) {
            return NextResponse.json({ error: 'Není zadán type ani keyword.' }, { status: 400 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let placesData: any;

        if (keyword) {
            // Text Search uses rectangle for locationRestriction (circle is only for Nearby Search)
            const latDelta = queryRadius / 111000;
            const lngDelta = queryRadius / (111000 * Math.cos(lat * Math.PI / 180));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const textSearchBody: any = {
                textQuery: keyword,
                maxResultCount: 20,
                locationRestriction: {
                    rectangle: {
                        low: { latitude: lat - latDelta, longitude: lng - lngDelta },
                        high: { latitude: lat + latDelta, longitude: lng + lngDelta },
                    },
                },
                regionCode: 'CZ',
                languageCode: 'cs',
            };
            if (type && !Array.isArray(type)) textSearchBody.includedType = type;

            console.log(`[Places] Text Search: "${keyword}" type:${type || 'any'} lat:${lat} lng:${lng} r:${queryRadius}m`);

            const res = await fetch(`${PLACES_API_BASE}:searchText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': FIELD_MASK,
                },
                body: JSON.stringify(textSearchBody),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Places Text Search vrátil ${res.status}: ${err}`);
            }
            placesData = await res.json();
        } else {
            // Nearby Search — type-based
            const types = Array.isArray(type) ? type : [type];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nearbyBody: any = {
                includedTypes: types,
                maxResultCount: 20,
                locationRestriction: {
                    circle: {
                        center: { latitude: lat, longitude: lng },
                        radius: queryRadius,
                    },
                },
                languageCode: 'cs',
            };

            console.log(`[Places] Nearby Search: types:[${types.join(',')}] lat:${lat} lng:${lng} r:${queryRadius}m`);

            const res = await fetch(`${PLACES_API_BASE}:searchNearby`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': FIELD_MASK,
                },
                body: JSON.stringify(nearbyBody),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Places Nearby Search vrátil ${res.status}: ${err}`);
            }
            placesData = await res.json();
        }

        const places = placesData.places || [];
        console.log(`[Places] Found ${places.length} places`);

        const features: GeoJSON.Feature[] = places.map((place: any) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [place.location.longitude, place.location.latitude],
            },
            properties: {
                id: place.id,
                name: place.displayName?.text || '',
                address: place.formattedAddress || '',
                phone: place.nationalPhoneNumber || '',
                website: place.websiteUri || '',
            },
        }));

        const geojson: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features };
        return NextResponse.json(geojson);

    } catch (error: any) {
        console.error('[Places] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
