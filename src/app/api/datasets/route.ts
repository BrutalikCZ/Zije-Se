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
                    const publicPath = filePath.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/');

                    result.push({
                        name: item.name,
                        type: 'file',
                        path: publicPath
                    });
                } else {
                    const filePath = path.join(currentPath, item.name);
                    const publicPath = filePath.replace(path.join(process.cwd(), 'public'), '').replace(/\\/g, '/');

                    result.push({
                        name: item.name,
                        type: 'file',
                        path: publicPath
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
