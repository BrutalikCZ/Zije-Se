import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gemma3:27b';
const FEEDBACK_MODEL = 'gemini-2.5-flash';
const SRLHF_FILE = path.join(process.cwd(), "public", "data", 'guidelines.json');
const MAX_RULES_PER_CATEGORY = 10;
const LLM_TIMEOUT_MS = 30_000;

interface SRLHFRule {
    rule: string;
    count: number;
    created: string;
    lastReinforced: string;
}

interface SRLHFGuidelines {
    version: number;
    lastUpdated: string;
    totalFeedbackCount: number;
    positiveCount: number;
    negativeCount: number;
    guidelines: {
        avoid: SRLHFRule[];
        improve: SRLHFRule[];
        keepDoing: SRLHFRule[];
    };
}

interface FeedbackRequest {
    type: 'positive' | 'negative';
    description: string;
    assistantMessage: string;
    conversationContext?: Array<{ role: string; content: string }>;
}

interface AnalysisResult {
    avoid: string[];
    improve: string[];
    keepDoing: string[];
}

function loadGuidelines(): SRLHFGuidelines {
    try {
        if (fs.existsSync(SRLHF_FILE)) {
            const data = JSON.parse(fs.readFileSync(SRLHF_FILE, 'utf-8'));

            if (!data.positiveCount) data.positiveCount = 0;
            if (!data.negativeCount) data.negativeCount = 0;
            return data;
        }
    } catch (err) {
        console.warn('[SRLHF] Chyba při načítání pravidel:', err);
    }
    return {
        version: 1,
        lastUpdated: new Date().toISOString(),
        totalFeedbackCount: 0,
        positiveCount: 0,
        negativeCount: 0,
        guidelines: { avoid: [], improve: [], keepDoing: [] },
    };
}

function saveGuidelines(data: SRLHFGuidelines): void {
    const dir = path.dirname(SRLHF_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SRLHF_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('[SRLHF] Pravidla uložena:', {
        avoid: data.guidelines.avoid.length,
        improve: data.guidelines.improve.length,
        keepDoing: data.guidelines.keepDoing.length,
        totalFeedback: data.totalFeedbackCount,
    });
}

async function callGeminiAnalysis(system: string, user: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${FEEDBACK_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents: [{ role: 'user', parts: [{ text: user }] }],
            }),
            signal: controller.signal,
        });
        if (!res.ok) {
            const err = await res.text().catch(() => '');
            throw new Error(`Gemini ${res.status}: ${err.slice(0, 300)}`);
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } finally {
        clearTimeout(timeout);
    }
}

async function callOllamaAnalysis(system: string, user: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    try {
        const res = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                stream: false,
            }),
            signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Ollama ${res.status}`);
        const data = await res.json();
        return data.message?.content || '';
    } finally {
        clearTimeout(timeout);
    }
}

async function callLLMForAnalysis(system: string, user: string): Promise<string> {
    if (GEMINI_API_KEY) {
        try {
            return await callGeminiAnalysis(system, user);
        } catch (err: any) {
            console.warn('[SRLHF] Gemini selhalo, zkouším Ollama:', err.message);
        }
    }

    return await callOllamaAnalysis(system, user);
}

const FEEDBACK_ANALYSIS_PROMPT = `Jsi analytik zpětné vazby pro AI asistenta "ZIJE!SE AI" (asistent pro bydlení v ČR).

Tvůj úkol:
1. Analyzuj zpětnou vazbu uživatele a kontext konverzace
2. Extrahuj STRUČNÁ, AKČNÍ pravidla (každé MAX 12 slov)
3. Kategorizuj:
   - "avoid": čeho se AI má VYVAROVAT (chyby, špatné návyky)
   - "improve": co AI může dělat LÉPE (vylepšení)
   - "keepDoing": co AI dělá DOBŘE (pozitivní aspekty)

DŮLEŽITÉ:
- Pravidla musí být OBECNÁ — použitelná na budoucí konverzace, ne specifická pro tento dotaz
- Max 3 nová pravidla celkem (piš jen to, co opravdu vyplývá z feedbacku)
- Piš ČESKY
- Pokud feedback neobsahuje užitečnou informaci pro pravidla, vrať prázdná pole
- NEDUPLIKUJ existující pravidla — pokud podobné existuje, přeskoč

Odpověz POUZE validním JSON (nic jiného):
{
  "avoid": ["stručné pravidlo"],
  "improve": ["stručné pravidlo"],
  "keepDoing": ["stručné pravidlo"]
}`;

const CONSOLIDATION_PROMPT = `Jsi správce pravidel AI asistenta. Seznam pravidel je příliš dlouhý.

Tvůj úkol:
1. Slouč podobná pravidla do jednoho
2. Odstraň příliš specifická nebo redundantní pravidla
3. Ponech MAX ##MAX## nejdůležitějších v každé kategorii
4. Číslo v závorce [×N] značí, kolikrát bylo pravidlo posíleno — vyšší = důležitější
5. Pravidla musí být stručná (max 12 slov) a obecně aplikovatelná

Odpověz POUZE validním JSON:
{
  "avoid": ["sloučené pravidlo 1", "pravidlo 2"],
  "improve": ["sloučené pravidlo 1"],
  "keepDoing": ["sloučené pravidlo 1", "pravidlo 2"]
}`;

function formatExistingRulesForAnalysis(guidelines: SRLHFGuidelines): string {
    const { avoid, improve, keepDoing } = guidelines.guidelines;
    const parts: string[] = [];

    if (avoid.length > 0)
        parts.push('VYVAROVAT SE: ' + avoid.map(r => r.rule).join(' • '));
    if (improve.length > 0)
        parts.push('ZLEPŠIT: ' + improve.map(r => r.rule).join(' • '));
    if (keepDoing.length > 0)
        parts.push('POKRAČOVAT: ' + keepDoing.map(r => r.rule).join(' • '));

    return parts.length > 0 ? parts.join('\n') : '(žádná existující pravidla)';
}

function wordSimilarity(a: string, b: string): number {
    const normalize = (s: string) =>
        s.toLowerCase().replace(/[^a-záčďéěíňóřšťúůýž\s]/g, '').split(/\s+/).filter(Boolean);
    const wordsA = new Set(normalize(a));
    const wordsB = new Set(normalize(b));
    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return union > 0 ? intersection / union : 0;
}

function mergeRules(existing: SRLHFRule[], newRules: string[], now: string): SRLHFRule[] {
    const result = [...existing];

    for (const newRule of newRules) {
        const trimmed = newRule?.trim();
        if (!trimmed || trimmed.length < 3) continue;

        let bestMatchIdx = -1;
        let bestSimilarity = 0;

        for (let i = 0; i < result.length; i++) {
            const sim = wordSimilarity(result[i].rule, trimmed);
            if (sim > bestSimilarity) {
                bestSimilarity = sim;
                bestMatchIdx = i;
            }
        }

        if (bestMatchIdx >= 0 && bestSimilarity > 0.5) {
            result[bestMatchIdx].count += 1;
            result[bestMatchIdx].lastReinforced = now;
            console.log(`[SRLHF] Posíleno pravidlo [×${result[bestMatchIdx].count}]: "${result[bestMatchIdx].rule}" (sim=${bestSimilarity.toFixed(2)})`);
        } else {
            result.push({
                rule: trimmed,
                count: 1,
                created: now,
                lastReinforced: now,
            });
            console.log(`[SRLHF] Nové pravidlo: "${trimmed}"`);
        }
    }

    return result;
}

function parseAnalysisJSON(raw: string): AnalysisResult {
    try {
        const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('No JSON object found');
        const parsed = JSON.parse(match[0]);
        return {
            avoid: Array.isArray(parsed.avoid) ? parsed.avoid.filter((r: any) => typeof r === 'string' && r.trim()) : [],
            improve: Array.isArray(parsed.improve) ? parsed.improve.filter((r: any) => typeof r === 'string' && r.trim()) : [],
            keepDoing: Array.isArray(parsed.keepDoing) ? parsed.keepDoing.filter((r: any) => typeof r === 'string' && r.trim()) : [],
        };
    } catch (err) {
        console.warn('[SRLHF] Chyba parsování analýzy:', err);
        return { avoid: [], improve: [], keepDoing: [] };
    }
}

async function analyzeFeedback(feedback: FeedbackRequest, existing: SRLHFGuidelines,): Promise<AnalysisResult> {
    const existingRulesText = formatExistingRulesForAnalysis(existing);

    const contextMessages = (feedback.conversationContext || [])
        .slice(-6)
        .map(m => `[${m.role}]: ${m.content.slice(0, 300)}`)
        .join('\n');

    const userPrompt = `## EXISTUJÍCÍ PRAVIDLA (neduplikuj)
${existingRulesText}

## ZPĚTNÁ VAZBA
Typ: ${feedback.type === 'positive' ? '👍 POZITIVNÍ' : '👎 NEGATIVNÍ'}
Popis uživatele: "${feedback.description}"

## ODPOVĚĎ AI (hodnocená)
${feedback.assistantMessage.slice(0, 600)}

## KONTEXT KONVERZACE
${contextMessages || '(bez kontextu)'}`;

    console.log('[SRLHF] Odesílám k analýze...');
    const raw = await callLLMForAnalysis(FEEDBACK_ANALYSIS_PROMPT, userPrompt);
    console.log('[SRLHF] Surový výsledek analýzy:', raw.slice(0, 500));

    return parseAnalysisJSON(raw);
}

async function consolidateIfNeeded(guidelines: SRLHFGuidelines): Promise<SRLHFGuidelines> {
    const { avoid, improve, keepDoing } = guidelines.guidelines;

    const needsConsolidation =
        avoid.length > MAX_RULES_PER_CATEGORY ||
        improve.length > MAX_RULES_PER_CATEGORY ||
        keepDoing.length > MAX_RULES_PER_CATEGORY;

    if (!needsConsolidation) return guidelines;

    console.log('[SRLHF] Spouštím konsolidaci pravidel...');

    const rulesText = `VYVAROVAT SE (${avoid.length}):
${avoid.map(r => `• ${r.rule} [×${r.count}]`).join('\n')}

ZLEPŠIT (${improve.length}):
${improve.map(r => `• ${r.rule} [×${r.count}]`).join('\n')}

POKRAČOVAT (${keepDoing.length}):
${keepDoing.map(r => `• ${r.rule} [×${r.count}]`).join('\n')}`;

    const prompt = CONSOLIDATION_PROMPT.replace('##MAX##', String(MAX_RULES_PER_CATEGORY));

    try {
        const raw = await callLLMForAnalysis(prompt, rulesText);
        const parsed = parseAnalysisJSON(raw);
        const now = new Date().toISOString();

        const toRules = (arr: string[]): SRLHFRule[] =>
            arr.map(r => ({ rule: r.trim(), count: 1, created: now, lastReinforced: now }));

        guidelines.guidelines = {
            avoid: toRules(parsed.avoid).slice(0, MAX_RULES_PER_CATEGORY),
            improve: toRules(parsed.improve).slice(0, MAX_RULES_PER_CATEGORY),
            keepDoing: toRules(parsed.keepDoing).slice(0, MAX_RULES_PER_CATEGORY),
        };

        console.log('[SRLHF] Konsolidace dokončena');
    } catch (err: any) {
        console.warn('[SRLHF] Konsolidace selhala, ořezávám podle počtu:', err.message);
        const trim = (arr: SRLHFRule[]) =>
            [...arr].sort((a, b) => b.count - a.count).slice(0, MAX_RULES_PER_CATEGORY);

        guidelines.guidelines.avoid = trim(avoid);
        guidelines.guidelines.improve = trim(improve);
        guidelines.guidelines.keepDoing = trim(keepDoing);
    }

    return guidelines;
}

export async function POST(request: NextRequest) {
    try {
        const body: FeedbackRequest = await request.json();

        if (!body.type || !['positive', 'negative'].includes(body.type)) {
            return NextResponse.json(
                { error: 'Pole "type" musí být "positive" nebo "negative".' },
                { status: 400 },
            );
        }
        if (!body.assistantMessage) {
            return NextResponse.json(
                { error: 'Pole "assistantMessage" je povinné.' },
                { status: 400 },
            );
        }
        if (body.type === 'negative' && !body.description) {
            return NextResponse.json(
                { error: 'Pro negativní zpětnou vazbu je pole "description" povinné.' },
                { status: 400 },
            );
        }

        console.log(`\n${'='.repeat(55)}`);
        console.log(`[SRLHF] ${body.type === 'positive' ? 'Yes' : 'No'} Zpětná vazba: "${(body.description || '').slice(0, 100)}"`);
        console.log(`${'-'.repeat(55)}`);

        let guidelines = loadGuidelines();

        if (body.type === 'positive' && !body.description) {
            guidelines.totalFeedbackCount += 1;
            guidelines.positiveCount += 1;
            saveGuidelines(guidelines);

            return NextResponse.json({
                success: true,
                message: 'Pozitivní zpětná vazba zaznamenána. Díky!',
                newRules: { avoid: [], improve: [], keepDoing: [] },
                rulesCount: {
                    avoid: guidelines.guidelines.avoid.length,
                    improve: guidelines.guidelines.improve.length,
                    keepDoing: guidelines.guidelines.keepDoing.length,
                },
                totalFeedback: guidelines.totalFeedbackCount,
            });
        }

        const analysis = await analyzeFeedback(body, guidelines);
        console.log('[SRLHF] Výsledek analýzy:', analysis);

        const totalNew = analysis.avoid.length + analysis.improve.length + analysis.keepDoing.length;

        if (totalNew === 0) {
            guidelines.totalFeedbackCount += 1;
            if (body.type === 'positive') guidelines.positiveCount += 1;
            else guidelines.negativeCount += 1;
            saveGuidelines(guidelines);

            return NextResponse.json({
                success: true,
                message: 'Zpětná vazba přijata. Nebyla identifikována nová specifická pravidla.',
                newRules: analysis,
                rulesCount: {
                    avoid: guidelines.guidelines.avoid.length,
                    improve: guidelines.guidelines.improve.length,
                    keepDoing: guidelines.guidelines.keepDoing.length,
                },
                totalFeedback: guidelines.totalFeedbackCount,
            });
        }

        const now = new Date().toISOString();
        guidelines.guidelines.avoid = mergeRules(guidelines.guidelines.avoid, analysis.avoid, now);
        guidelines.guidelines.improve = mergeRules(guidelines.guidelines.improve, analysis.improve, now);
        guidelines.guidelines.keepDoing = mergeRules(guidelines.guidelines.keepDoing, analysis.keepDoing, now);
        guidelines.totalFeedbackCount += 1;
        if (body.type === 'positive') guidelines.positiveCount += 1;
        else guidelines.negativeCount += 1;

        guidelines = await consolidateIfNeeded(guidelines);

        saveGuidelines(guidelines);

        return NextResponse.json({
            success: true,
            message: `Zpětná vazba zpracována. ${totalNew} nových pravidel přidáno.`,
            newRules: analysis,
            rulesCount: {
                avoid: guidelines.guidelines.avoid.length,
                improve: guidelines.guidelines.improve.length,
                keepDoing: guidelines.guidelines.keepDoing.length,
            },
            totalFeedback: guidelines.totalFeedbackCount,
        });
    } catch (error: any) {
        console.error('[SRLHF] Chyba:', error);
        return NextResponse.json(
            { error: error.message || 'Chyba při zpracování zpětné vazby.' },
            { status: 500 },
        );
    }
}

export async function GET() {
    const guidelines = loadGuidelines();
    return NextResponse.json(guidelines);
}

export async function DELETE() {
    try {
        if (fs.existsSync(SRLHF_FILE)) {
            fs.unlinkSync(SRLHF_FILE);
        }
        return NextResponse.json({ success: true, message: 'SRLHF pravidla resetována.' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
