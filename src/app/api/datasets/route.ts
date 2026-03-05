import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export type FileNode = {
    name: string;
    type: 'file' | 'directory' | 'property';
    path?: string;
    children?: FileNode[];
};

export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), 'public', 'data', 'datasets');

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            return NextResponse.json([]);
        }

        const readDir = (currentPath: string): FileNode[] => {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });
            const result: FileNode[] = [];
            for (const item of items) {
                if (item.name.startsWith('.')) continue; // skip hidden files

                if (item.isDirectory()) {
                    result.push({
                        name: item.name,
                        type: 'directory',
                        children: readDir(path.join(currentPath, item.name))
                    });
                } else if (item.name.endsWith('.geojson')) {
                    const filePath = path.join(currentPath, item.name);
                    let properties: string[] = [];
                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        const json = JSON.parse(content);
                        if (json.features && json.features.length > 0 && json.features[0].properties) {
                            properties = Object.keys(json.features[0].properties);
                        }
                    } catch (e) {
                        console.error('Error parsing geojson:', filePath, e);
                    }

                    result.push({
                        name: item.name,
                        type: 'file',
                        path: filePath.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/'),
                        children: properties.length > 0 ? properties.map(p => ({
                            name: p,
                            type: 'property',
                            path: filePath.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/') + '?prop=' + p
                        })) : undefined
                    });
                } else {
                    result.push({
                        name: item.name,
                        type: 'file',
                        path: path.join(currentPath, item.name).replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/')
                    });
                }
            }
            return result;
        };

        const tree = readDir(dataDir);
        return NextResponse.json(tree);

    } catch (error) {
        console.error('Error reading datasets directory:', error);
        return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
    }
}
