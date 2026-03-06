import { useState, useEffect, useRef } from 'react';
import { getQuestions } from './questionnaire/questions-data';
import { Send, Loader2, Info, BotMessageSquare, Settings2, Lock, Check, Trash2, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { SidebarLayout } from './sidebar-layout';

interface AIChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    onOpenAiSettings: () => void;
    onLoginClick: () => void;
    aiModel: 'gemma' | 'gemini';
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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPOISummary(features: any[], label: string, refLat?: number, refLng?: number): string {
    const total = features.length;
    const shown = features.slice(0, 10);
    const lines: string[] = [`Nalezeno ${total} míst — ${label}:`];

    for (const f of shown) {
        const props = f.properties || {};
        const name = props.name || props['name:cs'] || props.amenity || props.shop || props.leisure || props.tourism || 'Bez názvu';
        const coords: [number, number] | null =
            f.geometry?.type === 'Point' ? [f.geometry.coordinates[1], f.geometry.coordinates[0]] : null;

        let distStr = '';
        if (coords && refLat != null && refLng != null) {
            distStr = ` (${formatDist(haversineKm(refLat, refLng, coords[0], coords[1]))})`;
        }

        const addr = props.address
            ? ` — ${props.address}`
            : (() => {
                const parts = [props['addr:street'], props['addr:housenumber'], props['addr:city']].filter(Boolean);
                return parts.length ? ` — ${parts.join(' ')}` : '';
            })();

        lines.push(`• ${name}${distStr}${addr}`);
    }

    if (total > 10) lines.push(`... a dalších ${total - 10} míst zobrazeno na mapě.`);
    return lines.join('\n');
}

function renderInline(text: string): React.ReactNode[] {
    const boldSegments = text.split(/\*\*/);
    const result: React.ReactNode[] = [];

    boldSegments.forEach((seg, boldIdx) => {
        if (boldIdx % 2 === 1) {
            result.push(<strong key={`b${boldIdx}`}>{seg}</strong>);
            return;
        }
        const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = linkRegex.exec(seg)) !== null) {
            if (m.index > last) result.push(seg.slice(last, m.index));
            result.push(
                <a key={`l${boldIdx}-${m.index}`} href={m[2]} target="_blank" rel="noopener noreferrer"
                    className="text-[#3388ff] hover:underline break-all">
                    {m[1]}
                </a>
            );
            last = m.index + m[0].length;
        }
        if (last < seg.length) result.push(seg.slice(last));
    });

    return result;
}

function renderMarkdown(text: string): React.ReactNode {
    return text.split('\n').map((line, i) => {
        const isBullet = /^(\*|•|-)\s+/.test(line);
        const content = isBullet ? line.replace(/^(\*|•|-)\s+/, '') : line;
        const inline = renderInline(content);

        if (isBullet) {
            return <div key={i} className="flex items-center gap-2"><span className="w-2 h-[1.5px] rounded-full bg-current shrink-0 opacity-60" /><span>{inline}</span></div>;
        }
        return <div key={i} className={line === '' ? 'h-2' : ''}>{inline}</div>;
    });
}

const SYSTEM_PROMPT =
    'Jsi inteligentní asistent pro analýzu míst a lokalit v České republice. ' +
    'Pokud ti jsou poskytnuta geodata z databáze, využij je ve své odpovědi – uveď konkrétní místa, názvy obcí nebo zařízení. ' +
    'Pokud geodata nejsou k dispozici nebo nejsou relevantní, odpovídej na základě obecných znalostí. ' +
    'Odpovídej vždy v jazyce uživatele.';

export function AIChatPanel({ isOpen, onClose, isCollapsed, setIsCollapsed, onOpenAiSettings, onLoginClick, aiModel }: AIChatPanelProps) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const isLoggedIn = !!user;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
    const [contextNote, setContextNote] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
            textareaRef.current.style.height = `${newHeight}px`;
            textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > 200 ? 'auto' : 'hidden';
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [input]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        const handleContextUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail as { lat?: number; lng?: number; id?: string } | undefined;
            if (detail?.lat != null && detail?.lng != null) {
                const lat = detail.lat.toFixed(5);
                const lng = detail.lng.toFixed(5);
                setContextNote(`Souřadnice: ${lat}, ${lng}`);
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `Uživatel označil souřadnice na mapě: zeměpisná šířka ${lat}, zeměpisná délka ${lng}`,
                }]);
            } else if (detail?.id) {
                setContextNote(`Kontext dlaždice: ${detail.id}`);
                setMessages(prev => [...prev, {
                    role: 'system',
                    content: `Kontext aktuální dlaždice: ${detail.id}`,
                }]);
            }
        };
        window.addEventListener('tileContextUpdated', handleContextUpdate);
        return () => window.removeEventListener('tileContextUpdated', handleContextUpdate);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinkingSteps, contextNote]);

    useEffect(() => {
        const handleClearHistory = () => {
            setMessages([]);
            setContextNote(null);
        };
        window.addEventListener('clear-ai-history', handleClearHistory);
        return () => window.removeEventListener('clear-ai-history', handleClearHistory);
    }, []);

    const clearHistory = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setMessages([]);
        setIsLoading(false);
        setThinkingSteps([]);
        setContextNote(null);
    };

    const cancelRequest = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };

    const build_API_messages = (conversation_history: Message[]) => {
        const api_messages: { role: string; content: string }[] = [
            { role: 'system', content: SYSTEM_PROMPT },
        ];

        const tile_context = (window as any).CurrentTileContext;
        if (tile_context?.lat != null && tile_context?.lng != null) {
            api_messages.push({
                role: 'system',
                content: `Aktuální označené souřadnice na mapě: zeměpisná šířka ${tile_context.lat.toFixed(5)}, zeměpisná délka ${tile_context.lng.toFixed(5)}`,
            });
        } else if (tile_context) {
            api_messages.push({
                role: 'system',
                content: `Kontext aktuální dlaždice na mapě: ${JSON.stringify(tile_context)}`,
            });
        }

        if (user?.questionnaireData && Object.keys(user.questionnaireData).length > 0) {
            const questions = getQuestions('cs');
            const answeredLines = Object.entries(user.questionnaireData)
                .map(([idx, ans]) => {
                    const q = questions[parseInt(idx)] ?? `Otázka ${parseInt(idx) + 1}`;
                    return `- ${q}: ${ans ? 'ANO' : 'NE'}`;
                });
            api_messages.push({
                role: 'system',
                content: `Uživatelský dotazník (preference bydlení, ${answeredLines.length} odpovědí):\n${answeredLines.join('\n')}`,
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

        window.dispatchEvent(new CustomEvent('ai-map-reset'));

        const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(updatedMessages);
        setIsLoading(true);
        setThinkingSteps([{
            text: language === 'cs' ? 'Analyzuji požadavky...' : 'Analyzing requirements...',
            done: false,
        }]);

        try {
            abortControllerRef.current = new AbortController();

            const apiMessages = build_API_messages(updatedMessages);
            advanceStep(language === 'cs' ? 'Zpracovávám dotaz...' : 'Processing query...');

            const finalRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages, model: aiModel }),
                signal: abortControllerRef.current.signal,
            });

            if (!finalRes.ok) {
                const errData = await finalRes.json().catch(() => ({}));
                throw new Error(errData.error || `Server error: ${finalRes.status}`);
            }

            const finalData = await finalRes.json();
            console.log('[AI] pois:', JSON.stringify(finalData.pois), '| location:', JSON.stringify(finalData.location));

            if (finalData._debug && !finalData._debug.isConversational) {
                const dbg = finalData._debug;
                if (dbg.keywords?.length > 0) {
                    advanceStep(
                        language === 'cs'
                            ? `Klíčová slova: ${dbg.keywords.join(', ')}`
                            : `Keywords: ${dbg.keywords.join(', ')}`
                    );
                }
                if (dbg.searchResultFiles?.length > 0) {
                    const matchInfo = dbg.searchResultFiles.map((r: any) => `${r.file} (${r.matches}×)`).join(', ');
                    advanceStep(
                        language === 'cs'
                            ? `Nalezeno v: ${matchInfo}`
                            : `Found in: ${matchInfo}`
                    );
                }
            }

            let mergedPois: any = null;
            let poisSummary: string | null = null;
            const poisToFetch = Array.isArray(finalData.pois) ? finalData.pois : (finalData.pois ? [finalData.pois] : []);

            if (finalData.poiGeojson?.features?.length > 0) {
                mergedPois = finalData.poiGeojson;
                const firstFeat = mergedPois.features[0];
                const firstLat = firstFeat?.geometry?.type === 'Point' ? firstFeat.geometry.coordinates[1] : undefined;
                const firstLng = firstFeat?.geometry?.type === 'Point' ? firstFeat.geometry.coordinates[0] : undefined;
                const firstLabel = firstFeat?.properties?._label || '';
                advanceStep(language === 'cs' ? 'Zobrazuji místa na mapě...' : 'Showing places on map...');
                window.dispatchEvent(new CustomEvent('ai-map-pois', {
                    detail: { geojson: mergedPois, label: firstLabel },
                }));
                poisSummary = buildPOISummary(mergedPois.features, firstLabel || 'místa', firstLat, firstLng);
            } else if (poisToFetch.length > 0) {
                advanceStep(language === 'cs' ? 'Vyhledávám místa na mapě...' : 'Searching for places on map...');
                const allFetchedFeatures: any[] = [];
                let firstLat: number | undefined, firstLng: number | undefined, firstLabel: string | undefined;

                const poisEndpoint = aiModel === 'gemini' ? '/api/places' : '/api/overpass';

                for (const poiReq of poisToFetch) {
                    const poiLabel = poiReq.label || poiReq.keyword || poiReq.type || 'místa';
                    advanceStep(language === 'cs' ? `Hledám: ${poiLabel}...` : `Searching: ${poiLabel}...`);
                    try {
                        const poiRes = await fetch(poisEndpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(poiReq),
                        });
                        if (poiRes.ok) {
                            const geojson = await poiRes.json();
                            if (geojson.features?.length > 0) {
                                allFetchedFeatures.push(...geojson.features);
                                if (firstLat === undefined) {
                                    firstLat = poiReq.lat;
                                    firstLng = poiReq.lng;
                                    firstLabel = poiReq.label;
                                }
                            }
                        }
                    } catch (err) {
                        console.error(`[AI] POI fetch (${poisEndpoint}) failed:`, err);
                    }
                }

                if (allFetchedFeatures.length > 0) {
                    mergedPois = { type: 'FeatureCollection', features: allFetchedFeatures };

                    if (firstLat === undefined) {
                        const firstFeat = allFetchedFeatures[0];
                        if (firstFeat.geometry?.type === 'Point') {
                            firstLat = firstFeat.geometry.coordinates[1];
                            firstLng = firstFeat.geometry.coordinates[0];
                        }
                    }

                    window.dispatchEvent(new CustomEvent('ai-map-pois', {
                        detail: { geojson: mergedPois, label: firstLabel || '' },
                    }));
                    poisSummary = buildPOISummary(allFetchedFeatures, firstLabel || 'místa', firstLat, firstLng);
                }
            }

            const locationsToFetch = Array.isArray(finalData.location) ? finalData.location : (finalData.location ? [finalData.location] : []);

            if (locationsToFetch.length > 0) {
                advanceStep(language === 'cs' ? 'Zobrazuji místo na mapě...' : 'Showing location on map...');
                const allLocationFeatures: any[] = [];
                let firstLocLabel = '';

                for (const locReq of locationsToFetch) {
                    try {
                        const nominatimRes = await fetch(
                            `/api/nominatim?place=${encodeURIComponent(locReq.place)}`
                        );
                        if (nominatimRes.ok) {
                            const geojson = await nominatimRes.json();
                            if (geojson.features?.length > 0) {
                                allLocationFeatures.push(...geojson.features);
                                if (!firstLocLabel) firstLocLabel = locReq.label;
                            }
                        }
                    } catch (err) {
                        console.error('[AI] Nominatim fetch failed:', err);
                    }
                }

                if (allLocationFeatures.length > 0) {
                    window.dispatchEvent(new CustomEvent('ai-map-location', {
                        detail: { geojson: { type: 'FeatureCollection', features: allLocationFeatures }, label: firstLocLabel || '' },
                    }));
                }
            }

            let traceLine: string | null = null;
            const searchMeta: { label: string; count: number; found: boolean }[] | null = finalData.searchMeta ?? null;
            if (searchMeta && searchMeta.length > 0) {
                const parts = searchMeta.map(m =>
                    m.found ? `${m.label} → ${m.count} výsledků` : `${m.label} → nenalezeno`
                );
                traceLine = `🔍 ${parts.join(' | ')}`;
            } else if (poisSummary && aiModel !== 'gemini') {
                traceLine = poisSummary;
            }

            setMessages(prev => {
                const next = [
                    ...prev,
                    {
                        role: 'assistant' as const,
                        content: finalData.reply || (language === 'cs' ? 'Chyba: prázdná odpověď.' : 'Error: empty response.'),
                    },
                ];
                if (poisSummary && aiModel !== 'gemini') next.push({ role: 'assistant', content: poisSummary });
                if (traceLine && aiModel === 'gemini') next.push({ role: 'system', content: traceLine });
                return next;
            });
        } catch (error: any) {
            if (error.name === 'AbortError') {
                // Request cancelled - don't show error
            } else {
                console.error(error);
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'system',
                        content: error.message || (language === 'cs' ? 'Chyba při komunikaci s AI.' : 'Error communicating with AI.'),
                    },
                ]);
            }
        } finally {
            setIsLoading(false);
            setThinkingSteps([]);
            abortControllerRef.current = null;
        }
    };

    const aiSettingsButton = (
        <button
            onClick={onOpenAiSettings}
            data-tour="ai-settings-button"
            className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
            title={language === 'cs' ? 'Nastavení AI' : 'AI Settings'}
        >
            <Settings2 size={isCollapsed ? 20 : 18} />
        </button>
    );

    const userMessageCount = messages.filter(m => m.role === 'user').length;

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
            onLoginClick={onLoginClick}
        >
            {/* Header */}
            <div className="text-center shrink-0 mb-6 mt-4">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white dark:text-black">
                        {language === 'cs' ? 'ZIJE!SE AI' : 'ZIJE!SE AI'}
                    </h1>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 px-2">
                    {language === 'cs'
                        ? 'Inteligentní asistent pro analýzu míst a lokalit'
                        : 'Intelligent assistant for analyzing places and locations'}
                </p>

                {/* Clear button + message count */}
                <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {userMessageCount > 0
                            ? `${userMessageCount} ${language === 'cs' ? 'zpráv' : 'messages'}`
                            : ''}
                    </span>
                    {messages.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                            title={language === 'cs' ? 'Vymazat historii' : 'Clear history'}
                        >
                            <Trash2 className="w-3 h-3" />
                            {language === 'cs' ? 'Vymazat' : 'Clear'}
                        </button>
                    )}
                </div>

                <div className="h-px w-full bg-white/10 dark:bg-black/10"></div>
            </div>

            {contextNote && (
                <div className="py-2 text-[#3388ff] text-xs font-medium flex items-center gap-2 shrink-0 relative z-10">
                    <Info size={14} />
                    {contextNote}
                </div>
            )}

            {/* Message list */}
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1" data-lenis-prevent>
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
                                <div className="leading-relaxed text-[13px] flex flex-col gap-0.5">{renderMarkdown(msg.content)}</div>
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

            {/* Cancel button when loading */}
            {isLoading && (
                <button
                    onClick={cancelRequest}
                    className="flex items-center gap-1.5 mx-auto my-2 px-3 py-1 rounded-full text-xs text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10 transition-colors shrink-0 relative z-10"
                >
                    <X className="w-3 h-3" />
                    {language === 'cs' ? 'Zrušit' : 'Cancel'}
                </button>
            )}

            {/* Input area */}
            <div className="relative z-10 shrink-0 mt-3 mb-2 group" data-tour="ai-chat-input">
                {!isLoggedIn && (
                    <div className="text-center text-[11px] text-[#3388ff]/70 mb-2 font-medium">
                        {language === 'cs' ? 'Pro použití AI chatu se přihlaste' : 'Log in to use AI chat'}
                    </div>
                )}
                <div className="flex relative items-end">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        disabled={!isLoggedIn || isLoading}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handle_send();
                            }
                        }}
                        placeholder={
                            language === 'cs'
                                ? (isLoggedIn ? 'Zeptejte se AI...' : 'Přihlaste se pro chat...')
                                : (isLoggedIn ? 'Ask AI...' : 'Log in to chat...')
                        }
                        className={`w-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black border rounded-[22px] pl-4 pr-12 py-3.5 transition-all text-sm backdrop-blur-md resize-none overflow-hidden ${isLoggedIn
                            ? 'border-white/10 dark:border-black/10 opacity-100 cursor-text focus:border-[#3388ff]/50 focus:ring-1 focus:ring-[#3388ff]/20 focus:outline-none'
                            : 'border-white/10 dark:border-black/10 opacity-50 cursor-not-allowed group-hover:border-[#3388ff]/30'
                            }`}
                        style={{ minHeight: '48px', maxHeight: '200px' }}
                    />

                    {isLoggedIn ? (
                        <button
                            onClick={handle_send}
                            disabled={!input.trim() || isLoading}
                            className={`absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer ${input.trim() && !isLoading
                                ? 'bg-[#3388ff] text-white hover:bg-[#2563eb] scale-100 active:scale-90'
                                : 'bg-white/5 dark:bg-black/5 text-white dark:text-black opacity-40 cursor-default'
                                }`}
                        >
                            <Send size={14} />
                        </button>
                    ) : (
                        <div className="absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 dark:bg-black/5 text-white dark:text-black transition-colors pointer-events-none">
                            <Lock size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#3388ff]" />
                            <Send size={14} className="absolute opacity-50 group-hover:opacity-0 transition-opacity translate-x-[1px]" />
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
}
