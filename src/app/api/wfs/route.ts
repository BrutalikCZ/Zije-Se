import { NextRequest, NextResponse } from 'next/server';

const PAGE_SIZE = 1000;
const MAX_PAGES = 100; // safety cap: max 100 000 features

function buildCapabilitiesUrl(baseUrl: string): string {
    const cleanBase = baseUrl.split('?')[0];
    const url = new URL(cleanBase);
    url.searchParams.set('SERVICE', 'WFS');
    url.searchParams.set('VERSION', '2.0.0');
    url.searchParams.set('REQUEST', 'GetCapabilities');
    return url.toString();
}

function buildGetFeatureUrl(
    baseUrl: string,
    typeName: string,
    outputFormat: string,
    count: number,
    startIndex: number,
): string {
    const cleanBase = baseUrl.split('?')[0];
    const url = new URL(cleanBase);
    url.searchParams.set('SERVICE', 'WFS');
    url.searchParams.set('VERSION', '2.0.0');
    url.searchParams.set('REQUEST', 'GetFeature');
    url.searchParams.set('TYPENAMES', typeName);
    url.searchParams.set('COUNT', String(count));
    url.searchParams.set('STARTINDEX', String(startIndex));
    url.searchParams.set('outputFormat', outputFormat);
    return url.toString();
}

function parseCapabilities(xml: string): { name: string; title: string }[] {
    const layers: { name: string; title: string }[] = [];
    const ftRegex = /<(?:[\w]+:)?FeatureType[\s>]([\s\S]*?)<\/(?:[\w]+:)?FeatureType>/g;
    let match;
    while ((match = ftRegex.exec(xml)) !== null) {
        const block = match[1];
        const nameMatch = block.match(/<(?:[\w]+:)?Name[^>]*>([^<]+)<\/(?:[\w]+:)?Name>/);
        const titleMatch = block.match(/<(?:[\w]+:)?Title[^>]*>([^<]+)<\/(?:[\w]+:)?Title>/);
        if (nameMatch) {
            layers.push({
                name: nameMatch[1].trim(),
                title: titleMatch ? titleMatch[1].trim() : nameMatch[1].trim(),
            });
        }
    }
    return layers;
}

async function fetchPagedFeatures(baseUrl: string, typeName: string, outputFormat: string): Promise<object[]> {
    const allFeatures: object[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
        const startIndex = page * PAGE_SIZE;
        const featureUrl = buildGetFeatureUrl(baseUrl, typeName, outputFormat, PAGE_SIZE, startIndex);

        const res = await fetch(featureUrl, {
            headers: { Accept: 'application/json, application/geo+json, */*' },
            signal: AbortSignal.timeout(60000),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        if (text.trim().startsWith('<')) throw new Error('xml');

        const data = JSON.parse(text);
        const features: object[] = data.features ?? [];
        allFeatures.push(...features);

        // Fewer results than requested → last page
        if (features.length < PAGE_SIZE) break;
    }

    return allFeatures;
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const baseUrl = searchParams.get('url');
    const request = searchParams.get('request') || 'GetCapabilities';
    const typeName = searchParams.get('typeName');

    if (!baseUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        if (request === 'GetCapabilities') {
            const capUrl = buildCapabilitiesUrl(baseUrl);
            const res = await fetch(capUrl, {
                headers: { Accept: 'application/xml, text/xml, */*' },
                signal: AbortSignal.timeout(20000),
            });
            if (!res.ok) {
                return NextResponse.json({ error: `Upstream HTTP ${res.status}` }, { status: 502 });
            }
            const xml = await res.text();
            const layers = parseCapabilities(xml);
            return NextResponse.json({ layers });
        }

        if (request === 'GetFeature') {
            if (!typeName) {
                return NextResponse.json({ error: 'Missing typeName parameter' }, { status: 400 });
            }

            // Try output formats in order; each attempt fetches all pages
            const formats = ['application/json', 'GEOJSON', 'geojson', 'json'];
            let lastError = '';

            for (const fmt of formats) {
                try {
                    const features = await fetchPagedFeatures(baseUrl, typeName, fmt);
                    return NextResponse.json({ type: 'FeatureCollection', features });
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : String(e);
                    if (msg === 'xml') {
                        lastError = 'Server returned XML instead of GeoJSON';
                    } else {
                        lastError = msg;
                    }
                    // try next format
                }
            }

            return NextResponse.json({ error: lastError || 'Could not retrieve GeoJSON from WFS' }, { status: 502 });
        }

        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    } catch (err) {
        console.error('WFS proxy error:', err);
        return NextResponse.json({ error: String(err) }, { status: 502 });
    }
}
