import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/web-search
 * Body: { queries: string[], maxResultsPerQuery?: number, maxContentLength?: number }
 * Returns: { results: WebSearchResult[] }
 *
 * Ported from mine.py — uses DuckDuckGo HTML search + direct page scraping.
 */

interface WebSearchResult {
    query: string;
    snippets: PageSnippet[];
}

interface PageSnippet {
    url: string;
    domain: string;
    title: string;
    text: string;       // Cleaned, truncated page text
}

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'cs-CZ,cs;q=0.9,en;q=0.8',
};

const FETCH_TIMEOUT = 10_000; // 10s per page

// ── DuckDuckGo Search ────────────────────────────────────────────────────────

async function duckduckgoSearch(query: string, maxResults = 5): Promise<string[]> {
    const encoded = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(url, {
            headers: HEADERS,
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) return [];

        const html = await response.text();
        const urls: string[] = [];

        // Parse DuckDuckGo redirect URLs: //duckduckgo.com/l/?uddg=REAL_URL&...
        const uddgRegex = /\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/g;
        let match;
        while ((match = uddgRegex.exec(html)) !== null) {
            try {
                const realUrl = decodeURIComponent(match[1]);
                if (realUrl.startsWith('http') && !realUrl.includes('duckduckgo.com')) {
                    urls.push(realUrl);
                }
            } catch { /* skip bad URLs */ }
        }

        // Fallback: direct result links
        if (urls.length === 0) {
            const hrefRegex = /class="result__a"[^>]*href="(https?:\/\/[^"]+)"/g;
            while ((match = hrefRegex.exec(html)) !== null) {
                if (!match[1].includes('duckduckgo.com')) {
                    urls.push(match[1]);
                }
            }
        }

        // Deduplicate and limit
        const unique = [...new Set(urls)];
        return unique.slice(0, maxResults);
    } catch (err: any) {
        console.warn(`[WebSearch] DuckDuckGo error for "${query}":`, err.message);
        return [];
    }
}

// ── Page Text Extraction ─────────────────────────────────────────────────────

async function extractPageText(url: string, maxChars = 3000): Promise<PageSnippet | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(url, {
            headers: HEADERS,
            signal: controller.signal,
            redirect: 'follow',
        });
        clearTimeout(timeout);

        if (!response.ok) return null;

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) return null;

        const html = await response.text();

        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Remove unwanted tags
        let cleaned = html
            // Remove script, style, nav, footer, header, aside, form, svg, iframe
            .replace(/<(script|style|nav|footer|header|aside|noscript|iframe|form|svg|button)[^>]*>[\s\S]*?<\/\1>/gi, '')
            // Remove remaining HTML tags
            .replace(/<[^>]+>/g, ' ')
            // Decode common entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#\d+;/g, ' ')
            // Remove URLs
            .replace(/https?:\/\/\S+/g, '')
            // Remove emails
            .replace(/\S+@\S+\.\S+/g, '')
            // Normalize whitespace
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n');

        // Filter out short lines (navigation, menus)
        const lines = cleaned.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 30);

        let text = lines.join('\n').trim();

        // Truncate to maxChars
        if (text.length > maxChars) {
            text = text.slice(0, maxChars) + '...';
        }

        // Skip if too short (probably a login page or error)
        if (text.length < 100) return null;

        const domain = new URL(url).hostname.replace('www.', '');

        return { url, domain, title, text };
    } catch {
        return null;
    }
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const queries: string[] = Array.isArray(body.queries) ? body.queries.slice(0, 3) : [];
        const maxPerQuery = Math.min(body.maxResultsPerQuery || 3, 5);
        const maxContentLength = Math.min(body.maxContentLength || 2000, 5000);

        if (queries.length === 0) {
            return NextResponse.json({ results: [] });
        }

        console.log(`[WebSearch] Searching ${queries.length} queries, max ${maxPerQuery} results each`);

        const results: WebSearchResult[] = [];

        for (const query of queries) {
            console.log(`[WebSearch] Query: "${query}"`);
            const urls = await duckduckgoSearch(query, maxPerQuery);
            console.log(`[WebSearch]   Found ${urls.length} URLs`);

            const snippets: PageSnippet[] = [];

            for (const url of urls) {
                const snippet = await extractPageText(url, maxContentLength);
                if (snippet) {
                    snippets.push(snippet);
                    console.log(`[WebSearch]   ✓ ${snippet.domain} (${snippet.text.length} chars)`);
                }
            }

            results.push({ query, snippets });
        }

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('[WebSearch] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
