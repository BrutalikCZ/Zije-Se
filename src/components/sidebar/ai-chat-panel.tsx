import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Info, BotMessageSquare, Settings2, Lock, Check, Trash2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { SidebarLayout } from './sidebar-layout';

interface AIChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    onOpenAiSettings: () => void;
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ThinkingStep {
    text: string;
    done: boolean;
}

const MAX_HISTORY_PAIRS = 10;

function extract_json(text: string): any {
    try { return JSON.parse(text.trim()); } catch {}
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) { try { return JSON.parse(fence[1].trim()); } catch {} }
    const obj = text.match(/\{[\s\S]*\}/);
    if (obj) { try { return JSON.parse(obj[0]); } catch {} }
    return null;
}

const SYSTEM_PROMPT =
    'Jsi inteligentní asistent pro analýzu míst a lokalit v České republice. ' +
    'Pokud ti jsou poskytnuta geodata z databáze, využij je ve své odpovědi – uveď konkrétní místa, názvy obcí nebo zařízení. ' +
    'Pokud geodata nejsou k dispozici nebo nejsou relevantní, odpovídej na základě obecných znalostí. ' +
    'Odpovídej vždy v jazyce uživatele.';

export function AIChatPanel({ isOpen, onClose, isCollapsed, setIsCollapsed, onOpenAiSettings }: AIChatPanelProps) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const isLoggedIn = !!user;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
    const [contextNote, setContextNote] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        const handleContextUpdate = () => {
            const state = (window as any).CurrentTileContext;
            if (state && state.id) {
                setContextNote(`Aktualizován kontext na dlaždici: ${state.id}`);
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `AI context updated to Tile ${state.id}`,
                }]);
            }
        };
        window.addEventListener('tileContextUpdated', handleContextUpdate);
        return () => window.removeEventListener('tileContextUpdated', handleContextUpdate);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinkingSteps, contextNote]);

    const build_API_messages = (conversation_history: Message[]) => {
        const api_messages: { role: string; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT },
        ];

        const tile_context = (window as any).CurrentTileContext;
        if (tile_context) {
            api_messages.push({
                role: 'system',
                content: `Kontext aktuální dlaždice na mapě: ${JSON.stringify(tile_context)}`,
            });
        }

        const chat_only = conversation_history.filter(m => m.role !== 'system');
        const trimmed = chat_only.slice(-MAX_HISTORY_PAIRS * 2);
        for (const message of trimmed) {
            api_messages.push({ role: message.role, content: message.content });
        }

        return api_messages;
    };

    const advanceStep = (text: string) => {
        setThinkingSteps(prev => [
            ...prev.map(s => ({ ...s, done: true })),
            { text, done: false },
        ]);
    };

    const handle_send = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(updatedMessages);
        setIsLoading(true);
        setThinkingSteps([{
            text: language === 'cs' ? 'Analyzuji požadavky...' : 'Analyzing requirements...',
            done: false,
        }]);

        try {
            let selectedFiles: string[] = [];

            try {
                const indexRes = await fetch('/api/geojson-index');
                if (indexRes.ok) {
                    const { files: geoFiles } = await indexRes.json();

                    const fileListStr = (geoFiles as { path: string }[])
                        .slice(0, 150)
                        .map(f => f.path)
                        .join('\n');

                    const selectionMessages = [
                        {
                            role: 'system',
                            content:
                                'Odpovídej POUZE validním JSON objektem bez markdownu, uvozovek nebo jiného textu kolem.',
                        },
                        {
                            role: 'user',
                            content:
                                `Dotaz uživatele: "${userMessage}"\n\n` +
                                `Dostupné GeoJSON soubory (každý reprezentuje určitý typ geodat):\n${fileListStr}\n\n` +
                                `Vyber 0–5 souborů, které mohou být relevantní pro zodpovězení dotazu. ` +
                                `Vrať JSON ve formátu: {"selectedFiles": ["relativni/cesta.geojson"]}`,
                        },
                    ];

                    const selRes = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messages: selectionMessages }),
                    });

                    if (selRes.ok) {
                        const selData = await selRes.json();
                        const parsed = extract_json(selData.reply || '');
                        if (parsed) {
                            selectedFiles = Array.isArray(parsed.selectedFiles)
                                ? (parsed.selectedFiles as string[]).slice(0, 5)
                                : [];
                        }
                    }
                }
            } catch {
                // Ignore please
            }

            let geoContext = '';

            if (selectedFiles.length > 0) {
                advanceStep(language === 'cs' ? 'Prohledávám databázi lokalit...' : 'Searching location database...',);

                try {
                    const searchRes = await fetch('/api/geojson-search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePaths: selectedFiles }),
                    });

                    if (searchRes.ok) {
                        const { features } = await searchRes.json();
                        if (Array.isArray(features) && features.length > 0) {
                            geoContext =
                                `Relevantní geodata nalezená v databázi:\n` +
                                JSON.stringify(features.slice(0, 15), null, 2);
                        }
                    }
                } catch {
                    // Ignore please
                }
            }

            advanceStep(language === 'cs' ? 'Formuluji odpověď...' : 'Formulating response...',);

            const apiMessages = build_API_messages(updatedMessages);

            if (geoContext) {
                apiMessages.splice(1, 0, { role: 'system', content: geoContext });
            }

            const finalRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages }),
            });

            if (!finalRes.ok) throw new Error('Network error');

            const finalData = await finalRes.json();
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: finalData.reply || (language === 'cs' ? 'Chyba: prázdná odpověď.' : 'Error: empty response.'),
                },
            ]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'system',
                    content: language === 'cs'
                        ? 'Chyba při komunikaci s AI.'
                        : 'Error communicating with AI.',
                },
            ]);
        } finally {
            setIsLoading(false);
            setThinkingSteps([]);
        }
    };

    const aiSettingsButton = (
        <button
            onClick={onOpenAiSettings}
            className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
            title={language === 'cs' ? 'Nastavení AI' : 'AI Settings'}
        >
            <Settings2 size={isCollapsed ? 20 : 18} />
        </button>
    );

    return (
        <SidebarLayout
            isOpen={isOpen}
            onClose={onClose}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            zIndex={10}
            collapsedIcon={<BotMessageSquare size={20} />}
            collapsedIconTitle="Zije!Se AI"
            extraBottomControls={aiSettingsButton}
        >
            {/* Header */}
            <div className="text-center shrink-0 mb-6 mt-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white dark:text-black">
                        {language === 'cs' ? 'ZIJE!SE AI' : 'ZIJE!SE AI'}
                    </h1>
                    {messages.length > 0 && !isLoading && (
                        <button
                            onClick={() => { setMessages([]); setContextNote(null); }}
                            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-white/5 dark:bg-black/5 text-white/50 dark:text-black/50 hover:bg-red-500/10 hover:text-red-400 dark:hover:text-red-500 transition-colors border border-white/10 dark:border-black/10"
                            title={language === 'cs' ? 'Vymazat historii' : 'Clear history'}
                        >
                            <Trash2 size={11} />
                            {language === 'cs' ? 'Vymazat' : 'Clear'}
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 px-2">
                    {language === 'cs'
                        ? 'Inteligentní asistent pro analýzu míst a lokalit'
                        : 'Intelligent assistant for analyzing places and locations'}
                </p>
                <div className="h-px w-full bg-white/10 dark:bg-black/10"></div>
            </div>

            {contextNote && (
                <div className="py-2 text-[#3388ff] text-xs font-medium flex items-center gap-2 shrink-0 relative z-10">
                    <Info size={14} />
                    {contextNote}
                </div>
            )}

            {/* Message list */}
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 gap-4 mt-8">
                        <p className="max-w-[200px] text-sm">
                            {language === 'cs'
                                ? 'Klepněte na mapu a zeptejte se AI na detaily okolí nebo preference bydlení.'
                                : 'Click on the map and ask AI about the surroundings or housing preferences.'}
                        </p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === 'user'
                            ? 'justify-end'
                            : msg.role === 'system'
                                ? 'justify-center'
                                : 'justify-start'
                            }`}
                    >
                        {msg.role === 'system' ? (
                            <span className="text-xs opacity-50 italic bg-white/5 dark:bg-black/5 px-3 py-1 rounded-full">
                                {msg.content}
                            </span>
                        ) : (
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2 text-[13px] ${msg.role === 'user'
                                    ? 'bg-[#3388ff] text-white'
                                    : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black border border-white/10 dark:border-black/10'
                                    }`}
                            >
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        )}
                    </div>
                ))}

                {/* Thinking steps indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black rounded-2xl px-4 py-3 border border-white/10 dark:border-black/10 min-w-[180px]">
                            {thinkingSteps.length === 0 ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="animate-spin text-[#3388ff] shrink-0" size={14} />
                                    <span className="text-xs opacity-60">
                                        {language === 'cs' ? 'AI přemýšlí...' : 'AI is thinking...'}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    {thinkingSteps.map((step, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-2 text-xs transition-opacity ${step.done ? 'opacity-35' : 'opacity-100'}`}
                                        >
                                            {step.done ? (
                                                <Check size={12} className="text-green-400 shrink-0" />
                                            ) : (
                                                <Loader2 size={12} className="animate-spin text-[#3388ff] shrink-0" />
                                            )}
                                            <span>{step.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="relative z-10 shrink-0 mt-3 mb-2 group">
                {!isLoggedIn && (
                    <div className="text-center text-[11px] text-[#3388ff]/70 mb-2 font-medium">
                        {language === 'cs' ? 'Pro použití AI chatu se přihlaste' : 'Log in to use AI chat'}
                    </div>
                )}
                <div className="flex relative items-center">
                    <input
                        type="text"
                        value={input}
                        disabled={!isLoggedIn || isLoading}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handle_send()}
                        placeholder={
                            language === 'cs'
                                ? (isLoggedIn ? 'Zeptejte se AI...' : 'Přihlaste se pro chat...')
                                : (isLoggedIn ? 'Ask AI...' : 'Log in to chat...')
                        }
                        className={`w-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black border rounded-full pl-4 pr-12 py-3 transition-all text-sm backdrop-blur-md ${isLoggedIn
                            ? 'border-white/10 dark:border-black/10 opacity-100 cursor-text focus:border-[#3388ff]/50 focus:ring-1 focus:ring-[#3388ff]/20 focus:outline-none'
                            : 'border-white/10 dark:border-black/10 opacity-50 cursor-not-allowed group-hover:border-[#3388ff]/30'
                            }`}
                    />

                    {isLoggedIn ? (
                        <button
                            onClick={handle_send}
                            disabled={!input.trim() || isLoading}
                            className={`absolute right-1.5 w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${input.trim() && !isLoading
                                ? 'bg-[#3388ff] text-white hover:bg-[#2563eb] scale-100 active:scale-90'
                                : 'bg-white/5 dark:bg-black/5 text-white dark:text-black opacity-40 cursor-default'
                                }`}
                        >
                            <Send size={14} />
                        </button>
                    ) : (
                        <div className="absolute right-1.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 dark:bg-black/5 text-white dark:text-black transition-colors pointer-events-none">
                            <Lock size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3388ff]" />
                            <Send size={14} className="absolute opacity-50 group-hover:opacity-0 transition-opacity translate-x-[1px]" />
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
}
