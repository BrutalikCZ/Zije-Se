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

function searchGeoJsonFile(filename: string, keywords: string[]): SearchResult | null {
    try {
        const filePath = path.join(getGeoJsonDir(), filename);
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
            file: filename,
            matchedFeatures: matchedFeatures.length,
            totalFeatures: geo.features.length,
            samples: matchedFeatures.slice(0, 10),
            matchedProperties: [...matchedPropertyKeys],
        };
    } catch (err: any) {
        console.warn(`[Search] Error reading ${filename}:`, err.message);
        return null;
    }
}

const EXTRACTION_SYSTEM_PROMPT = `Jsi extraktor klicovych slov. Uzivatel hleda bydleni v Ceske republice.

Tvuj ukol:
1. Extrahuj klicova slova z dotazu uzivatele (typ nemovitosti, pozadavky, lokalita, apod.)
2. Podivej se na seznam dostupnych GeoJSON souboru a vyber 0-5 souboru, ktere mohou byt relevantni pro zodpovezeni dotazu. Vybirej podle nazvu souboru.
3. Urcit, zda je dotaz konverzacni (pozdrav, otazka na funkce) nebo analyticky (hleda konkretni data).

Odpovez POUZE validnim JSON objektem, nic jineho:
{
  "keywords": ["klicove", "slovo", "dalsi"],
  "selectedFiles": ["soubor1.geojson", "soubor2.geojson"],
  "isConversational": false
}

Pokud je dotaz konverzacni (pozdrav, diky, jak to funguje apod.), vrat:
{
  "keywords": [],
  "selectedFiles": [],
  "isConversational": true
}`;

async function ollamaStepExtract(
    userMessage: string,
    availableFiles: string[],
    model: string
): Promise<ExtractionResult> {
    const fileList = availableFiles.length > 0
        ? `Dostupne GeoJSON soubory (kazdy reprezentuje urcity typ geodat):\n${availableFiles.map(f => `- ${f}`).join('\n')}`
        : 'Zadne GeoJSON soubory nejsou dostupne.';

    const messages: ChatMessage[] = [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: `${fileList}\n\nDotaz uzivatele: "${userMessage}"` },
    ];

    console.log('[AI Step 1] Extracting keywords...');
    const raw = await call_ollama(messages, model);
    console.log('[AI Step 1] Raw:', raw.slice(0, 500));

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
        console.warn('[AI Step 1] Parse failed, assuming conversational:', err);
        return { keywords: [], selectedFiles: [], isConversational: true };
    }
}

function ollamaStepSearch(keywords: string[], selectedFiles: string[], allFiles: string[]): SearchResult[] {
    if (keywords.length === 0) return [];

    const filesToSearch = selectedFiles.length > 0 ? selectedFiles : allFiles;
    console.log(`[AI Step 2] Searching ${filesToSearch.length} files for: [${keywords.join(', ')}]`);

    const results: SearchResult[] = [];
    for (const filename of filesToSearch) {
        const result = searchGeoJsonFile(filename, keywords);
        if (result) {
            results.push(result);
            console.log(`[AI Step 2]   ${filename}: ${result.matchedFeatures} matches`);
        }
    }
    return results;
}

function buildOllamaResponsePrompt(searchResults: SearchResult[], extraction: ExtractionResult, geoContext: string): string {
    let dataSection: string;

    if (searchResults.length === 0) {
        dataSection = 'Nebyly nalezeny zadne relevantni zaznamy v GeoJSON datech.';
    } else {
        const parts = searchResults.map(r => {
            const samplesStr = r.samples
                .map((s, i) => `    ${i + 1}. ${JSON.stringify(s)}`)
                .join('\n');
            return [
                `Soubor: ${r.file}`,
                `  Nalezeno: ${r.matchedFeatures} z ${r.totalFeatures} zaznamu`,
                `  Klicove vlastnosti: ${r.matchedProperties.join(', ')}`,
                `  Ukazky (max 10):`,
                samplesStr,
            ].join('\n');
        });
        dataSection = parts.join('\n\n');
    }

    return `Jsi inteligentni asistent platformy ZIJE!SE — pomahas uzivatelum najit idealni misto k bydleni v Ceske republice.

## Kontext analyzy

Extrahovana klicova slova: ${extraction.keywords.join(', ') || '(zadna)'}
Prohledane soubory: ${extraction.selectedFiles.join(', ') || '(zadne)'}

## Vysledky vyhledavani v GeoJSON datech

${dataSection}

## PRIKAZY PRO MAPU (pouzivej je VZDY kdyz uzivatel hleda nejake misto)

Kdyz uzivatel chce najit misto urciteho typu, VZDY pridej blok json:pois.
Pouzij souradnice z kontextu dlazdice nebo ze zpravy uzivatele.

ZKRATKOVE KLICE:
  amenity: pharmacy, hospital, doctors, dentist, school, kindergarten, university, library,
           bank, atm, post_office, police, fire_station, fuel, charging_station,
           restaurant, cafe, fast_food, bar, pub, cinema, theatre, townhall, courthouse,
           bus_station, parking, veterinary, marketplace
  shop: supermarket, convenience, bakery, butcher, greengrocer, clothes, electronics,
        hardware, furniture, car, bicycle, books, sports, florist, pet, optician,
        wholesale, cash_and_carry
  leisure: park, playground, sports_centre, swimming_pool, fitness_centre, stadium,
           nature_reserve, garden

Priklad — lekarna u souradnic (radius default 1000m, min 10, max 5000):
\`\`\`json:pois
{
  "amenity": "pharmacy",
  "lat": 50.0477,
  "lng": 15.7583,
  "radius": 1000,
  "label": "Lekarny v okoli"
}
\`\`\`

Kdyz uzivatel chce ZOBRAZIT konkretni mesto nebo oblast jako plochu na mape:
\`\`\`json:location
{
  "place": "Praha 6, Ceska republika",
  "label": "Praha 6"
}
\`\`\`

Pokud jsi nasel relevantni GeoJSON data, vrat filtrovaci parametry:
\`\`\`json:filters
{
  "dataset": "nazev_souboru.geojson",
  "filters": {
    "property_name": "hodnota"
  }
}
\`\`\`

## Instrukce
1. Na zaklade vysledku vyhledavani odpovez uzivateli srozumitelne a CESKY.
2. Pokud data neodpovidaji dotazu, rekni to uprimne a doporuc preformulaci.
3. Navazuj na predchozi konverzaci.
4. Bud strucny — max 2-3 odstavce.
5. NIKDY nevymyslej webove adresy (URL). Pokud si nejsi jisty, nepis ji.
6. NIKDY nepouzivej placeholder text jako "[nazev mesta]".`;
}

const CONVERSATIONAL_PROMPT = `Jsi inteligentni asistent platformy ZIJE!SE. Pomahas uzivatelum najit idealni misto k bydleni v Ceske republice.

Pravidla:
- Odpovidej cesky, pokud uzivatel nepise anglicky.
- Bud pratelsky a strucny.
- Pokud se uzivatel pta na funkce, vysvetli mu ze muze:
  1. Zadat pozadavky na bydleni (napr. "Chci byt s balkonem v Praze")
  2. AI extrahuje klicova slova a prohleda GeoJSON datasety
  3. Nalezene vysledky se zobrazi na mape
- Navazuj na predchozi konverzaci.`;

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
        throw new Error('V nastavení chybí GEMINI_API_KEY enviroment proměnná. Přidejte ji do .env.local a restartujte server.');
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

    console.log(`[AI] Calling Google Gemini API (gemini-2.5-flash)`);

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
            throw new Error(`Gemini API vrátil chybu ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!reply) {
            throw new Error('Gemini API nevrátilo platnou odpověď.');
        }

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
    const lines: string[] = ['Výsledky vyhledávání míst z Google Places API:'];
    for (const group of results) {
        if (!group.found) {
            lines.push(`\n### ${group.label} — NENALEZENO (0 míst v zadaném okruhu)`);
            continue;
        }
        lines.push(`\n### ${group.label} (nalezeno: ${group.places.length} míst)`);
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

function buildSystemPromptGemini(): string {
    return `Jsi "ZIJE!SE AI" — přátelský, empatický a vysoce praktický asistent pro lidi, kteří hledají bydlení nebo plánují přestěhování v České republice.

Tvojí misí je usnadnit lidem stresující proces stěhování a výběru lokality. Odpovídáš jasně, strukturovaně a vždy se zaměřením na reálnou využitelnost informací.

# TVOJE ROLE A ZÁBĚR TÉMAT
Pomáháš lidem se vším kolem bydlení v ČR. Zahrnuje to širokou škálu témat (neomezuj se):
- **Lokality:** Hodnocení čtvrtí, měst a regionů, srovnání, doporučení podle priorit uživatele.
- **Vzdělávání:** Zápisy do ZŠ/MŠ, kapacity, termíny, spádovost, SŠ a VŠ.
- **Zdravotnictví:** Kde najít lékaře, registrace, dostupnost péče.
- **Úřady a byrokracie:** Přihlášení k trvalému pobytu, katastr nemovitostí, stavební řízení, matrika, poplatky za odpady.
- **Doprava:** MHD, vlaková spojení (PID, IDS atd.), dálnice, parkovací zóny, docházkové vzdálenosti.
- **Kvalita života:** Příroda, sport, kultura, volný čas, bezpečnost, čistota ovzduší, hluk, záplavová území.
- **Trh a sítě:** Ceny nemovitostí a nájmů (uváděj jako aktuální odhady/trendy), životní náklady, internet, pokrytí.
- **Stěhování:** Praktické checklisty (co zařídit, v jakém pořadí, na co nezapomenout).

**ZÁKLADNÍ PRAVIDLO:** Pokud má dotaz byť jen vzdálenou spojitost s výběrem lokality, bydlením, stěhováním nebo životem v novém místě — ZODPOVĚZ HO. Odmítej POUZE dotazy zcela nesouvisející (recepty, programování nesouvisející s mapou, psaní básní apod.).

# TVŮJ POSTUP PŘI ODPOVÍDÁNÍ:
1. **Analyzuj potřeby:** Zjisti, co uživatel hledá a jaké má priority (např. rodina s dětmi potřebuje školky a parky, student MHD a bary).
2. **Buď konkrétní:** Využij znalosti českých reálií. Pokud mluvíš o úřadech, zmiň české termíny (např. "Czech POINT", "trvalý pobyt").
3. **Formátuj přehledně:** Používej odrážky, tučné písmo pro důležité pojmy a udržuj přátelský tón. Vždy odpovídej ČESKY (pokud uživatel explicitně nežádá jiný jazyk).
4. **Vizualizuj:** VŽDY přidej příslušné mapové bloky (json:location a/nebo json:pois), pokud mluvíš o konkrétních místech.

---

# 🗺️ MAP INTERACTION COMMANDS (Kritické instrukce)

Tvůj výstup je propojen s mapovou aplikací. Pro zobrazení míst a bodů zájmu musíš generovat speciální Markdown bloky kódu. MUSÍŠ dodržet přesnou syntaxi.

## 1. json:location — ZOBRAZENÍ OBRYSU MÍSTA NEBO REGIONU
Přidej tento blok VŽDY, když ve své odpovědi zmiňuješ, doporučuješ nebo porovnáváš konkrétní město, obec, čtvrť nebo kraj. Platí to i tehdy, když se uživatel přímo neptá na zobrazení na mapě.
- Můžeš uvést max. 3 tyto bloky v jedné odpovědi (při porovnávání).
- **Název musí být jednoznačný:** Vždy přidej ", Česká republika" (např. "Praha 6, Česká republika", "Řevnice, Česká republika").

\`\`\`json:location
{
  "place": "Vinohrady, Praha, Česká republika",
  "label": "Praha 2 - Vinohrady"
}
\`\`\`

## 2. json:pois — VYHLEDÁVÁNÍ BODŮ ZÁJMU pomocí Google Places API
Pokud uživatel hledá místa určitého typu, VŽDY přidej tento blok. Používáš **Google Places typy** (ne OSM tagy).

### Povinná pole (jedno nebo obě):
- Pole "type" — Google Places typ (viz seznam níže). Použij pro přesné vyhledání kategorie.
- Pole "keyword" — textový dotaz pro vyhledání (použij pro školy s konkrétním typem, nebo kombinaci více pojmů).

### Poloha — PRIORITA (dodržuj přesně v tomto pořadí):
1. **Souřadnice v kontextu** — pokud je v systémové zprávě "Aktuální označené souřadnice" nebo "zeměpisná šířka X, zeměpisná délka Y", použij tyto hodnoty jako pole "lat" + "lng". Toto má NEJVYŠŠÍ PRIORITU.
2. **Název města/obce v aktuální zprávě uživatele** — pokud uživatel píše "v Pardubicích", "u Brna", "v Praze 6" apod., použij pole "placeName" s tímto názvem + ", Česká republika".
3. **Souřadnice z historické systémové zprávy** — pokud nejsou nové souřadnice, použij nejposlednější lat/lng ze souboru konverzace.
4. **Název místa z kontextu konverzace** — použij pole "placeName" s nejposlednějším zmiňovaným místem.

- Pokud použiješ "placeName", pole "radius" ZCELA VYNECH (vypočítá se automaticky).
- **NIKDY nevymýšlej souřadnice.** Použij vždy reálné hodnoty z kontextu.

### Radius:
- Výchozí: 1000 m. Maximum: 5000 m (ani při dotazu "v okruhu 10 km" nepřekračuj 5000).

### SEZNAM GOOGLE PLACES TYPŮ:
**Zdravotnictví:** pharmacy, hospital, doctor, dentist
**Vzdělávání:** primary_school, secondary_school, preschool, university
**Jídlo a pití:** restaurant, cafe, bar, bakery, fast_food_restaurant
**Obchody:** supermarket, convenience_store, clothing_store, hardware_store, furniture_store, book_store, bicycle_store, pet_store, florist
**Volný čas:** park, playground, sports_complex, swimming_pool, fitness_center, stadium, museum, movie_theater, library
**Služby:** bank, atm, post_office, police, fire_station, parking, veterinary_care, gas_station, electric_vehicle_charging_station, car_repair
**Ubytování:** hotel, guest_house
**Úřady:** city_hall, courthouse

### PRAVIDLA PRO ŠKOLY (DŮLEŽITÉ):
- Základní škola (ZŠ): type="primary_school", keyword="základní škola ZŠ"
- Střední škola / Gymnázium: type="secondary_school", keyword="střední škola gymnázium"
- Základní umělecká škola: keyword="základní umělecká škola ZUŠ" (bez type)
- Mateřská školka: keyword="mateřská škola MŠ školka" (bez type — Google Places nemá spolehlivý typ pro MŠ v ČR)
- Vysoká škola / Univerzita: type="university" (bez keyword)

---

# 🚫 STRIKTNÍ ZÁKAZY A PRAVIDLA PROTI HALUCINACÍM

1. **ŽÁDNÉ PLACEHOLDERY:** NIKDY v odpovědi nepoužívej text v závorkách jako "[název nejbližšího města]" nebo "[vložte jméno]". Vždy pracuj s reálnými názvy a souřadnicemi z kontextu dotazu.
2. **NEVYMÝŠLEJ SI WEBOVÉ ADRESY (URL):** Pokud si nejsi 100% jistý konkrétní a funkční adresou webu, VŮBEC ji nepiš. Raději uživateli poraď, ať název vyhledá, NEBO použij bezpečné odkazy na vyhledávání.
   *SPRÁVNĚ:* [Vyhledat ZŠ Pardubice na Google](https://www.google.com/search?q=z%C3%A1kladn%C3%AD+%C5%A1kola+Pardubice)
   *SPRÁVNĚ:* [Zobrazit na Google Maps](https://www.google.com/maps/search/L%C3%A9k%C3%A1rna+Pardubice)
   *ŠPATNĚ:* www.zspardubice.cz (pokud to není ověřený fakt).
3. **NEVYMÝŠLEJ SI PŘESNÉ CENY:** Pokud neznáš aktuální přesnou cenu (nájmů, domů), uveď to jako "odhad" nebo "průměr na trhu".
`;
}

export async function POST(request: NextRequest) {
    try {
        const data: ChatRequest = await request.json();
        const model = data.model || DEFAULT_MODEL;
        const conversationMessages = data.messages || [];

        const geoFiles = listGeoJsonFiles();

        const lastUserMsg = [...conversationMessages].reverse().find(m => m.role === 'user');
        if (!lastUserMsg) {
            return NextResponse.json({ error: 'No user message found' }, { status: 400 });
        }

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
            const systemPrompt = buildSystemPromptGemini();
            const messages: ChatMessage[] = [
                { role: 'system', content: systemPrompt },
                ...conversationMessages,
            ];

            const step1Reply = await call_gemini(messages);
            console.log(`[AI] Gemini Step 1 reply: ${step1Reply.length} chars`);

            const s1PoisMatches = Array.from(step1Reply.matchAll(/```json:pois\s*([\s\S]*?)```/g)) as any[];
            step1Pois = s1PoisMatches
                .map(m => { try { return JSON.parse(m[1].trim()); } catch { return null; } })
                .filter(Boolean);

            const placesApiKey = process.env.GOOGLE_PLACES_API_KEY;

            if (step1Pois.length > 0 && placesApiKey) {
                const placesResults: { label: string; places: any[]; found: boolean }[] = [];
                for (const poiReq of step1Pois) {
                    console.log(`[AI] Fetching places: "${poiReq.label || poiReq.type || poiReq.keyword}"`);
                    const places = await fetchPlacesForPoi(placesApiKey, poiReq);
                    console.log(`[AI]   → ${places.length} results`);
                    placesResults.push({ label: poiReq.label || poiReq.keyword || poiReq.type || 'Místa', places, found: places.length > 0 });
                }

                searchMeta = placesResults.map(r => ({ label: r.label, count: r.places.length, found: r.found }));

                const anyFound = placesResults.some(r => r.found);
                if (anyFound) {
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

                const placesContext = buildPlacesContextForAI(placesResults);
                const poisInstruction = anyFound
                    ? `NEPŘIDÁVEJ json:pois bloky — tato data jsou již zpracována a zobrazena na mapě.`
                    : `Protože nebyla nalezena žádná místa v zadané oblasti, MUSÍŠ přidat json:pois blok pro alternativní místo, které doporučuješ (např. nejbližší velké město). Použij pole "placeName" s názvem alternativního města.`;
                const step2Messages: ChatMessage[] = [
                    ...messages,
                    {
                        role: 'system',
                        content:
                            `${placesContext}\n\n` +
                            `Na základě těchto výsledků vyhledávání napiš finální, kompletní odpověď uživateli. ` +
                            `Pokud byla nějaká místa nalezena, zmiň jejich konkrétní názvy, adresy a případné kontakty. ` +
                            `Pokud nebylo nalezeno nic, informuj uživatele a navrhni alternativy (větší okruh, jiné hledání apod.). ` +
                            `${poisInstruction} ` +
                            `MUSÍŠ přidat json:location blok pro každé konkrétní město nebo oblast, o které mluvíš v odpovědi.`,
                    },
                ];
                console.log(`[AI] Gemini Step 2 call — found: ${anyFound}, groups: ${placesResults.length}`);
                replyContent = await call_gemini(step2Messages);

                if (!anyFound) step1Pois = [];
            } else {
                replyContent = step1Reply;
            }

        } else {
            const actualModel = model === 'gemma' ? DEFAULT_MODEL : model;

            const extraction = await ollamaStepExtract(lastUserMsg.content, geoFiles, actualModel);
            console.log(`[AI] Extraction:`, extraction);

            let searchResults: SearchResult[] = [];
            if (!extraction.isConversational && extraction.keywords.length > 0) {
                searchResults = ollamaStepSearch(extraction.keywords, extraction.selectedFiles, geoFiles);
            }
            console.log(`[AI] Search: ${searchResults.length} files with matches`);

            const systemPrompt = extraction.isConversational
                ? CONVERSATIONAL_PROMPT
                : buildOllamaResponsePrompt(searchResults, extraction, '');

            const step3Messages: ChatMessage[] = [
                { role: 'system', content: systemPrompt },
                ...conversationMessages,
            ];

            console.log(`[AI] Step 3: system prompt ${(systemPrompt.length / 1024).toFixed(1)} KB, ${step3Messages.length} messages`);
            replyContent = await call_ollama(step3Messages, actualModel);

            // Build debug info
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
            error.cause?.code === 'ECONNREFUSED';

        let errorMessage: string;
        let status: number;

        if (isConnection) {
            errorMessage = 'Ollama server nebezi. Spustte "ollama serve" v terminalu.';
            status = 503;
        } else if (isTimeout) {
            errorMessage = 'Model neodpovedel vcas. Zkuste kratsi dotaz nebo mensi model.';
            status = 504;
        } else {
            errorMessage = error.message || 'Internal Server Error';
            status = 500;
        }

        return NextResponse.json({ error: errorMessage }, { status });
    }
}