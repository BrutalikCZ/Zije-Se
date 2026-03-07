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

    try {
        const res = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'ZijeSe/1.0 (contact@zijese.cz)',
                'Accept': 'application/json',
            },
        });

        if (!res.ok) {
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

        // Return a FeatureCollection with only the best feature
        return NextResponse.json({
            type: 'FeatureCollection',
            features: [bestFeature]
        });
    } catch (error: any) {
        console.error('[Nominatim] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
