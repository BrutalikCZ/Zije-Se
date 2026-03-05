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

function buildGeoContextGemma(): string {
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


function buildSystemPromptGemma(geoContext: string): string {
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

FILTROVANI SKOL podle typu — VZDY pouzij nameFilter kdyz uzivatel hleda konkretni typ skoly:
  základní škola (ZŠ):           amenity=school + "nameFilter": "ZŠ|Základní škola|základní škola"
  střední škola (SŠ, SPŠ, SOU):  amenity=school + "nameFilter": "SŠ|SPŠ|SOŠ|SOU|Gymnázium|gymnázium|Střední škola|střední škola|Obchodní akademie|Hotelová škola"
  základní umělecká škola (ZUŠ): amenity=school + "nameFilter": "ZUŠ|Základní umělecká"
  vysoká škola / univerzita:     amenity=university (bez nameFilter)
  mateřská škola (MŠ):           amenity=kindergarten (bez nameFilter)

GENERICKE TAGY "key=value" — pouzij pole "tag" pro vsechno ostatni:
  obecni/matricky urad:  "tag": ["amenity=townhall", "office=government"]
  stavebni urad:         "tag": ["amenity=townhall", "office=administrative"]
  soud:                  "tag": "amenity=courthouse"
  velkoobchod/cash&carry:"tag": ["shop=wholesale", "shop=cash_and_carry"]
  trziste/trh:           "tag": "amenity=marketplace"
  muzeum:                "tag": "tourism=museum"
  hotel/penzion:         "tag": ["tourism=hotel", "tourism=guest_house"]
  kostel/modlitebna:     "tag": "amenity=place_of_worship"
  autoservis:            "tag": "shop=car_repair"
  automat bankomat:      "tag": "amenity=atm"
  veterinar:             "tag": "amenity=veterinary"
  posta:                 "tag": "amenity=post_office"
  kino:                  "tag": "amenity=cinema"
  divadlo:               "tag": "amenity=theatre"

Priklad — lekarna u souradnic ze zpravy uzivatele (radius default 1000m, min 10, max 5000):
\`\`\`json:pois
{
  "amenity": "pharmacy",
  "lat": 50.0477,
  "lng": 15.7583,
  "radius": 1000,
  "label": "Lekarny v okoli"
}
\`\`\`

Priklad — zakladni skoly u souradnic (pouzij nameFilter pro spravny typ):
\`\`\`json:pois
{
  "amenity": "school",
  "nameFilter": "ZŠ|Základní škola|základní škola",
  "lat": 50.0477,
  "lng": 15.7583,
  "radius": 2000,
  "label": "Základní školy v okolí"
}
\`\`\`

Priklad — matricky a obecni urad u souradnic:
\`\`\`json:pois
{
  "tag": ["amenity=townhall", "office=government"],
  "lat": 50.0477,
  "lng": 15.7583,
  "radius": 15000,
  "label": "Obecni a matricki urady v okoli"
}
\`\`\`

Priklad — velkoobchod ve meste (uzivatel uvedl mesto):
\`\`\`json:pois
{
  "tag": ["shop=wholesale", "shop=cash_and_carry"],
  "placeName": "Pardubice",
  "label": "Velkoobchody v Pardubicich"
}
\`\`\`

Kdyz uzivatel chce ZOBRAZIT konkretni mesto nebo oblast jako plochu na mape:
\`\`\`json:location
{
  "place": "Praha 6, Ceska republika",
  "label": "Praha 6"
}
\`\`\`
Nazev mista bud specificky — pridej "Ceska republika". Priklady: "Brno, Ceska republika", "Jihomoravsky kraj, Ceska republika".

## Pravidla
- Odpovidej CESKY, pokud uzivatel nepise anglicky.
- Bud strucny, ale informativni.
- Vzdy uvadej, z jakeho datasetu informace pochazi.
- Pokud uzivatel jen konverzuje (pozdrav, dotaz na funkce apod.), odpovez prirozene bez analyzy dat.
- Mas pristup k historii konverzace — navazuj na predchozi zpravy.
- NIKDY nepouzivej placeholder text jako "[nazev mesta]" nebo "[nejblizsi mesto]" — vzdy pouzij skutecny nazev nebo souradnice z kontextu.
- NIKDY nevymyslej ani nehadej webove adresy (URL). Pokud si nejsi 100% jisty spravnou URL, NEPIS ji. Misto toho napis uzivateli, at si sam vyhledá stranku pres Google, nebo pouzij odkaz na Google vyhledavani: [Hledat na Google](https://www.google.com/search?q=nazev+stranky). Chybna URL je horsi nez zadna URL.

## Dostupna GeoJSON data (souhrn)

${geoContext}
`;
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

## 2. json:pois — VYHLEDÁVÁNÍ BODŮ ZÁJMU (Školy, obchody, úřady atd.)
Pokud uživatel hledá místa určitého typu, VŽDY přidej tento blok. Použij souřadnice (lat, lng) z kontextu uživatele nebo hledání zruš přes "placeName".

**PRAVIDLA PRO RADIUS:**
- Výchozí: 1000 m (použij, pokud uživatel neřekne jinak).
- Maximální: 5000 m (i když uživatel řekne "v okruhu 10 km", použij 5000).
- Pokud hledáš v pojmenovaném městě (pomocí \`placeName\`), pole \`radius\` ZCELA VYNECH (vypočítá se automaticky).

**KATEGORIE A FILTRY ŠKOL (DŮLEŽITÉ):**
Zde musíš VŽDY kombinovat \`amenity\` a \`nameFilter\` přesně takto:
- Základní škola: \`"amenity": "school", "nameFilter": "ZŠ|Základní škola|základní škola"\`
- Střední škola: \`"amenity": "school", "nameFilter": "SŠ|SPŠ|SOŠ|SOU|Gymnázium|gymnázium|Střední škola|Obchodní akademie"\`
- ZUŠ: \`"amenity": "school", "nameFilter": "ZUŠ|Základní umělecká"\`
- Vysoká škola: \`"amenity": "university"\` (bez nameFilter)
- Mateřská škola: \`"amenity": "kindergarten"\` (bez nameFilter)

**ZÁKLADNÍ ZKRATKY (amenity / shop / leisure):**
- amenity: pharmacy, hospital, doctors, dentist, bank, post_office, police, restaurant, cafe, parking, veterinary...
- shop: supermarket, convenience, bakery, clothes, hardware, furniture...
- leisure: park, playground, sports_centre, swimming_pool, fitness_centre...

**GENERICKÉ TAGY (pokud nenajdeš zkratku, použij "tag"):**
- Úřady: \`"tag": ["amenity=townhall", "office=government"]\`
- Pošta: \`"tag": "amenity=post_office"\`
- Nemocnice: \`"tag": "amenity=hospital"\`

**PŘÍKLADY SPRÁVNÉHO POUŽITÍ:**

*Příklad 1: Lékárna v okolí uživatele (výchozí radius)*
\`\`\`json:pois
{
  "amenity": "pharmacy",
  "lat": 50.0477,
  "lng": 15.7583,
  "radius": 1000,
  "label": "Lékárny v okolí"
}
\`\`\`

*Příklad 2: Základní školy v okruhu 3 km (vlastní radius + nameFilter)*
\`\`\`json:pois
{
  "amenity": "school",
  "nameFilter": "ZŠ|Základní škola|základní škola",
  "lat": 50.0477,
  "lng": 15.7583,
  "radius": 3000,
  "label": "Základní školy v okolí 3 km"
}
\`\`\`

*Příklad 3: Hledání v konkrétním městě (BEZ radiusu)*
\`\`\`json:pois
{
  "tag":["shop=wholesale", "shop=cash_and_carry"],
  "placeName": "Pardubice, Česká republika",
  "label": "Velkoobchody v Pardubicích"
}
\`\`\`

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

async function call_gemini(messages: ChatMessage[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('V nastavení chybí GEMINI_API_KEY enviroment proměnná. Přidejte ji do .env.local a restartujte server.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let systemInstruction = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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


export async function POST(request: NextRequest) {
    try {
        const data: ChatRequest = await request.json();

        const model = data.model || DEFAULT_MODEL;
        const includeGeo = data.includeGeoData !== false;

        let systemPrompt = "";

        if (model === 'gemini') {
            systemPrompt = buildSystemPromptGemini();
        } else {
            const geoContext = includeGeo ? buildGeoContextGemma() : 'GeoJSON data nebyla vyzadana.';
            systemPrompt = buildSystemPromptGemma(geoContext);
        }

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

        let replyContent;
        if (model === 'gemini') {
            replyContent = await call_gemini(messages);
        } else {
            const actualOllamaModel = model === 'gemma' ? DEFAULT_MODEL : model;
            replyContent = await call_ollama(messages, actualOllamaModel);
        }

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

        let pois = null;
        const poisMatch = replyContent.match(/```json:pois\s*([\s\S]*?)```/);
        if (poisMatch) {
            try {
                pois = JSON.parse(poisMatch[1].trim());
            } catch {
                console.warn('[AI] Failed to parse pois JSON from response.');
            }
        }

        let location = null;
        const locationMatch = replyContent.match(/```json:location\s*([\s\S]*?)```/);
        if (locationMatch) {
            try {
                location = JSON.parse(locationMatch[1].trim());
            } catch {
                console.warn('[AI] Failed to parse location JSON from response.');
            }
        }

        const cleanReply = replyContent
            .replace(/```json:filters\s*[\s\S]*?```/g, '')
            .replace(/```json:pois\s*[\s\S]*?```/g, '')
            .replace(/```json:location\s*[\s\S]*?```/g, '')
            .trim();

        return NextResponse.json({
            reply: cleanReply,
            filters,
            pois,
            location,
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
