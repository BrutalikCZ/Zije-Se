import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "gemma3:27b";
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

interface ExtractionResult {
    keywords: string[];
    selectedFiles: string[];
    isConversational: boolean;
}

interface SearchResult {
    file: string;
    matchedFeatures: number;
    totalFeatures: number;
    samples: Record<string, any>[];
    matchedProperties: string[];
}

function getGeoJsonDir(): string {
    return path.join(process.cwd(), 'public', 'data');
}

function listGeoJsonFiles(dir?: string, prefix?: string): string[] {
    const root = dir || getGeoJsonDir();
    const pfx = prefix || '';
    if (!fs.existsSync(root)) return [];

    const results: string[] = [];
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        const relPath = pfx ? `${pfx}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            results.push(...listGeoJsonFiles(path.join(root, entry.name), relPath));
        } else if (entry.name.endsWith('.geojson')) {
            results.push(relPath);
        }
    }
    return results;
}

function searchGeoJsonFile(relPath: string, keywords: string[]): SearchResult | null {
    try {
        const filePath = path.join(getGeoJsonDir(), relPath);
        if (!fs.existsSync(filePath)) return null;

        const raw = fs.readFileSync(filePath, 'utf-8');
        const geo = JSON.parse(raw);

        if (!geo.features || !Array.isArray(geo.features) || geo.features.length === 0) {
            return null;
        }

        const lowerKeywords = keywords.map(k => k.toLowerCase());
        const matchedFeatures: any[] = [];
        const matchedPropertyKeys = new Set<string>();

        for (const feature of geo.features) {
            const props = feature.properties || {};
            let matched = false;

            for (const [key, val] of Object.entries(props)) {
                const strVal = String(val).toLowerCase();
                const strKey = key.toLowerCase();

                for (const kw of lowerKeywords) {
                    if (strVal.includes(kw) || strKey.includes(kw)) {
                        matched = true;
                        matchedPropertyKeys.add(key);
                        break;
                    }
                }
                if (matched) break;
            }

            if (matched) {
                matchedFeatures.push(props);
            }
        }

        if (matchedFeatures.length === 0) return null;

        return {
            file: relPath,
            matchedFeatures: matchedFeatures.length,
            totalFeatures: geo.features.length,
            samples: matchedFeatures.slice(0, 10),
            matchedProperties: [...matchedPropertyKeys],
        };
    } catch (err: any) {
        console.warn(`[Search] Error reading ${relPath}:`, err.message);
        return null;
    }
}

function serverSideSearch(keywords: string[], selectedFiles: string[], allFiles: string[]): SearchResult[] {
    if (keywords.length === 0) return [];

    const filesToSearch = selectedFiles.length > 0 ? selectedFiles : allFiles;
    console.log(`[AI Search] Searching ${filesToSearch.length} files for: [${keywords.join(', ')}]`);

    const results: SearchResult[] = [];
    for (const filename of filesToSearch) {
        const result = searchGeoJsonFile(filename, keywords);
        if (result) {
            results.push(result);
            console.log(`[AI Search]   ${filename}: ${result.matchedFeatures} matches`);
        }
    }
    return results;
}

function buildGeoSearchContext(searchResults: SearchResult[]): string {
    if (searchResults.length === 0) {
        return 'Nebyly nalezeny žádné relevantní záznamy v GeoJSON databázi.';
    }

    const parts = searchResults.map(r => {
        const samplesStr = r.samples
            .map((s, i) => `    ${i + 1}. ${JSON.stringify(s)}`)
            .join('\n');
        return [
            `Soubor: ${r.file}`,
            `  Nalezeno: ${r.matchedFeatures} z ${r.totalFeatures} záznamů`,
            `  Klíčové vlastnosti: ${r.matchedProperties.join(', ')}`,
            `  Ukázky (max 10):`,
            samplesStr,
        ].join('\n');
    });

    return `Výsledky vyhledávání v GeoJSON databázi:\n\n${parts.join('\n\n')}`;
}

const EXTRACTION_SYSTEM_PROMPT = `Jsi extraktor klíčových slov. Uživatel hledá bydlení v České republice.

Tvůj úkol:
1. Extrahuj klíčová slova z dotazu uživatele (typ nemovitosti, požadavky, lokalita, apod.)
2. Podívej se na seznam dostupných GeoJSON souborů a vyber 0–5 souborů, které mohou být relevantní. Vybírej podle názvu souboru a cesty.
3. Urči, zda je dotaz konverzační (pozdrav, otázka na funkce) nebo analytický (hledá konkrétní data).

Odpověz POUZE validním JSON objektem, nic jiného:
{
  "keywords": ["klíčové", "slovo", "další"],
  "selectedFiles": ["cesta/soubor1.geojson", "cesta/soubor2.geojson"],
  "isConversational": false
}

Pokud je dotaz konverzační (pozdrav, díky, jak to funguje apod.), vrať:
{
  "keywords": [],
  "selectedFiles": [],
  "isConversational": true
}`;

function parseExtractionResult(raw: string): ExtractionResult {
    try {
        const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
            selectedFiles: Array.isArray(parsed.selectedFiles) ? parsed.selectedFiles : [],
            isConversational: !!parsed.isConversational,
        };
    } catch (err) {
        console.warn('[AI] Extraction parse failed, assuming conversational:', err);
        return { keywords: [], selectedFiles: [], isConversational: true };
    }
}

async function llmStepExtract(userMessage: string, availableFiles: string[], callLLM: (messages: ChatMessage[]) => Promise<string>): Promise<ExtractionResult> {
    const fileList = availableFiles.length > 0
        ? `Dostupné GeoJSON soubory:\n${availableFiles.map(f => `- ${f}`).join('\n')}`
        : 'Žádné GeoJSON soubory nejsou dostupné.';

    const messages: ChatMessage[] = [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: `${fileList}\n\nDotaz uživatele: "${userMessage}"` },
    ];

    console.log('[AI Step 1] Extracting keywords...');
    const raw = await callLLM(messages);
    console.log('[AI Step 1] Raw:', raw.slice(0, 500));

    return parseExtractionResult(raw);
}

function buildOllamaResponsePrompt(searchResults: SearchResult[], extraction: ExtractionResult): string {
    const dataSection = buildGeoSearchContext(searchResults);

    return `Jsi inteligentní asistent platformy ZIJE!SE — pomáháš uživatelům najít ideální místo k bydlení v České republice.

## Kontext analýzy

Extrahovaná klíčová slova: ${extraction.keywords.join(', ') || '(žádná)'}
Prohledané soubory: ${extraction.selectedFiles.join(', ') || '(žádné)'}

## ${dataSection}

## PŘÍKAZY PRO MAPU (používej je VŽDY když uživatel hledá nějaké místo)

Když uživatel chce najít místo určitého typu, VŽDY přidej blok json:pois.
Použij souřadnice z kontextu dlaždice nebo ze zprávy uživatele.

ZKRATKOVÉ KLÍČE:
  amenity: pharmacy, hospital, doctors, dentist, school, kindergarten, university, library,
           bank, atm, post_office, police, fire_station, fuel, charging_station,
           restaurant, cafe, fast_food, bar, pub, cinema, theatre, townhall, courthouse,
           bus_station, parking, veterinary, marketplace
  shop: supermarket, convenience, bakery, butcher, greengrocer, clothes, electronics,
        hardware, furniture, car, bicycle, books, sports, florist, pet, optician,
        wholesale, cash_and_carry
  leisure: park, playground, sports_centre, swimming_pool, fitness_centre, stadium,
           nature_reserve, garden

FILTROVÁNÍ ŠKOL:
  ZŠ: amenity=school + "nameFilter": "ZŠ|Základní škola|základní škola"
  SŠ: amenity=school + "nameFilter": "SŠ|SPŠ|SOŠ|SOU|Gymnázium|gymnázium|Střední škola"
  ZUŠ: amenity=school + "nameFilter": "ZUŠ|Základní umělecká"
  VŠ: amenity=university
  MŠ: amenity=kindergarten

GENERICKÉ TAGY:
  obecní úřad: "tag": ["amenity=townhall", "office=government"]
  soud: "tag": "amenity=courthouse"
  muzeum: "tag": "tourism=museum"
  pošta: "tag": "amenity=post_office"

Příklad:
\`\`\`json:pois
{
  "amenity": "pharmacy",
  "lat": 50.0477,
  "lng": 15.7583,
  "radius": 1000,
  "label": "Lékárny v okolí"
}
\`\`\`

Zobrazení města/oblasti:
\`\`\`json:location
{
  "place": "Praha 6, Česká republika",
  "label": "Praha 6"
}
\`\`\`

GeoJSON filtr:
\`\`\`json:filters
{
  "dataset": "soubor.geojson",
  "filters": { "property": "hodnota" }
}
\`\`\`

## Instrukce
1. Odpovídej srozumitelně a ČESKY.
2. Pokud data neodpovídají, řekni to upřímně.
3. Navazuj na předchozí konverzaci.
4. Buď stručný — max 2-3 odstavce.
5. NIKDY nevymýšlej URL.
6. NIKDY nepoužívej placeholder text.`;
}

const CONVERSATIONAL_PROMPT = `Jsi inteligentní asistent platformy ZIJE!SE. Pomáháš uživatelům najít ideální místo k bydlení v České republice.

Pravidla:
- Odpovídej česky, pokud uživatel nepíše anglicky.
- Buď přátelský a stručný.
- Pokud se uživatel ptá na funkce, vysvětli mu že může:
  1. Zadat požadavky na bydlení (např. "Chci byt s balkonem v Praze")
  2. AI extrahuje klíčová slova a prohledá GeoJSON datasety + Google Places
  3. Nalezené výsledky se zobrazí na mapě
- Navazuj na předchozí konverzaci.`;

function buildGeminiFinalPrompt(geoSearchContext: string, placesContext: string | null, extraction: ExtractionResult, anyPlacesFound: boolean,): string {
    return `Jsi "ZIJE!SE AI" — přátelský, empatický a vysoce praktický asistent pro lidi, kteří hledají bydlení v České republice.

# TVŮJ POSTUP (dodržuj přesně):

## 1. SHRNUTÍ DAT
Máš k dispozici tato data:

### Extrahovaná klíčová slova: ${extraction.keywords.join(', ') || '(žádná)'}
### Prohledané soubory: ${extraction.selectedFiles.join(', ') || '(žádné)'}

### Výsledky z GeoJSON databáze:
${geoSearchContext}

${placesContext ? `### Výsledky z Google Places:\n${placesContext}` : '### Google Places: nebylo vyhledáváno.'}

## 2. VYHODNOCENÍ PŘESNOSTI
Zhodnoť, jak přesně nalezená data odpovídají požadavku uživatele:
- Pokud data pokrývají požadavek dobře, uveď to.
- Pokud data jsou jen částečně relevantní, řekni co chybí.
- Pokud data neodpovídají, buď upřímný a doporuč přeformulaci.

## 3. ODPOVĚĎ
Na základě shrnutí a vyhodnocení odpověz uživateli srozumitelně a ČESKY.
${anyPlacesFound
        ? 'Pokud byla nalezena místa z Google Places, zmiň jejich konkrétní názvy, adresy a kontakty.'
        : ''}

# MAPOVÉ PŘÍKAZY

${anyPlacesFound
        ? 'NEPŘIDÁVEJ json:pois bloky — místa z Google Places jsou již zpracována a zobrazena na mapě.'
        : `Pokud je potřeba vyhledat místa na mapě, přidej json:pois blok.`}

MUSÍŠ přidat json:location blok pro každé konkrétní město nebo oblast, o které mluvíš:
\`\`\`json:location
{
  "place": "Název, Česká republika",
  "label": "Krátký popis"
}
\`\`\`

${!anyPlacesFound ? `
Pokud uživatel hledá místa určitého typu, přidej json:pois blok:
\`\`\`json:pois
{
  "type": "Google Places typ",
  "keyword": "textový dotaz",
  "placeName": "Město, Česká republika",
  "label": "Popis"
}
\`\`\`

Google Places typy: pharmacy, hospital, doctor, dentist, primary_school, secondary_school, preschool, university, restaurant, cafe, bar, bakery, supermarket, convenience_store, park, playground, sports_complex, swimming_pool, fitness_center, bank, atm, post_office, police, fire_station, parking, veterinary_care, gas_station, car_repair, hotel, city_hall, courthouse, museum, movie_theater, library

Školy: ZŠ=primary_school+keyword:"základní škola ZŠ", SŠ=secondary_school+keyword:"střední škola gymnázium", MŠ=keyword:"mateřská škola MŠ školka", VŠ=university
` : ''}

Pokud jsi našel relevantní GeoJSON data, vrať filtr:
\`\`\`json:filters
{
  "dataset": "soubor.geojson",
  "filters": { "property": "hodnota" }
}
\`\`\`

# PRAVIDLA
- Odpovídej ČESKY.
- Buď stručný ale informativní.
- NIKDY nevymýšlej URL — použij Google vyhledávání: [Hledat](https://www.google.com/search?q=...)
- NIKDY nepoužívej placeholder text jako "[název]".
- NEVYMÝŠLEJ SI CENY — uváděj jako "odhad".
- Navazuj na předchozí konverzaci.`;
}

const GEMINI_EXTRACTION_PROMPT = `Jsi extraktor klíčových slov a příkazů pro mapovou aplikaci. Uživatel hledá bydlení v České republice.

Tvůj úkol:
1. Extrahuj klíčová slova z dotazu (typ nemovitosti, požadavky, lokalita, atd.)
2. Ze seznamu GeoJSON souborů vyber 0–5 relevantních podle názvu/cesty.
3. Urči, zda je dotaz konverzační nebo analytický.
4. Pokud uživatel hledá konkrétní typ místa, vygeneruj json:pois blok.

Odpověz takto — NEJDŘÍVE JSON blok, pak volitelně mapové příkazy:

\`\`\`json:extraction
{
  "keywords": ["klíčové", "slovo"],
  "selectedFiles": ["cesta/soubor.geojson"],
  "isConversational": false
}
\`\`\`

Pokud uživatel hledá místa, PŘIDEJ json:pois blok (Google Places typy):
\`\`\`json:pois
{
  "type": "pharmacy",
  "placeName": "Pardubice, Česká republika",
  "label": "Lékárny v Pardubicích"
}
\`\`\`

Pokud je dotaz konverzační:
\`\`\`json:extraction
{
  "keywords": [],
  "selectedFiles": [],
  "isConversational": true
}
\`\`\`

Google Places typy: pharmacy, hospital, doctor, dentist, primary_school, secondary_school, preschool, university, restaurant, cafe, bar, bakery, supermarket, convenience_store, park, playground, sports_complex, swimming_pool, fitness_center, bank, atm, post_office, police, fire_station, parking, veterinary_care, gas_station, car_repair, hotel, city_hall, courthouse, museum, movie_theater, library

Školy: ZŠ→type=primary_school+keyword:"základní škola ZŠ", SŠ→type=secondary_school+keyword:"střední škola gymnázium", MŠ→keyword:"mateřská škola MŠ školka" (bez type), VŠ→type=university

Poloha: použij "lat"+"lng" z kontextu NEBO "placeName" s názvem města+", Česká republika".
Pokud použiješ "placeName", NEVKLÁDEJ "radius".
NIKDY nevymýšlej souřadnice.`;

async function geminiStepExtract(userMessage: string, availableFiles: string[], conversationMessages: ChatMessage[],): Promise<{ extraction: ExtractionResult; pois: any[] }> {
    const fileList = availableFiles.length > 0
        ? `Dostupné GeoJSON soubory:\n${availableFiles.map(f => `- ${f}`).join('\n')}`
        : 'Žádné GeoJSON soubory nejsou dostupné.';

    const systemContext = conversationMessages
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n');

    const messages: ChatMessage[] = [
        { role: 'system', content: GEMINI_EXTRACTION_PROMPT },
    ];

    if (systemContext) {
        messages.push({ role: 'system', content: `Kontext konverzace:\n${systemContext}` });
    }

    messages.push({
        role: 'user',
        content: `${fileList}\n\nDotaz uživatele: "${userMessage}"`,
    });

    console.log('[AI Gemini Step 1] Extracting keywords + POIs...');
    const raw = await call_gemini(messages);
    console.log('[AI Gemini Step 1] Raw:', raw.slice(0, 800));

    let extraction: ExtractionResult = { keywords: [], selectedFiles: [], isConversational: true };
    const extractionMatch = raw.match(/```json:extraction\s*([\s\S]*?)```/);
    if (extractionMatch) {
        extraction = parseExtractionResult(extractionMatch[1]);
    } else {
        extraction = parseExtractionResult(raw);
    }

    const poisMatches = Array.from(raw.matchAll(/```json:pois\s*([\s\S]*?)```/g)) as any[];
    const pois = poisMatches
        .map(m => { try { return JSON.parse(m[1].trim()); } catch { return null; } })
        .filter(Boolean);

    return { extraction, pois };
}

async function call_ollama(messages: ChatMessage[], model: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    console.log(`[AI] Calling Ollama at: ${OLLAMA_URL}`);

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, stream: false }),
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

async function call_gemini(messages: ChatMessage[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Chybí GEMINI_API_KEY v .env.local.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let systemInstruction = "";
    const contents: any[] = [];

    for (const msg of messages) {
        if (msg.role === 'system') {
            systemInstruction += msg.content + "\n\n";
        } else {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }
    }

    const body: any = { contents };
    if (systemInstruction) {
        body.systemInstruction = {
            parts: [{ text: systemInstruction.trim() }]
        };
    }

    console.log(`[AI] Calling Gemini API`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`Gemini API ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!reply) throw new Error('Gemini API nevrátilo platnou odpověď.');

        return reply;
    } finally {
        clearTimeout(timeout);
    }
}

async function nominatimResolve(placeName: string): Promise<{ lat: number; lng: number; radius: number } | null> {
    const normalized = placeName.toLowerCase().includes('česká republika')
        ? placeName : `${placeName}, Česká republika`;
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', normalized);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'cz');
    try {
        const res = await fetch(url.toString(), { headers: { 'User-Agent': 'ZijeSe/1.0 (contact@zijese.cz)' } });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.length) return null;
        const p = data[0];
        const lat = parseFloat(p.lat), lng = parseFloat(p.lon);
        const bb: string[] = p.boundingbox;
        let radius = 5000;
        if (bb?.length === 4) {
            const latSpan = Math.abs(parseFloat(bb[1]) - parseFloat(bb[0]));
            const lngSpan = Math.abs(parseFloat(bb[3]) - parseFloat(bb[2]));
            radius = Math.max(2000, Math.min(50000, Math.round(Math.max(latSpan, lngSpan) * 111000 / 2)));
        }
        return { lat, lng, radius };
    } catch { return null; }
}

async function fetchPlacesForPoi(apiKey: string, poiReq: any): Promise<any[]> {
    const PLACES_BASE = 'https://places.googleapis.com/v1/places';
    const FIELD_MASK = 'places.id,places.displayName,places.location,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri';

    let lat: number | null = poiReq.lat ?? null;
    let lng: number | null = poiReq.lng ?? null;
    let radius = poiReq.radius != null ? Math.max(100, Math.min(50000, Number(poiReq.radius))) : 1000;

    if (poiReq.placeName && (lat == null || lng == null)) {
        const resolved = await nominatimResolve(poiReq.placeName);
        if (resolved) { lat = resolved.lat; lng = resolved.lng; radius = resolved.radius; }
    }
    if (lat == null || lng == null) return [];

    try {
        let placesData: any;
        if (poiReq.keyword) {
            const latDelta = radius / 111000;
            const lngDelta = radius / (111000 * Math.cos(lat * Math.PI / 180));
            const body: any = {
                textQuery: poiReq.keyword,
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
            if (poiReq.type && !Array.isArray(poiReq.type)) body.includedType = poiReq.type;
            const res = await fetch(`${PLACES_BASE}:searchText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
                body: JSON.stringify(body),
            });
            if (!res.ok) return [];
            placesData = await res.json();
        } else if (poiReq.type) {
            const types = Array.isArray(poiReq.type) ? poiReq.type : [poiReq.type];
            const res = await fetch(`${PLACES_BASE}:searchNearby`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
                body: JSON.stringify({
                    includedTypes: types,
                    maxResultCount: 20,
                    locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
                    languageCode: 'cs',
                }),
            });
            if (!res.ok) return [];
            placesData = await res.json();
        } else {
            return [];
        }
        return (placesData.places || []).map((p: any) => ({
            name: p.displayName?.text || '',
            address: p.formattedAddress || '',
            phone: p.nationalPhoneNumber || '',
            website: p.websiteUri || '',
            lat: p.location?.latitude,
            lng: p.location?.longitude,
        }));
    } catch { return []; }
}

function buildPlacesContextForAI(results: { label: string; places: any[]; found: boolean }[]): string {
    const lines: string[] = [];
    for (const group of results) {
        if (!group.found) {
            lines.push(`### ${group.label} — NENALEZENO (0 míst)`);
            continue;
        }
        lines.push(`### ${group.label} (${group.places.length} míst)`);
        for (const p of group.places.slice(0, 15)) {
            const parts: string[] = [`• ${p.name || 'Bez názvu'}`];
            if (p.address) parts.push(`— ${p.address}`);
            if (p.phone) parts.push(`| tel: ${p.phone}`);
            if (p.website) parts.push(`| web: ${p.website}`);
            lines.push(parts.join(' '));
        }
        if (group.places.length > 15) lines.push(`  ... a dalších ${group.places.length - 15} míst.`);
    }
    return lines.join('\n');
}

export async function POST(request: NextRequest) {
    try {
        const data: ChatRequest = await request.json();
        const model = data.model || DEFAULT_MODEL;
        const conversationMessages = data.messages || [];

        const lastUserMsg = [...conversationMessages].reverse().find(m => m.role === 'user');
        if (!lastUserMsg) {
            return NextResponse.json({ error: 'No user message found' }, { status: 400 });
        }

        const geoFiles = listGeoJsonFiles();

        console.log("\n" + "=".repeat(60));
        console.log(`[AI] Model: ${model}`);
        console.log(`[AI] GeoJSON files: ${geoFiles.length}`);
        console.log(`[AI] Conversation messages: ${conversationMessages.length}`);
        console.log(`[AI] User query: "${lastUserMsg.content.slice(0, 150)}"`);
        console.log("-".repeat(60));

        let replyContent: string;
        let step1Pois: any[] | null = null;
        let searchMeta: { label: string; count: number; found: boolean }[] | null = null;
        let poiGeojson: any | null = null;
        let _debug: any = null;

        if (model === 'gemini') {
            const { extraction, pois: extractedPois } = await geminiStepExtract(
                lastUserMsg.content,
                geoFiles,
                conversationMessages,
            );
            console.log(`[AI Gemini] Extraction:`, extraction);
            console.log(`[AI Gemini] POI commands: ${extractedPois.length}`);

            step1Pois = extractedPois.length > 0 ? extractedPois : null;

            let geoSearchResults: SearchResult[] = [];
            if (!extraction.isConversational && extraction.keywords.length > 0) {
                geoSearchResults = serverSideSearch(extraction.keywords, extraction.selectedFiles, geoFiles);
            }
            const geoSearchContext = buildGeoSearchContext(geoSearchResults);
            console.log(`[AI Gemini] GeoJSON search: ${geoSearchResults.length} files with matches`);

            let placesContext: string | null = null;
            let anyPlacesFound = false;
            const placesApiKey = process.env.GOOGLE_PLACES_API_KEY;

            if (step1Pois && step1Pois.length > 0 && placesApiKey) {
                const placesResults: { label: string; places: any[]; found: boolean }[] = [];

                for (const poiReq of step1Pois) {
                    console.log(`[AI Gemini] Fetching places: "${poiReq.label || poiReq.type || poiReq.keyword}"`);
                    const places = await fetchPlacesForPoi(placesApiKey, poiReq);
                    console.log(`[AI Gemini]   → ${places.length} results`);
                    placesResults.push({
                        label: poiReq.label || poiReq.keyword || poiReq.type || 'Místa',
                        places,
                        found: places.length > 0,
                    });
                }

                searchMeta = placesResults.map(r => ({ label: r.label, count: r.places.length, found: r.found }));
                anyPlacesFound = placesResults.some(r => r.found);

                if (anyPlacesFound) {
                    const features: any[] = [];
                    for (const result of placesResults) {
                        for (const p of result.places) {
                            if (p.lat != null && p.lng != null) {
                                features.push({
                                    type: 'Feature',
                                    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                                    properties: { name: p.name, address: p.address, phone: p.phone, website: p.website, _label: result.label },
                                });
                            }
                        }
                    }
                    if (features.length > 0) poiGeojson = { type: 'FeatureCollection', features };
                }

                placesContext = buildPlacesContextForAI(placesResults);

                if (!anyPlacesFound) step1Pois = [];
            }

            if (extraction.isConversational) {
                const messages: ChatMessage[] = [
                    { role: 'system', content: CONVERSATIONAL_PROMPT },
                    ...conversationMessages,
                ];
                replyContent = await call_gemini(messages);
            } else {
                const finalPrompt = buildGeminiFinalPrompt(
                    geoSearchContext,
                    placesContext,
                    extraction,
                    anyPlacesFound,
                );

                const messages: ChatMessage[] = [
                    { role: 'system', content: finalPrompt },
                    ...conversationMessages,
                ];

                console.log(`[AI Gemini Step 4] Final call — prompt ${(finalPrompt.length / 1024).toFixed(1)} KB`);
                replyContent = await call_gemini(messages);
            }

            _debug = {
                keywords: extraction.keywords,
                selectedFiles: extraction.selectedFiles,
                isConversational: extraction.isConversational,
                searchResultFiles: geoSearchResults.map(r => ({
                    file: r.file,
                    matches: r.matchedFeatures,
                })),
            };

        } else {
            const actualModel = model === 'gemma' ? DEFAULT_MODEL : model;

            const extraction = await llmStepExtract(
                lastUserMsg.content,
                geoFiles,
                (msgs) => call_ollama(msgs, actualModel),
            );
            console.log(`[AI Ollama] Extraction:`, extraction);

            let searchResults: SearchResult[] = [];
            if (!extraction.isConversational && extraction.keywords.length > 0) {
                searchResults = serverSideSearch(extraction.keywords, extraction.selectedFiles, geoFiles);
            }
            console.log(`[AI Ollama] Search: ${searchResults.length} files with matches`);

            const systemPrompt = extraction.isConversational
                ? CONVERSATIONAL_PROMPT
                : buildOllamaResponsePrompt(searchResults, extraction);

            const step3Messages: ChatMessage[] = [
                { role: 'system', content: systemPrompt },
                ...conversationMessages,
            ];

            console.log(`[AI Ollama] Step 3: prompt ${(systemPrompt.length / 1024).toFixed(1)} KB, ${step3Messages.length} msgs`);
            replyContent = await call_ollama(step3Messages, actualModel);

            _debug = {
                keywords: extraction.keywords,
                selectedFiles: extraction.selectedFiles,
                isConversational: extraction.isConversational,
                searchResultFiles: searchResults.map(r => ({
                    file: r.file,
                    matches: r.matchedFeatures,
                })),
            };
        }

        console.log(`[AI] Final reply: ${replyContent.length} chars`);

        let filters = null;
        const filterMatch = replyContent.match(/```json:filters\s*([\s\S]*?)```/);
        if (filterMatch) {
            try { filters = JSON.parse(filterMatch[1].trim()); }
            catch { console.warn('[AI] Failed to parse filter JSON.'); }
        }

        let pois = null;
        if (step1Pois && step1Pois.length > 0) {
            pois = step1Pois;
        } else {
            const poisMatches = Array.from(replyContent.matchAll(/```json:pois\s*([\s\S]*?)```/g)) as any[];
            const allPois = poisMatches.map(m => {
                try { return JSON.parse(m[1].trim()); } catch { return null; }
            }).filter(Boolean);
            if (allPois.length > 0) pois = allPois;
        }

        let location = null;
        const locationMatches = Array.from(replyContent.matchAll(/```json:location\s*([\s\S]*?)```/g)) as any[];
        const allLocations = locationMatches.map(m => {
            try { return JSON.parse(m[1].trim()); } catch { return null; }
        }).filter(Boolean);
        if (allLocations.length > 0) location = allLocations;

        const cleanReply = replyContent
            .replace(/```json:filters\s*[\s\S]*?```/g, '')
            .replace(/```json:pois\s*[\s\S]*?```/g, '')
            .replace(/```json:location\s*[\s\S]*?```/g, '')
            .replace(/```json:extraction\s*[\s\S]*?```/g, '')
            .trim();

        return NextResponse.json({
            reply: cleanReply,
            filters,
            pois,
            poiGeojson,
            location,
            searchMeta,
            model,
            messageCount: (conversationMessages.length || 0) + 1,
            _debug,
        });

    } catch (error: any) {
        console.error("[AI] Error:", error);

        const isTimeout = error.name === 'AbortError' ||
            error.message?.includes('timeout') ||
            error.code === 'UND_ERR_HEADERS_TIMEOUT';

        const isConnection = error.code === 'ECONNREFUSED' ||
            error.cause?.code === 'ECONNREFUSED' ||
            error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';

        let errorMessage: string;
        let status: number;

        if (isConnection) {
            errorMessage = `Server nedostupný na ${OLLAMA_URL}. Zkontrolujte připojení.`;
            status = 503;
        } else if (isTimeout) {
            errorMessage = 'Model neodpověděl včas. Zkuste kratší dotaz nebo menší model.';
            status = 504;
        } else {
            errorMessage = error.message || 'Internal Server Error';
            status = 500;
        }

        return NextResponse.json({ error: errorMessage }, { status });
    }
}
