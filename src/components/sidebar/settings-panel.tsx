import React from 'react';
import { Settings2, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { SidebarLayout } from './sidebar-layout';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;

    mapType: string;
    setMapType: (t: string) => void;
    colorBlindMode: boolean;
    setColorBlindMode: (v: boolean) => void;
    showFills: boolean;
    setShowFills: (v: boolean) => void;
    layerOpacity: number;
    setLayerOpacity: (v: number) => void;
    mapOpacity: number;
    setMapOpacity: (v: number) => void;
    resetSettings: () => void;
}

export function SettingsPanel({
    isOpen, onClose, isCollapsed, setIsCollapsed,
    mapType, setMapType, colorBlindMode, setColorBlindMode,
    showFills, setShowFills, layerOpacity, setLayerOpacity,
    mapOpacity, setMapOpacity, resetSettings
}: SettingsPanelProps) {
    const { language } = useLanguage();

    const activeSettingsIcon = (
        <button
            className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-[#3388ff] opacity-100 hover:opacity-100"
            title={language === 'cs' ? 'Nastavení' : 'Settings'}
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
            zIndex={20}
            collapsedIcon={<Settings2 size={20} />}
            collapsedIconTitle={language === 'cs' ? 'Nastavení' : 'Settings'}
            extraBottomControls={activeSettingsIcon}
        >
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1 pt-4 pb-4">
                {/* BASE MAP TYPE */}
                <div className="flex flex-col gap-3">
                    <span className="text-sm font-semibold opacity-60">{language === 'cs' ? 'Podkladová Mapa' : 'Base Map'}</span>
                    <div className="flex gap-2 text-sm font-medium">
                        <button className={`cursor-pointer flex-1 py-2 rounded-full transition-all transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md ${mapType === 'default' ? 'bg-[#3388ff] text-white' : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc]'}`} onClick={() => setMapType('default')}>{language === 'cs' ? 'Základní' : 'Default'}</button>
                        <button className={`cursor-pointer flex-1 py-2 rounded-full transition-all transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md ${mapType === 'satellite' ? 'bg-[#3388ff] text-white' : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc]'}`} onClick={() => setMapType('satellite')}>{language === 'cs' ? 'Satelit' : 'Satellite'}</button>
                        <button className={`cursor-pointer flex-1 py-2 rounded-full transition-all transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md ${mapType === 'osm' ? 'bg-[#3388ff] text-white' : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc]'}`} onClick={() => setMapType('osm')}>OSM</button>
                    </div>
                </div>

                <div className="h-px w-full bg-white/10 dark:bg-black/10 my-1 shrink-0"></div>

                {/* COLORBLIND */}
                <label className="flex items-center gap-4 cursor-pointer group text-sm font-medium">
                    <div className="relative flex items-center shrink-0">
                        <input type="checkbox" className="sr-only" checked={colorBlindMode} onChange={(e) => setColorBlindMode(e.target.checked)} />
                        <div className={`w-10 h-6 rounded-full transition-colors ${colorBlindMode ? 'bg-[#3388ff]' : 'bg-white/10 dark:bg-black/10'}`}></div>
                        <div className={`absolute w-4 h-4 bg-white dark:bg-[#0b0b0b] rounded-full left-1 top-1 transition-transform ${colorBlindMode ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="opacity-80 group-hover:opacity-100 transition-opacity">{language === 'cs' ? 'Mód pro barvoslepé' : 'Colorblind Mode'}</span>
                </label>

                {/* TOGGLE FILLS */}
                <label className="flex items-center gap-4 cursor-pointer group text-sm font-medium mb-1">
                    <div className="relative flex items-center shrink-0">
                        <input type="checkbox" className="sr-only" checked={showFills} onChange={(e) => setShowFills(e.target.checked)} />
                        <div className={`w-10 h-6 rounded-full transition-colors ${showFills ? 'bg-[#3388ff]' : 'bg-white/10 dark:bg-black/10'}`}></div>
                        <div className={`absolute w-4 h-4 bg-white dark:bg-[#0b0b0b] rounded-full left-1 top-1 transition-transform ${showFills ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="opacity-80 group-hover:opacity-100 transition-opacity">{language === 'cs' ? 'Zobrazit výplně ploch' : 'Show Fill Areas'}</span>
                </label>

                {/* LAYER OPACITY */}
                <div className="flex flex-col gap-3 mt-2">
                    <div className="flex justify-between text-sm font-semibold opacity-60 w-full">
                        <span>{language === 'cs' ? 'Průhlednost vrstev' : 'Layer Opacity'}</span>
                        <span>{Math.round(layerOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={layerOpacity} onChange={(e) => setLayerOpacity(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/10 dark:bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#3388ff]" />
                </div>

                {/* MAP OPACITY */}
                <div className="flex flex-col gap-3 mt-1">
                    <div className="flex justify-between text-sm font-semibold opacity-60 w-full">
                        <span>{language === 'cs' ? 'Průhlednost mapy (podkladu)' : 'Map (Base) Opacity'}</span>
                        <span>{Math.round(mapOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={mapOpacity} onChange={(e) => setMapOpacity(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/10 dark:bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#3388ff]" />
                </div>

                {/* RESET */}
                <button onClick={resetSettings} className="cursor-pointer flex items-center justify-center gap-2 mt-4 py-3 rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-red-500 hover:text-white dark:hover:text-white hover:bg-red-500 dark:hover:bg-red-500 transition-all transform-gpu duration-300 active:translate-y-px text-sm font-medium border border-white/10 dark:border-black/10 backdrop-blur-md">
                    <RotateCcw size={16} /> {language === 'cs' ? 'Obnovit nastavení' : 'Reset Settings'}
                </button>
            </div>
        </SidebarLayout>
    );
}
