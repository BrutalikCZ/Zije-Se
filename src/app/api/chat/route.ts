import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const DEFAULT_MODEL = "gpt-oss:latest";

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        const fullPrompt = data.prompt || '';
        const model = data.model || DEFAULT_MODEL;

        console.log("\n" + "============================================================");
        console.log(`[AI DEBUG] Incoming Request (Model: ${model})`);
        console.log("------------------------------------------------------------");
        console.log(fullPrompt);
        console.log("------------------------------------------------------------");
        console.log("waiting for ollama...\n");

        const ollamaPayload = {
            model: model,
            prompt: fullPrompt,
            stream: false
        };

        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ollamaPayload)
        });

        if (!response.ok) {
            throw new Error(`Ollama API responded with status: ${response.status}`);
        }

        const ollamaResponse = await response.json();
        const replyText = ollamaResponse.response || '';

        console.log(`[AI DEBUG] Response sent (${replyText.length} chars).`);

        return NextResponse.json({ reply: replyText });
    } catch (error: any) {
        console.error("AI Proxy Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
