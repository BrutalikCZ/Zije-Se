import React from 'react';
import { Settings2, Trash2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { SidebarLayout } from './sidebar-layout';

interface AiSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    onLoginClick?: () => void;
    aiModel: 'gemma' | 'gemini';
    setAiModel: (m: 'gemma' | 'gemini') => void;
}

export function AiSettingsPanel({ isOpen, onClose, isCollapsed, setIsCollapsed, onLoginClick, aiModel, setAiModel }: AiSettingsPanelProps) {
    const { language } = useLanguage();

    const activeSettingsIcon = (
        <button
            className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-[#3388ff] opacity-80 hover:opacity-100"
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
            zIndex={30}
            collapsedIcon={<Settings2 size={20} />}
            collapsedIconTitle={language === 'cs' ? 'Nastavení AI' : 'AI Settings'}
            extraBottomControls={activeSettingsIcon}
            backText={{ cs: 'Zpět do AI Chatu', en: 'Back to AI Chat' }}
            onLoginClick={onLoginClick}
        >
            <div data-tour="ai-settings-panel" className="flex-1 flex flex-col min-h-0 relative z-10 w-full">
                <div className="text-center shrink-0 mb-6 mt-4">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white dark:text-black mb-2">
                        {language === 'cs' ? 'NASTAVENÍ AI' : 'AI SETTINGS'}
                    </h1>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 px-2">
                        {language === 'cs' ? 'Konfigurace chování a preferencí asistenta' : 'Configuration of assistant behavior and preferences'}
                    </p>
                    <div className="h-px w-full bg-white/10 dark:bg-black/10"></div>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1 pt-2 pb-4" data-lenis-prevent>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold opacity-60">
                            {language === 'cs' ? 'Volba umělé inteligence' : 'Artificial Intelligence Model'}
                        </span>
                        <div className="flex gap-2 text-sm font-medium mb-4">
                            <button
                                className={`cursor-pointer flex-1 py-2 rounded-full transition-all transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md ${aiModel === 'gemma' ? 'bg-[#3388ff] text-white' : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc]'}`}
                                onClick={() => setAiModel('gemma')}
                            >
                                Gemma 3
                            </button>
                            <button
                                className={`cursor-pointer flex-1 py-2 rounded-full transition-all transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md ${aiModel === 'gemini' ? 'bg-[#3388ff] text-white' : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc]'}`}
                                onClick={() => setAiModel('gemini')}
                            >
                                Google Gemini
                            </button>
                        </div>

                        <div className="h-px w-full bg-white/10 dark:bg-black/10 my-2"></div>

                        <span className="text-sm font-semibold opacity-60">
                            {language === 'cs' ? 'Správa konverzace' : 'Conversation management'}
                        </span>
                        <button
                            onClick={() => {
                                window.dispatchEvent(new Event('clear-ai-history'));
                                onClose();
                            }}
                            className="cursor-pointer flex w-full items-center justify-center gap-2 mt-2 py-3 rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-red-500 hover:text-white dark:hover:text-white hover:bg-red-500 dark:hover:bg-red-500 transition-all transform-gpu duration-300 active:translate-y-px text-sm font-medium border border-white/10 dark:border-black/10 backdrop-blur-md"
                        >
                            <Trash2 size={16} />
                            {language === 'cs' ? 'Vymazat historii' : 'Clear History'}
                        </button>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
