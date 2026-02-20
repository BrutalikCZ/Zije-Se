import React from 'react';
import { CodeXml, Settings2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { SidebarLayout } from './sidebar-layout';

interface AiSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
}

export function AiSettingsPanel({ isOpen, onClose, isCollapsed, setIsCollapsed }: AiSettingsPanelProps) {
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
        >
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1 pt-4 pb-4">
                <div className="flex flex-col items-center justify-center h-full opacity-50 text-center px-4 gap-4">
                    <CodeXml size={48} className="opacity-60" />
                    <p className="text-sm font-medium">
                        {language === 'cs' ? 'Zde brzy přibudou detailní možnosti nastavení chování AI a volba modelů.' : 'Detailed options for AI behavior and models will appear here soon.'}
                    </p>
                </div>
            </div>
        </SidebarLayout>
    );
}
