import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export type DatasetTree = Record<string, Record<string, string[]>>;

export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), 'public', 'data');

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            return NextResponse.json({});
        }

        const tree: DatasetTree = {};

        const regions = fs.readdirSync(dataDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const region of regions) {
            tree[region] = {};
            const regionPath = path.join(dataDir, region);

            const categories = fs.readdirSync(regionPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            for (const category of categories) {
                const categoryPath = path.join(regionPath, category);
                const files = fs.readdirSync(categoryPath, { withFileTypes: true })
                    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.geojson'))
                    .map(dirent => dirent.name);

                if (files.length > 0) {
                    tree[region][category] = files;
                }
            }
        }

        return NextResponse.json(tree);
    } catch (error) {
        console.error('Error reading data directory:', error);
        return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
    }
}
