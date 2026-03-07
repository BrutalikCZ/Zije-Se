import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "gemma3:27b";
const OLLAMA_TIMEOUT_MS = 10 * 60 * 1000;
const USE_GEMINI_THREE = true; // Use Gemini 3 by default
const GEMINI_PRIMARY = 'gemini-3-flash-preview';
const GEMINI_FALLBACK = 'gemini-2.5-flash';

const SRLHF_FILE = path.join(process.cwd(), 'public', 'data', 'guidelines.json');

function loadSRLHFContext(): string {
    try {
        if (!fs.existsSync(SRLHF_FILE)) return '';

        const data = JSON.parse(fs.readFileSync(SRLHF_FILE, 'utf-8'));
        const g = data.guidelines;
        if (!g) return '';

        const parts: string[] = [];

        if (g.avoid?.length > 0) {
            parts.push('VYVARUJ SE:\n' + g.avoid.map((r: any) => `- ${r.rule}`).join('\n'));
        }
        if (g.improve?.length > 0) {
            parts.push('ZLEPŠI:\n' + g.improve.map((r: any) => `- ${r.rule}`).join('\n'));
        }
        if (g.keepDoing?.length > 0) {
            parts.push('POKRAČUJ V:\n' + g.keepDoing.map((r: any) => `- ${r.rule}`).join('\n'));
        }

        if (parts.length === 0) return '';

        const totalRules = (g.avoid?.length || 0) + (g.improve?.length || 0) + (g.keepDoing?.length || 0);
        console.log(`[SRLHF] Loaded ${totalRules} rules from guidelines.json`);

        return `\n# NAUČENÁ PRAVIDLA Z FEEDBACKU UŽIVATELŮ (dodržuj je STRIKTNĚ)\n\n${parts.join('\n\n')}`;
    } catch (err) {
        console.warn('[SRLHF] Failed to load guidelines:', err);
        return '';
    }
}

interface ImplicitFeedback {
    type: 'positive' | 'negative';
    description: string;
}

function processImplicitFeedbackAsync(feedback: ImplicitFeedback, lastAssistantMsg: string, conversationContext: ChatMessage[],) {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';

    const body = {
        type: feedback.type,
        description: `[IMPLICITNÍ] ${feedback.description}`,
        assistantMessage: lastAssistantMsg.slice(0, 800),
        conversationContext: conversationContext
            .filter(m => m.role !== 'system')
            .slice(-6)
            .map(m => ({ role: m.role, content: m.content.slice(0, 300) })),
    };

    fetch(`${baseUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
        .then(res => {
            if (res.ok) console.log(`[SRLHF] Implicit ${feedback.type} feedback processed`);
            else console.warn(`[SRLHF] Feedback API returned ${res.status}`);
        })
        .catch(err => console.warn('[SRLHF] Implicit feedback call failed:', err.message));
}

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
    implicitFeedback: {
        type: 'positive' | 'negative';
        description: string;
    } | null;
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
            samples: matchedFeatures.slice(0, 5), // Reduced to 5 to save context
            matchedProperties: [...matchedPropertyKeys],
        };
    } catch (err: any) {
        console.warn(`[Search] Error reading ${relPath}:`, err.message);
        return null;
    }
}

function serverSideSearch(keywords: string[], selectedFiles: string[], allFiles: string[]): SearchResult[] {
    if (keywords.length === 0) return [];

    let filesToSearch = selectedFiles.length > 0 ? selectedFiles : [];

    // Limits the total number of datasets searched to 10 as per user request
    if (filesToSearch.length > 10) {
        console.warn(`[AI Search] Selected ${filesToSearch.length} files, limiting to 10.`);
        filesToSearch = filesToSearch.slice(0, 10);
    }

    if (filesToSearch.length === 0) {
        console.log(`[AI Search] No files selected, skipping data search.`);
        return [];
    }

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

const EXTRACTION_SYSTEM_PROMPT = `Jsi extraktor klíčových slov a souborů. Uživatel hledá bydlení v České republice.

Tvůj úkol:
1. Extrahuj klíčová slova z dotazu uživatele (typ nemovitosti, požadavky, lokalita, apod.)
2. Podívej se na seznam dostupných GeoJSON souborů a vyber 0–10 souborů, které jsou POTŘEBNÉ pro odpověď. Vybírej podle názvu souboru a cesty. Pokud nevíš, které vybrat, vyber ty nejpravděpodobnější (max 10).
3. Urči, zda je dotaz konverzační (pozdrav, otázka na funkce) nebo analytický (hledá konkrétní data v souborech).
4. Detekuj, zda zpráva uživatele obsahuje IMPLICITNÍ ZPĚTNOU VAZBU.

Pravidla pro souřadnice:
- Pokud uživatel udává souřadnice nebo o nich mluvíš, používej VŽDY formát "lat, lng" (např. 50.12345, 14.56789). NIKDY nepoužívej znak + jako oddělovač.

Odpověz POUZE validním JSON objektem:
{
  "keywords": ["klíčové", "slovo"],
  "selectedFiles": ["cesta/soubor1.geojson"],
  "isConversational": false,
  "implicitFeedback": null
}
`;

function parseExtractionResult(raw: string): ExtractionResult {
    try {
        const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        const parsed = JSON.parse(jsonMatch[0]);

        let implicitFeedback: ExtractionResult['implicitFeedback'] = null;
        if (parsed.implicitFeedback && parsed.implicitFeedback.type) {
            implicitFeedback = {
                type: parsed.implicitFeedback.type === 'positive' ? 'positive' : 'negative',
                description: String(parsed.implicitFeedback.description || '').slice(0, 500),
            };
        }

        return {
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
            selectedFiles: Array.isArray(parsed.selectedFiles) ? parsed.selectedFiles : [],
            isConversational: !!parsed.isConversational,
            implicitFeedback,
        };
    } catch (err) {
        console.warn('[AI] Extraction parse failed, assuming conversational:', err);
        return { keywords: [], selectedFiles: [], isConversational: true, implicitFeedback: null };
    }
}

async function llmStepExtract(userMessage: string, availableFiles: string[], lastAssistantContent: string | null, callLLM: (messages: ChatMessage[]) => Promise<string>): Promise<ExtractionResult> {
    const fileList = availableFiles.length > 0
        ? `Dostupné GeoJSON soubory:\n${availableFiles.map(f => `- ${f}`).join('\n')}`
        : 'Žádné GeoJSON soubory nejsou dostupné.';

    const contextPart = lastAssistantContent
        ? `\nPoslední odpověď AI (pro detekci zpětné vazby):\n"${lastAssistantContent.slice(0, 400)}"\n`
        : '';

    const messages: ChatMessage[] = [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: `${fileList}${contextPart}\nDotaz uživatele: "${userMessage}"` },
    ];

    console.log('[AI Step 1] Extracting keywords...');
    const raw = await callLLM(messages);
    console.log('[AI Step 1] Raw:', raw.slice(0, 500));

    return parseExtractionResult(raw);
}

function buildOllamaResponsePrompt(searchResults: SearchResult[], extraction: ExtractionResult): string {
    const dataSection = buildGeoSearchContext(searchResults);

    return `Jsi ZIJE!SE AI — sebevědomý, nadšený a optimistický asistent pro bydlení v České republice.

## DATA K DISPOZICI
${dataSection}

## JAK ODPOVÍDAT
- Buď stručný.
- **DETAILNÍ POI**: Pro každé zajímavé místo, které najdeš v datech nebo přes vyhledávání, uveď až 5 informací (adresa, telefon, web, hodnocení, apod.). Vypiš VŠECHNA zajímavá místa, která se podařilo najít.
- **SHRNUTÍ (POVINNÉ)**: Na úplný závěr své odpovědi VŽDY přidej sekci '**Shrnutí:**', kde v 1-2 větách shrneš nejdůležitější fakta. **V rámci shrnutí uděl místu přísné a kritické hodnocení na stupnici 0-10 (např. "Hodnocení lokality: 6/10"). Buď velmi kritický a nekompromisní.**

**MAPOVÉ PŘÍKAZY (POVINNÉ):**
### json:location
VŽDY když zmíníš město, obec nebo **VESNICI**, MUSÍŠ přidat json:location blok pro KAŽDÉ místo zvlášť. Bez něj se na mapě nezobrazí obrys! Dělej to u každé zprávy.
\`\`\`json:location
{"place":"Název místa, Česká republika","label":"Popis"}
\`\`\`

### json:pois
\`\`\`json:pois
{"keyword":"hledané místo","placeName":"Město, Česká republika","label":"Popis"}
\`\`\`

### json:filters
\`\`\`json:filters
{"dataset":"soubor.geojson","filters":{"property":"hodnota"}}
\`\`\``;
}

const CONVERSATIONAL_PROMPT = `Jsi ZIJE!SE AI — nadšený, přátelský a sebevědomý asistent pro bydlení v České republice.

Pravidla:
- Odpovídej česky. Buď stručný, pozitivní a přímý.
- Mluv jako člověk, kterého jeho práce baví. Žádné formální fráze.
- Pokud se uživatel ptá co umíš: řekni mu, že mu pomůžeš najít ideální místo k bydlení — stačí říct, co hledá, a ty najdeš konkrétní data, místa v okolí a zobrazíš je na mapě.
- NIKDY nezmiňuj technické detaily (API, databáze, GeoJSON, vyhledávače). Prostě pomáháš.
- Navazuj na předchozí konverzaci. Neopakuj se.
- **MANDATORY CONTOURS**: VŽDY když zmíníš jakékoliv město/obec/vesnici, MUSÍŠ přidat \`\`\`json:location\`\`\` blok.
- **SHRNUTÍ**: Na konec zprávy VŽDY přidej sekci '**Shrnutí:**' (1-2 věty). Do shrnutí přidej i **velmi kritické hodnocení lokality 0-10**. Buď přísný soudce.`;

function buildGeminiFinalPrompt(geoSearchContext: string, placesContext: string | null, extraction: ExtractionResult, anyPlacesFound: boolean,): string {
    return `Jsi ZIJE!SE AI — asistent pro bydlení v ČR.

# DATA K DISPOZICI
${geoSearchContext}
${placesContext || ''}

# JAK ODPOVÍDAT
- Buď stručný, piš v krátkých větách.
- **VÝČET MÍST (POVINNÝ)**: Pokud byla nalezena místa (POI), MUSÍŠ v odpovědi přehledně vypsat VŠECHNY nalezené kategorie a v každé kategorii uvést **VŠECHNA zajímavá nalezená místa**. **U každého místa vypiš až 5 dostupných informací** (např. adresa, kontakt, web, hodnocení). NIKDY žádnou kategorii nevynechávej.
- **DATY PODLOŽENÁ TVRZENÍ**: Tvým hlavním úkolem je potvrzovat nebo vyvracet informace pomocí načtených GeoJSON dat. 
  - Pokud data něco potvrzují (např. školka existuje, místo je v záplavové zóně): Napiš "Potvrzeno mým datasetem: [zjištění]".
  - Pokud data něco vyvrací nebo vylučují (např. místo NENÍ v záplavové zóně): Napiš "Prověřeno mým datasetem: [zjištění]".
  - Buď konkrétní (zmiň ulici, vzdálenost, název souboru neříkej, ale popiš typ dat).
- **SHRNUTÍ (POVINNÉ)**: Na úplný závěr své odpovědi VŽDY přidej sekci '**Shrnutí:**', kde v 1-2 větách shrneš nejdůležitější fakta. **Součástí shrnutí MUSÍ být přísné a kritické hodnocení kvality lokality na stupnici 0-10 (např. "Hodnocení lokality: 3/10"). Buď velmi kritický, nekompromisní a hledej nedostatky.**
- Souřadnice VŽDY ve formátu "lat, lng".

# MAPOVÉ PŘÍKAZY (POVINNÉ)

## 1. json:location — OBRYSY (STRIKTNĚ POVINNÉ)
VŽDY když zmíníš JAKÉKOLIV **město, obec, vesnici, čtvrť, region nebo kraj**, MUSÍŠ pro něj vygenerovat tento blok. Bez výjimky a u všech míst.
Tím se zobrazí jeho OBRYS (geometrie) na mapě. To platí pro VŠECHNA místa, o kterých mluvíš.
\`\`\`json:location
{"place":"Název místa, Česká republika","label":"Zobrazený název"}
\`\`\`

## 2. json:pois — BODY (Školy, služby, parky...)
Používej POUZE pro vyhledání konkrétních BODŮ zájmu. NIKDY pro hledání měst jako takových.
${anyPlacesFound
            ? 'Místa jsou již na mapě, NEPŘIDÁVEJ pois (pokud nechceš hledat něco nového).'
            : `\`\`\`json:pois
{"type":"typ","keyword":"hledané slovo","placeName":"Město, Česká republika","label":"Popis"}
\`\`\`
GOOGLE PLACES TYPY: preschool, primary_school, secondary_school, university, hospital, doctor, pharmacy, restaurant, cafe, park, playground, supermarket, train_station, bus_station, transit_station, gas_station, bank, atm, post_office.`}

## 3. json:filters — FILTR DATASETŮ
\`\`\`json:filters
{"dataset":"soubor.geojson","filters":{"property":"hodnota"}}
\`\`\``;
}

const GEMINI_EXTRACTION_PROMPT = `Jsi extraktor příkazů pro ZIJE!SE AI. Uživatel hledá bydlení v ČR.

Tvůj úkol:
1. Extrahuj klíčová slova pro vyhledávání v GeoJSON souborech.
2. Vyber 0–10 relevantních GeoJSON souborů.
3. **MANDATORY CONTOURS**: Pro KAŽDÉ místo (město, obec, vesnice, čtvrť, část obce, region), které se v dotazu nebo v aktuální konverzaci vyskytuje jako relevantní lokalita, MUSÍŠ vygenerovat SAMOSTATNÝ \`\`\`json:location\`\`\` blok. Bez něj se na mapě nenakreslí obrys! To platí i pro malé vesnice. Pokud se bavíme o Modřicích a Rajhradu, vygeneruj oba. Dělej to u KAŽDÉHO výstupu.
4. **POI SEARCH**: Pokud uživatel hledá služby (školy, lékaře, restaurace atd.), vygeneruj pro KAŽDOU kategorii samostatný \`\`\`json:pois\`\`\` blok. V odpovědi pak vypiš VŠECHNA zajímavá nalezená místa.

STRUKTURA ODPOVĚDI (DODRŽUJ PŘESNĚ):
\`\`\`json:extraction
{
  "keywords": ["klíče"],
  "selectedFiles": [],
  "isConversational": false,
  "implicitFeedback": null
}
\`\`\`

\`\`\`json:location
{"place":"Název místa, Česká republika","label":"Název na mapě"}
\`\`\`

\`\`\`json:pois
{"type":"typ","keyword":"hledané slovo","placeName":"Název místa, Česká republika","label":"Popis"}
\`\`\`

DŮLEŽITÉ: Každý příkaz (location, pois) musí být ve svém vlastním \`\`\`json:blok\`\`\`.
`;

async function geminiStepExtract(userMessage: string, availableFiles: string[], conversationMessages: ChatMessage[], resolvedLocation?: string,): Promise<{ extraction: ExtractionResult; pois: any[] }> {
    const fileList = availableFiles.length > 0
        ? `Dostupné GeoJSON soubory:\n${availableFiles.map(f => `- ${f}`).join('\n')}`
        : 'Žádné GeoJSON soubory nejsou dostupné.';

    const systemContext = conversationMessages
        .filter(m => m.role === 'system')
        .map(m => m.content)
        .join('\n');

    const lastAssistant = [...conversationMessages].reverse().find(m => m.role === 'assistant');
    const assistantContext = lastAssistant
        ? `\nPoslední odpověď AI (pro detekci zpětné vazby):\n"${lastAssistant.content.slice(0, 400)}"`
        : '';

    const messages: ChatMessage[] = [
        { role: 'system', content: GEMINI_EXTRACTION_PROMPT },
    ];

    if (systemContext) {
        messages.push({ role: 'system', content: `Historický kontext konverzace:\n${systemContext}` });
    }

    if (resolvedLocation) {
        messages.push({ role: 'system', content: `AKTUÁLNÍ POLOHA (ZJIŠTĚNO PŘES GPS): ${resolvedLocation}` });
    }

    messages.push({
        role: 'user',
        content: `${fileList}${assistantContext}\n\nDotaz uživatele: "${userMessage}"`,
    });

    console.log('[AI Gemini Step 1] Extracting keywords + POIs...');
    const raw = await call_gemini(messages);
    console.log('[AI Gemini Step 1] Raw:', raw.slice(0, 1000));

    let extraction: ExtractionResult = { keywords: [], selectedFiles: [], isConversational: true, implicitFeedback: null };
    const extractionMatch = raw.match(/```json:extraction\s*([\s\S]*?)```/);

    if (extractionMatch) {
        extraction = parseExtractionResult(extractionMatch[1]);
    } else {
        extraction = parseExtractionResult(raw);
    }

    const pois: any[] = [];
    const poisMatches = Array.from(raw.matchAll(/```json:pois\s*([\s\S]*?)```/g)) as any[];
    for (const m of poisMatches) {
        try { pois.push(JSON.parse(m[1].trim())); } catch (e) { console.warn('Failed to parse POI block', e); }
    }

    // Fallback: if Gemini put POIs inside the extraction JSON (against instructions)
    if (pois.length === 0 && (extraction as any).pois) {
        const nested = (extraction as any).pois;
        if (Array.isArray(nested)) pois.push(...nested);
        else pois.push(nested);
    }
    // Also check for json:location inside extraction
    if ((extraction as any)['json:location'] || (extraction as any).location) {
        // We'll let the final prompt handle typical locations, but extraction should be clean
    }

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

async function call_gemini(messages: ChatMessage[], modelOverride?: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Chybí GEMINI_API_KEY v .env.local.');
    }

    const chosenModel = modelOverride || GEMINI_PRIMARY;

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

    const models = [chosenModel];
    models.push(GEMINI_FALLBACK);

    for (let i = 0; i < models.length; i++) {
        const currentModel = models[i];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

        console.log(`[AI] Calling Gemini API (${currentModel})${i > 0 ? ' [fallback]' : ''}`);

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
                const status = response.status;

                // Fallback on rate limit (429), service unavailable (503), or gateway timeout (504)
                if ((status === 429 || status === 503 || status === 504) && i < models.length - 1) {
                    console.warn(`[AI] ${currentModel} returned ${status}, falling back to ${models[i + 1]}...`);
                    continue;
                }

                throw new Error(`Gemini API ${status}: ${errorText}`);
            }

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!reply) throw new Error('Gemini API nevrátilo platnou odpověď.');

            return reply;
        } catch (err: any) {
            // If it's a fetch error (like ConnectTimeoutError) and we have a fallback, try it
            if (i < models.length - 1) {
                console.warn(`[AI] ${currentModel} fetch failed: ${err.message}, falling back to ${models[i + 1]}...`);
                continue;
            }
            throw err;
        } finally {
            clearTimeout(timeout);
        }
    }

    throw new Error('Všechny Gemini modely selhaly.');
}

async function nominatimResolve(placeName: string): Promise<{ lat: number; lng: number; radius: number } | null> {
    const normalized = placeName.toLowerCase().includes('česká republika')
        ? placeName : `${placeName}, Česká republika`;
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', normalized);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '3');
    url.searchParams.set('countrycodes', 'cz');
    url.searchParams.set('addressdetails', '1');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url.toString(), {
            headers: { 'User-Agent': 'ZijeSe/1.0 (contact@zijese.cz)' },
            signal: controller.signal
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.length) return null;

        const p = data.find((d: any) =>
            d.type === 'city' || d.type === 'town' || d.type === 'village' || d.type === 'municipality'
        ) || data[0];

        const lat = parseFloat(p.lat), lng = parseFloat(p.lon);
        const bb: string[] = p.boundingbox;
        let radius = 2500;
        if (bb?.length === 4) {
            const latSpan = Math.abs(parseFloat(bb[1]) - parseFloat(bb[0]));
            const lngSpan = Math.abs(parseFloat(bb[3]) - parseFloat(bb[2]));
            const km = Math.max(latSpan, lngSpan) * 111;
            radius = Math.max(1500, Math.min(50000, Math.round(km * 1000 / 2) + 500));
        }
        return { lat, lng, radius };
    } catch { return null; }
    finally { clearTimeout(timeout); }
}

async function nominatimReverse(lat: number, lng: number): Promise<string | null> {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'json');
    url.searchParams.set('accept-language', 'cs');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
        const res = await fetch(url.toString(), {
            headers: { 'User-Agent': 'ZijeSe/1.0 (contact@zijese.cz)' },
            signal: controller.signal
        });
        if (!res.ok) return null;
        const data = await res.json();

        // Prefer shorter address (city/village) over full display name
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality;
        if (city) {
            const county = addr.county ? `, okres ${addr.county}` : '';
            return `${city}${county}`;
        }
        return data.display_name || null;
    } catch { return null; }
    finally { clearTimeout(timeout); }
}

const GOOGLE_PLACES_WHITELIST = new Set([
    'school', 'primary_school', 'secondary_school', 'preschool', 'university',
    'hospital', 'doctor', 'pharmacy', 'dentist', 'restaurant', 'cafe', 'bar',
    'bakery', 'supermarket', 'convenience_store', 'park', 'playground', 'gym',
    'stadium', 'bank', 'atm', 'post_office', 'police', 'fire_station', 'city_hall',
    'courthouse', 'library', 'museum', 'movie_theater', 'zoo', 'aquarium',
    'art_gallery', 'church', 'train_station', 'bus_station', 'transit_station',
    'airport', 'parking', 'gas_station', 'car_repair', 'lodging'
]);

async function fetchPlacesForPoi(apiKey: string, poiReq: any): Promise<any[]> {
    const PLACES_BASE = 'https://places.googleapis.com/v1/places';
    const FIELD_MASK = 'places.id,places.displayName,places.location,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating';

    let lat: number | null = poiReq.lat ?? null;
    let lng: number | null = poiReq.lng ?? null;
    let radius = poiReq.radius != null ? Math.max(100, Math.min(50000, Number(poiReq.radius))) : 1000;

    if (poiReq.placeName && (lat == null || lng == null)) {
        const resolved = await nominatimResolve(poiReq.placeName);
        if (resolved) { lat = resolved.lat; lng = resolved.lng; radius = resolved.radius; }
        else {
            const stripped = poiReq.placeName.replace(/,?\s*Česká republika/i, '').trim();
            if (stripped !== poiReq.placeName) {
                const resolved2 = await nominatimResolve(stripped);
                if (resolved2) { lat = resolved2.lat; lng = resolved2.lng; radius = resolved2.radius; }
            }
        }
    }
    if (lat == null || lng == null) {
        console.warn(`[Places] Cannot resolve location for: ${JSON.stringify(poiReq).slice(0, 200)}`);
        return [];
    }

    const originalType = poiReq.type;
    const validatedType = (typeof originalType === 'string' && GOOGLE_PLACES_WHITELIST.has(originalType)) ? originalType : null;
    const searchKeyword = poiReq.keyword || poiReq.label || (!validatedType ? originalType : '') || '';

    const attempts: { method: 'text' | 'nearby'; searchRadius: number; useType: boolean }[] = [];

    if (searchKeyword) {
        attempts.push({ method: 'text', searchRadius: radius, useType: !!validatedType });
        attempts.push({ method: 'text', searchRadius: Math.max(radius * 1.5, 4000), useType: false });
        attempts.push({ method: 'text', searchRadius: Math.max(radius * 3, 12000), useType: false });
    } else if (validatedType) {
        attempts.push({ method: 'nearby', searchRadius: Math.max(radius, 3000), useType: true });
        attempts.push({ method: 'text', searchRadius: Math.max(radius * 2, 6000), useType: true });
    }

    const allFound = new Map<string, any>();

    for (const attempt of attempts) {
        try {
            let placesData: any;

            if (attempt.method === 'text') {
                const query = searchKeyword || poiReq.label || '';
                if (!query) continue;

                const latDelta = attempt.searchRadius / 111000;
                const lngDelta = attempt.searchRadius / (111000 * Math.cos(lat * Math.PI / 180));
                const body: any = {
                    textQuery: query,
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
                if (attempt.useType && validatedType) {
                    body.includedType = validatedType;
                }

                const res = await fetch(`${PLACES_BASE}:searchText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
                    body: JSON.stringify(body),
                });
                if (!res.ok) {
                    // console.warn(`[Places] Text search failed: ${await res.text()}`);
                    continue;
                }
                placesData = await res.json();

            } else {
                const res = await fetch(`${PLACES_BASE}:searchNearby`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELD_MASK },
                    body: JSON.stringify({
                        includedTypes: [validatedType],
                        maxResultCount: 20,
                        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: attempt.searchRadius } },
                        languageCode: 'cs',
                    }),
                });
                if (!res.ok) continue;
                placesData = await res.json();
            }

            const currentResults = (placesData.places || []);
            for (const p of currentResults) {
                if (!allFound.has(p.id)) {
                    allFound.set(p.id, {
                        name: p.displayName?.text || '',
                        address: p.formattedAddress || '',
                        phone: p.nationalPhoneNumber || '',
                        website: p.websiteUri || '',
                        lat: p.location?.latitude,
                        lng: p.location?.longitude,
                        rating: p.rating || null,
                        _category: validatedType || 'other'
                    });
                }
            }
            if (allFound.size >= 10) break;
        } catch (err: any) {
            console.warn(`[Places] Error in attempt:`, err.message);
        }
    }

    if (allFound.size > 0) {
        return Array.from(allFound.values());
    }

    return [];
}

function buildPlacesContextForAI(results: { label: string; places: any[]; found: boolean }[]): string {
    const lines: string[] = [];
    for (const group of results) {
        if (!group.found) {
            lines.push(`### ${group.label} - NENALEZENO (0 míst)`);
            continue;
        }
        lines.push(`### ${group.label} (${group.places.length} míst)`);
        for (const p of group.places.slice(0, 20)) {
            const parts: string[] = [`• ${p.name || 'Bez názvu'}`];
            if (p.address) parts.push(`- Adresa: ${p.address}`);
            if (p.phone) parts.push(`| Tel: ${p.phone}`);
            if (p.website) parts.push(`| Web: ${p.website}`);
            if (p.rating) parts.push(`| Hodnocení: ${p.rating}⭐`);
            lines.push(parts.join(' '));
        }
        if (group.places.length > 20) lines.push(`  ... a dalších ${group.places.length - 20} míst.`);
    }
    return lines.join('\n');
}

function extractConversationContext(messages: ChatMessage[]): {
    coordinateContext: string;
    cleanMessages: ChatMessage[];
} {
    const coordParts: string[] = [];
    const cleanMessages: ChatMessage[] = [];

    for (const msg of messages) {
        if (msg.role === 'system') {
            if (msg.content.includes('zeměpisná šířka') || msg.content.includes('souřadnice') || msg.content.includes('dlaždice')) {
                coordParts.push(msg.content);
            }

            if (msg.content.includes('dotazník') || msg.content.includes('preference bydlení')) {
                coordParts.push(msg.content);
            }
            // Skip everything else
        } else {
            cleanMessages.push(msg);
        }
    }

    return {
        coordinateContext: coordParts.join('\n'),
        cleanMessages,
    };
}

export async function POST(request: NextRequest) {
    let model = DEFAULT_MODEL;
    try {
        const data: ChatRequest = await request.json();
        if (data.model) model = data.model;
        const conversationMessages = data.messages || [];

        const lastUserMsg = [...conversationMessages].reverse().find(m => m.role === 'user');
        if (!lastUserMsg) {
            return NextResponse.json({ error: 'No user message found' }, { status: 400 });
        }

        const lastAssistantMsg = [...conversationMessages].reverse().find(m => m.role === 'assistant');

        const geoFiles = listGeoJsonFiles();

        const { coordinateContext, cleanMessages } = extractConversationContext(conversationMessages);

        const srlhfContext = loadSRLHFContext();

        let resolvedLocationContext = '';
        const allLatMatches = Array.from(coordinateContext.matchAll(/zeměpisná šířka ([\d.]+)/g));
        const allLngMatches = Array.from(coordinateContext.matchAll(/zeměpisná délka ([\d.]+)/g));

        if (allLatMatches.length > 0 && allLngMatches.length > 0) {
            const lastLat = parseFloat(allLatMatches[allLatMatches.length - 1][1]);
            const lastLng = parseFloat(allLngMatches[allLngMatches.length - 1][1]);

            // Check if coordinates changed since previous message (to detect a fresh click)
            let isNewLocation = true;
            if (allLatMatches.length > 1) {
                const prevLat = parseFloat(allLatMatches[allLatMatches.length - 2][1]);
                const prevLng = parseFloat(allLngMatches[allLngMatches.length - 2][1]);
                if (Math.abs(lastLat - prevLat) < 0.0001 && Math.abs(lastLng - prevLng) < 0.0001) {
                    isNewLocation = false;
                }
            }

            console.log(`[AI] Resolving coordinates: ${lastLat}, ${lastLng}...`);
            const city = await nominatimReverse(lastLat, lastLng);
            if (city) {
                const clickStatus = isNewLocation
                    ? "!!! POZOR: Uživatel právě klikl na mapu na NOVÉ místo !!!"
                    : "Uživatel pokračuje ve vyhledávání u stávající polohy.";

                resolvedLocationContext = `${clickStatus}\nAKTUÁLNÍ POLOHA (identifikováno přes GPS): ${city}`;
                console.log(`[AI] Resolved to: ${city} (${isNewLocation ? 'new click' : 'panning/context'})`);
            }
        }

        console.log("\n" + "=".repeat(60));
        console.log(`[AI] Model: ${model}${model === 'gemini' ? ` (${GEMINI_PRIMARY}, fallback: ${GEMINI_FALLBACK})` : ''}`);
        console.log(`[AI] GeoJSON files: ${geoFiles.length}`);
        console.log(`[AI] SRLHF rules: ${srlhfContext ? 'loaded' : 'none'}`);
        console.log(`[AI] Conversation messages: ${conversationMessages.length} (clean: ${cleanMessages.length})`);
        console.log(`[AI] Coordinate context: ${coordinateContext ? 'yes' : 'none'}`);
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
                resolvedLocationContext,
            );
            console.log(`[AI Gemini] Extraction:`, extraction);
            console.log(`[AI Gemini] POI commands: ${extractedPois.length}`);

            if (extraction.implicitFeedback && lastAssistantMsg) {
                console.log(`[SRLHF] LLM detected implicit ${extraction.implicitFeedback.type}: "${extraction.implicitFeedback.description}"`);
                processImplicitFeedbackAsync(extraction.implicitFeedback, lastAssistantMsg.content, conversationMessages);
            }

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
                    console.log(`[AI Gemini]   -> ${places.length} results`);
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
                                    properties: {
                                        name: p.name,
                                        address: p.address,
                                        phone: p.phone,
                                        website: p.website,
                                        _label: result.label,
                                        _category: p._category || 'other'
                                    },
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
                    { role: 'system', content: CONVERSATIONAL_PROMPT + srlhfContext },
                    ...(coordinateContext ? [{ role: 'system' as const, content: `${coordinateContext}\n${resolvedLocationContext}` }] : []),
                    ...cleanMessages,
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
                    { role: 'system', content: finalPrompt + srlhfContext },
                    ...(coordinateContext ? [{ role: 'system' as const, content: `Kontext uživatele:\n${coordinateContext}\n${resolvedLocationContext}` }] : []),
                    ...cleanMessages,
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
                lastAssistantMsg?.content || null,
                (msgs) => call_ollama(msgs, actualModel),
            );
            console.log(`[AI Ollama] Extraction:`, extraction);

            if (extraction.implicitFeedback && lastAssistantMsg) {
                console.log(`[SRLHF] LLM detected implicit ${extraction.implicitFeedback.type}: "${extraction.implicitFeedback.description}"`);
                processImplicitFeedbackAsync(extraction.implicitFeedback, lastAssistantMsg.content, conversationMessages);
            }

            let searchResults: SearchResult[] = [];
            if (!extraction.isConversational && extraction.keywords.length > 0) {
                searchResults = serverSideSearch(extraction.keywords, extraction.selectedFiles, geoFiles);
            }
            console.log(`[AI Ollama] Search: ${searchResults.length} files with matches`);

            const systemPrompt = (extraction.isConversational
                ? CONVERSATIONAL_PROMPT
                : buildOllamaResponsePrompt(searchResults, extraction)) + srlhfContext;

            const step3Messages: ChatMessage[] = [
                { role: 'system', content: systemPrompt },
                ...(coordinateContext ? [{ role: 'system' as const, content: coordinateContext }] : []),
                ...cleanMessages,
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
            geminiModel: model === 'gemini' ? GEMINI_PRIMARY : undefined,
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
            if (model === 'gemini') {
                errorMessage = "Nepodařilo se připojit ke Gemini API. Zkontrolujte své internetové připojení nebo API klíč.";
            } else {
                errorMessage = `Ollama server je nedostupný na ${OLLAMA_URL}. Spusťte prosím Ollama nebo zkontrolujte připojení.`;
            }
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
