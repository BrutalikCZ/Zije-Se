import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OLLAMA_URL = "http://localhost:11434/api/chat";
const DEFAULT_MODEL = "gemma3:27b";
const OLLAMA_TIMEOUT_MS = 10 * 60 * 1000;

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatRequest {
    messages: ChatMessage[];
    model?: string;
    includeGeoData?: boolean;
}

function getGeoJsonDir(): string {
    return path.join(process.cwd(), 'public', 'data');
}

function listGeoJsonFiles(): string[] {
    const dir = getGeoJsonDir();
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith('.geojson'));
}

function summarizeGeoJson(filename: string): string {
    try {
        const filePath = path.join(getGeoJsonDir(), filename);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const geo = JSON.parse(raw);

        if (!geo.features || !Array.isArray(geo.features) || geo.features.length === 0) {
            return `[${filename}]: Prazdny soubor (0 features).`;
        }

        const total = geo.features.length;
        const geomTypes = new Set<string>();
        const propKeys = new Map<string, Set<string>>();

        const scanLimit = Math.min(50, total);
        for (let i = 0; i < scanLimit; i++) {
            const f = geo.features[i];
            if (f.geometry?.type) geomTypes.add(f.geometry.type);
            if (f.properties) {
                for (const [key, val] of Object.entries(f.properties)) {
                    if (!propKeys.has(key)) propKeys.set(key, new Set());
                    const samples = propKeys.get(key)!;
                    if (samples.size < 3 && val != null && String(val).length < 80) {
                        samples.add(String(val));
                    }
                }
            }
        }

        const lines: string[] = [
            `[${filename}]`,
            `  Features: ${total}, Geometry: ${[...geomTypes].join('/')}`,
            `  Properties:`,
        ];

        for (const [key, samples] of propKeys) {
            const sampleStr = [...samples].map(s => `"${s}"`).join(', ');
            lines.push(`    - ${key} (priklady: ${sampleStr})`);
        }

        return lines.join('\n');
    } catch (err: any) {
        return `[${filename}]: Chyba cteni - ${err.message}`;
    }
}

function buildGeoContext(): string {
    const files = listGeoJsonFiles();
    if (files.length === 0) {
        return 'Zadne GeoJSON datasety nejsou momentalne dostupne.';
    }

    const summaries = files.map(f => summarizeGeoJson(f));
    return [
        `Dostupne GeoJSON datasety (${files.length}):`,
        '',
        ...summaries
    ].join('\n');
}

function buildSystemPrompt(geoContext: string): string {
    return `Jsi inteligentni asistent platformy ZIJE!SE — pomahas uzivatelum najit idealni misto k bydleni v Ceske republice.

## Tvuj postup pri zpracovani pozadavku uzivatele

Kdyz uzivatel zada pozadavek (napr. "Chci byt s balkonem v prizemi a vyhledem na reku"), postupuj takto:

### Krok 1 — Extrakce parametru
Identifikuj vsechny dulezite udaje z pozadavku:
- Typ nemovitosti (byt, dum, ...)
- Pozadavky (balkon, vyhled, parkovani, ...)
- Poloha / podlazi (prizemi, centrum, ...)
- Dalsi specifika (cena, rozloha, ...)

### Krok 2 — Analyza dat
Podivej se do dostupnych GeoJSON datasetu (viz nize). Zjisti, zda nektery z nich obsahuje relevantni data pro pozadavek uzivatele — srovnej property keys s pozadavky.

### Krok 3 — Vyhodnoceni
Zhodnot, jak presne nalezena data odpovidaji pozadavku. Bud uprimny — pokud data nepokryvaji vsechny pozadavky, rekni to.

### Krok 4 — Odpoved
Odpovez uzivateli srozumitelne. Pokud jsi nasel relevantni data, vrat parametry pro filtrovani na mape:

\`\`\`json:filters
{
  "dataset": "nazev_souboru.geojson",
  "filters": {
    "property_name": "hodnota"
  }
}
\`\`\`

Pokud data nenajdes, doporuc uzivateli jak preformulovat dotaz.

## Pravidla
- Odpovidej CESKY, pokud uzivatel nepise anglicky.
- Bud strucny, ale informativni.
- Vzdy uvadej, z jakeho datasetu informace pochazi.
- Pokud uzivatel jen konverzuje (pozdrav, dotaz na funkce apod.), odpovez prirozene bez analyzy dat.
- Mas pristup k historii konverzace — navazuj na predchozi zpravy.

## Dostupna GeoJSON data (souhrn)

${geoContext}
`;
}

async function call_ollama(messages: ChatMessage[], model: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    console.log(`[AI] Calling Ollama at: ${OLLAMA_URL}`);

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
            }),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Ollama returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.message?.content || data.response || '';
    } finally {
        clearTimeout(timeout);
    }
}

export async function POST(request: NextRequest) {
    try {
        const data: ChatRequest = await request.json();

        const model = data.model || DEFAULT_MODEL;
        const includeGeo = data.includeGeoData !== false;

        const geoContext = includeGeo ? buildGeoContext() : 'GeoJSON data nebyla vyzadana.';
        const systemPrompt = buildSystemPrompt(geoContext);

        const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...(data.messages || [])
        ];

        const geoFiles = listGeoJsonFiles();
        const systemPromptLen = systemPrompt.length;

        console.log("\n============================================================");
        console.log(`[AI] Model: ${model}`);
        console.log(`[AI] Messages: ${messages.length} (incl. system)`);
        console.log(`[AI] GeoJSON files: ${geoFiles.length}`);
        console.log(`[AI] System prompt size: ${(systemPromptLen / 1024).toFixed(1)} KB`);
        console.log(`[AI] Last user msg: ${messages.filter(m => m.role === 'user').pop()?.content?.slice(0, 200) || 'N/A'}`);
        console.log("------------------------------------------------------------");

        const replyContent = await call_ollama(messages, model);

        console.log(`[AI] Response: ${replyContent.length} chars`);

        let filters = null;
        const filterMatch = replyContent.match(/```json:filters\s*([\s\S]*?)```/);
        if (filterMatch) {
            try {
                filters = JSON.parse(filterMatch[1].trim());
            } catch {
                console.warn('[AI] Failed to parse filter JSON from response.');
            }
        }

        const cleanReply = replyContent
            .replace(/```json:filters\s*[\s\S]*?```/g, '')
            .trim();

        return NextResponse.json({
            reply: cleanReply,
            filters,
            model,
            messageCount: messages.length,
        });

    } catch (error: any) {
        console.error("[AI] Error:", error);

        const isTimeout = error.name === 'AbortError' ||
            error.message?.includes('timeout') ||
            error.code === 'UND_ERR_HEADERS_TIMEOUT';

        const errorMessage = isTimeout
            ? 'Ollama neodpovedel vcas. Model pravdepodobne zpracovava prilis velky kontext. Zkuste kratsi dotaz.'
            : (error.message || 'Internal Server Error');

        return NextResponse.json(
            { error: errorMessage },
            { status: isTimeout ? 504 : 500 }
        );
    }
}
