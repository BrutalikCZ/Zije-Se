import { NextRequest, NextResponse } from "next/server";

function normalise_url(raw: string): string {
    let url = raw.replace(/^https?:\/\//i, "");
    const isTcp = /^tcp\./i.test(url);
    return `${isTcp ? "http" : "https"}://${url}`;
}

const OLLAMA_URL = normalise_url(process.env.OLLAMA_URL || "http://25.33.254.156:11434/api/chat");
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "gemma3:27b";

async function call_ollama(messages: { role: string; content: string }[], model: string): Promise<string> {
    console.log(`[AI] Calling Ollama at: ${OLLAMA_URL}`);

    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "ZijeSe/1.0",
            "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ model, messages, stream: false }),
    });

    if (!response.ok) {
        const body = await response.text();
        if (response.status === 403) {
            throw new Error(
                `ngrok 403 — tunel expiroval nebo vyžaduje autentizaci. Body: "${body}"`
            );
        }
        throw new Error(`Ollama error ${response.status}: ${body}`);
    }

    const json = await response.json();
    return json.message?.content ?? "";
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        const messages: { role: string; content: string }[] = data.messages || [];
        const model = data.model || DEFAULT_MODEL;

        if (data.prompt && messages.length === 0) {
            messages.push({ role: "user", content: data.prompt });
        }

        console.log("\n" + "=".repeat(60));
        console.log(`[AI] Model: ${model} | Messages: ${messages.length}`);
        messages.forEach((msg, i) => {
            console.log(`  [${i}] ${msg.role}: ${msg.content.substring(0, 120)}...`);
        });
        console.log("-".repeat(60));

        const reply = await call_ollama(messages, model);

        console.log(`[AI] Reply: ${reply.length} chars`);

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error("[AI] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
