import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), 'public', 'data');

        // Create directory if it doesn't exist (graceful fallback)
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            return NextResponse.json([]);
        }

        const files = fs.readdirSync(dataDir);
        const geojsonFiles = files.filter(file => file.endsWith('.geojson'));

        return NextResponse.json(geojsonFiles);
    } catch (error) {
        console.error('Error reading data directory:', error);
        return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
    }
}
