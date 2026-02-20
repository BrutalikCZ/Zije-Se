import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Info, BotMessageSquare, Settings2, Lock } from 'lucide-react';
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
    role: 'user' | 'ai' | 'system';
    content: string;
}

export function AIChatPanel({ isOpen, onClose, isCollapsed, setIsCollapsed, onOpenAiSettings }: AIChatPanelProps) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const isLoggedIn = !!user;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
                    content: `AI context updated to Tile ${state.id}`
                }]);
            }
        };

        window.addEventListener('tileContextUpdated', handleContextUpdate);
        return () => window.removeEventListener('tileContextUpdated', handleContextUpdate);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, contextNote]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        let prompt = userMsg;
        const tileCtx = (window as any).CurrentTileContext;
        if (tileCtx) {
            prompt = `Kontext dlaždice: ${JSON.stringify(tileCtx)}. Uživatelský dotaz: ${userMsg}`;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error('Network error');

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'ai', content: data.reply || "Error: prázdná odpověď" }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'system', content: 'Chyba při komunikaci s AI.' }]);
        } finally {
            setIsLoading(false);
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
            {/* Context Note */}
            {contextNote && (
                <div className="py-2 text-[#3388ff] text-xs font-medium flex items-center gap-2 shrink-0 relative z-10">
                    <Info size={14} />
                    {contextNote}
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
                {messages.length === 0 && (
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
                        className={`flex ${msg.role === 'user' ? 'justify-end' :
                            msg.role === 'system' ? 'justify-center' : 'justify-start'
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

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black rounded-2xl px-4 py-2 border border-white/10 dark:border-black/10 flex items-center gap-2">
                            <Loader2 className="animate-spin text-[#3388ff]" size={16} />
                            <span className="text-xs opacity-60">AI přemýšlí...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
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
                        disabled={!isLoggedIn}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={language === 'cs'
                            ? (isLoggedIn ? 'Zeptejte se AI...' : 'Přihlaste se pro chat...')
                            : (isLoggedIn ? 'Ask AI...' : 'Log in to chat...')}
                        className={`w-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black border rounded-full pl-4 pr-12 py-3 transition-all text-sm backdrop-blur-md ${isLoggedIn
                            ? 'border-white/10 dark:border-black/10 opacity-100 cursor-text focus:border-[#3388ff]/50 focus:ring-1 focus:ring-[#3388ff]/20 focus:outline-none'
                            : 'border-white/10 dark:border-black/10 opacity-50 cursor-not-allowed group-hover:border-[#3388ff]/30'
                            }`}
                    />

                    {isLoggedIn ? (
                        <button
                            onClick={handleSend}
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
