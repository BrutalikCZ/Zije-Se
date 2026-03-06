import React, { useState } from 'react';
import { SidebarLayout } from './sidebar-layout';
import { useLanguage } from '@/components/providers/language-provider';
import { ChevronDown, Settings2, Database, Map, Folder } from 'lucide-react';
import { ALL_CATEGORIES } from '@/lib/data-mapping';

interface RegionDataPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    regionId: string;
    regionName: string;
    regionData: Record<string, string[]>;
    activeLayers: Record<string, boolean>;
    toggleLayer: (layerPath: string, value: boolean) => void;
    onOpenSettings?: () => void;
    onOpenDatasets?: () => void;
}

export function RegionDataPanel({
    isOpen,
    onClose,
    isCollapsed,
    setIsCollapsed,
    regionId,
    regionName,
    regionData,
    activeLayers,
    toggleLayer,
    onOpenSettings,
    onOpenDatasets,
}: RegionDataPanelProps) {
    const { language } = useLanguage();
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (category: string) => {
        setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const extraControls = (
        <>
            {onOpenSettings && (
                <button
                    onClick={onOpenSettings}
                    className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                    title={language === 'cs' ? 'Nastavení mapy' : 'Map Settings'}
                >
                    <Settings2 size={18} />
                </button>
            )}
            {onOpenDatasets && (
                <button
                    onClick={onOpenDatasets}
                    className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                    title={language === 'cs' ? 'Datasety' : 'Datasets'}
                >
                    <Database size={18} />
                </button>
            )}
        </>
    );

    return (
        <SidebarLayout
            isOpen={isOpen}
            onClose={onClose}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            hideCollapseButton={false}
            showCloseIcon={false}
            collapsedIcon={<Map size={20} />}
            collapsedIconTitle={regionName}
            zIndex={25}
            extraBottomControls={extraControls}
            showAuthSection={false}
        >
            <div data-tour="region-data-panel" className="flex-1 flex flex-col min-h-0 relative z-10 w-full">
                <div className="text-center shrink-0 mb-6 mt-4">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white dark:text-black mb-2 flex items-center justify-center gap-2">
                        {regionName}
                    </h1>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 px-2">
                        {language === 'cs' ? `Dostupné datasety pro ${regionName}` : `Available datasets for ${regionName}`}
                    </p>
                    <div className="h-px w-full bg-white/10 dark:bg-black/10"></div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1.5 pr-1 pb-4" data-lenis-prevent>
                    {ALL_CATEGORIES.map((category) => {
                        const files = regionData[category.id] || [];
                        const hasData = files.length > 0;
                        const activeCount = files.filter(f => activeLayers[`${regionId}/${category.id}/${f}`]).length;
                        const isOpen = openCategories[category.id];

                        return (
                            <div key={category.id} className="flex flex-col">
                                <button
                                    onClick={() => hasData && toggleCategory(category.id)}
                                    disabled={!hasData}
                                    className={`group px-5 py-3 w-full text-sm font-medium rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#222222] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 flex items-center justify-between transition-all transform-gpu duration-300 ease-in-out ${!hasData ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:translate-y-px'} ${isOpen ? 'mb-1' : ''}`}
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Folder size={13} className="shrink-0 opacity-60" />
                                        <span className="flex-1 text-left truncate">
                                            {category.label}
                                        </span>
                                    </div>
                                    {hasData && (
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <span className="text-[11px] tabular-nums opacity-50 font-mono bg-white/10 dark:bg-black/10 px-1.5 py-0.5 rounded-full">
                                                {activeCount}/{files.length}
                                            </span>
                                            <ChevronDown
                                                size={14}
                                                className={`text-white/60 dark:text-black/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                    )}
                                </button>

                                <div className={`grid transition-all duration-300 ease-in-out ${isOpen && hasData ? 'grid-rows-[1fr] opacity-100 mt-1 mb-2' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="relative flex flex-col ml-4 pl-4 pr-2 mt-1 gap-1">
                                            {/* Vertical tree line */}
                                            <div className="absolute left-1 top-[-26px] bottom-[18px] w-px bg-white/10 dark:bg-black/10" />
                                            {files.map((file) => {
                                                const layerPath = `${regionId}/${category.id}/${file}`;
                                                const isActive = !!activeLayers[layerPath];
                                                return (
                                                    <label key={file} className="relative flex items-center gap-3 cursor-pointer py-1.5 pl-3 pr-2 group rounded-xl hover:bg-white/5 dark:hover:bg-black/5 transition-colors border border-transparent hover:border-white/5 dark:hover:border-black/5">
                                                        {/* Horizontal tree connector */}
                                                        <div className="absolute left-[-12px] top-1/2 w-3 h-px bg-white/10 dark:bg-black/10" />
                                                        <div className="relative flex items-center shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only"
                                                                checked={isActive}
                                                                onChange={(e) => toggleLayer(layerPath, e.target.checked)}
                                                            />
                                                            <div className={`w-9 h-5 rounded-full transition-colors ${isActive ? 'bg-[#3388ff]' : 'bg-white/10 dark:bg-black/10 group-hover:bg-white/20 dark:group-hover:bg-black/20'}`}></div>
                                                            <div className={`absolute w-4 h-4 bg-white dark:bg-[#0b0b0b] rounded-full left-0.5 top-0.5 transition-transform shadow-sm ${isActive ? 'translate-x-[16px]' : ''}`}></div>
                                                        </div>
                                                        <span className="text-[13px] font-medium truncate opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all w-full" title={file}>
                                                            {file.replace('.geojson', '').replace(/_/g, ' ')}
                                                        </span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </SidebarLayout>
    );
}
