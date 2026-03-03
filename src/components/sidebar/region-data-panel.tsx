import React, { useState } from 'react';
import { SidebarLayout } from './sidebar-layout';
import { useLanguage } from '@/components/providers/language-provider';
import { ChevronDown } from 'lucide-react';
import { ALL_CATEGORIES } from '@/lib/data-mapping';

interface RegionDataPanelProps {
    isOpen: boolean;
    onClose: () => void;
    regionId: string;
    regionName: string;
    regionData: Record<string, string[]>;
    activeLayers: Record<string, boolean>;
    toggleLayer: (layerPath: string, value: boolean) => void;
}

export function RegionDataPanel({
    isOpen,
    onClose,
    regionId,
    regionName,
    regionData,
    activeLayers,
    toggleLayer
}: RegionDataPanelProps) {
    const { language } = useLanguage();
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (category: string) => {
        setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const hasData = Object.keys(regionData).length > 0;

    return (
        <SidebarLayout
            isOpen={isOpen}
            onClose={onClose}
            isCollapsed={false}
            setIsCollapsed={() => { }} // This panel is never collapsed
            hideCollapseButton={true}
            showCloseIcon={true}
            zIndex={25}
        >
            <div className="text-center shrink-0 mb-6 mt-4">
                <h1 className="text-2xl font-black uppercase tracking-wider text-white dark:text-black mb-2 flex items-center justify-center gap-2">
                    {regionName}
                </h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 px-2">
                    {language === 'cs' ? `Dostupné datasety pro ${regionName}` : `Available datasets for ${regionName}`}
                </p>
                <div className="h-px w-full bg-white/10 dark:bg-black/10"></div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 pr-1 pb-4" data-lenis-prevent>
                {ALL_CATEGORIES.map((category) => {
                    const files = regionData[category.id] || [];
                    const hasData = files.length > 0;
                    const activeCount = files.filter(f => activeLayers[`${regionId}/${category.id}/${f}`]).length;

                    return (
                        <div key={category.id} className="flex flex-col">
                            <button
                                onClick={() => hasData && toggleCategory(category.id)}
                                disabled={!hasData}
                                className={`group gap-3 px-5 py-3 w-full text-sm font-medium rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 backdrop-blur-md flex items-center justify-between transition-all transform-gpu duration-300 ease-in-out relative overflow-hidden ${!hasData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:translate-y-px'}`}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <span className="flex-1 text-left truncate">
                                        {category.label}
                                    </span>
                                    {hasData && (
                                        <span className="text-[10px] bg-white/10 dark:bg-black/10 px-2 py-0.5 rounded-full font-normal">
                                            {activeCount}/{files.length}
                                        </span>
                                    )}
                                </div>
                                {hasData && (
                                    <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${openCategories[category.id] ? "rotate-180" : ""}`} />
                                )}
                            </button>

                            {openCategories[category.id] && hasData && (
                                <div className="flex flex-col mt-1 pl-4 gap-1">
                                    {files.map((file) => {
                                        const layerPath = `${regionId}/${category.id}/${file}`;
                                        const isActive = !!activeLayers[layerPath];
                                        return (
                                            <label key={file} className="flex items-center gap-3 cursor-pointer py-1.5 px-1 group">
                                                <div className="relative flex items-center shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={isActive}
                                                        onChange={(e) => toggleLayer(layerPath, e.target.checked)}
                                                    />
                                                    <div className={`w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-[#3388ff]' : 'bg-white/10 dark:bg-black/10 group-hover:bg-white/20 dark:group-hover:bg-black/20'}`}></div>
                                                    <div className={`absolute w-4 h-4 bg-white dark:bg-[#0b0b0b] rounded-full left-1 top-1 transition-transform ${isActive ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                                <span className="text-sm font-medium truncate opacity-90 group-hover:opacity-100 transition-opacity" title={file}>
                                                    {file.replace('.geojson', '').replace(/_/g, ' ')}
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </SidebarLayout>
    );
}
