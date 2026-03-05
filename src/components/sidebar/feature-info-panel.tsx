import { X, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { useState, useEffect } from 'react';

export interface FeatureInfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    clickedFeatures: any[];
}

export function FeatureInfoPanel({ isOpen, onClose, clickedFeatures }: FeatureInfoPanelProps) {
    const { language } = useLanguage();

    // UI state for collapsed layers
    const [collapsedLayers, setCollapsedLayers] = useState<Record<string, boolean>>({});

    // Reset collapsed state when new features are clicked
    useEffect(() => {
        setCollapsedLayers({});
    }, [clickedFeatures]);

    const toggleCollapse = (layerId: string) => {
        setCollapsedLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));
    };

    // group features by layer
    const grouped: Record<string, any[]> = {};
    clickedFeatures.forEach(info => {
        if (!info.layer || !info.layer.id || !info.object) return;
        const layerId = info.layer.id.replace('geojson-', '');
        if (!grouped[layerId]) grouped[layerId] = [];
        // prevent duplicate objects if pickMultipleObjects returned same feature somehow
        const isDuplicate = grouped[layerId].some(existing =>
            JSON.stringify(existing.object.properties) === JSON.stringify(info.object.properties)
        );
        if (!isDuplicate) {
            grouped[layerId].push(info);
        }
    });

    const formatPropName = (key: string) => {
        return key;
    };

    return (
        <aside
            className={`absolute top-0 right-0 h-full w-80 md:w-96 border-l border-black/5 dark:border-white/5 bg-[#0b0b0b] text-white dark:bg-[#f3f3f3] dark:text-black flex flex-col p-4 md:p-6 overflow-hidden transition-all duration-300 ease-in-out z-[40] ${isOpen ? "translate-x-0 opacity-100 shadow-2xl" : "translate-x-full opacity-0 pointer-events-none"
                }`}
        >
            {/* Background Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-300">
                <div className="absolute top-12 left-40 -translate-y-1/2 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-36 -left-12 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-2 shrink-0 z-10 relative">
                <div className="flex items-center gap-3 font-bold tracking-tight text-xl">
                    <span>{language === 'cs' ? 'Informace z mapy' : 'Map Info'}</span>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 cursor-pointer transition-colors text-white dark:text-black opacity-60 hover:opacity-100"
                    title={language === 'cs' ? 'Zavřít panel' : 'Close panel'}
                >
                    <X size={20} />
                </button>
            </div>

            <div className="h-px w-full bg-white/10 dark:bg-black/10 shrink-0 my-4 relative z-10"></div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-2 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {Object.keys(grouped).length === 0 ? (
                    <div className="text-sm opacity-50 text-center mt-10">
                        {language === 'cs' ? 'Žádná detailní data na vybraném místě' : 'No detailed data at the selected location'}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {Object.entries(grouped).map(([layerId, features]) => {
                            const isCollapsed = collapsedLayers[layerId];
                            const displayName = layerId.split('?')[0]; // Remove query params if any

                            return (
                                <div key={layerId} className="border border-white/10 dark:border-black/10 rounded-xl overflow-hidden bg-[#1a1a1a] dark:bg-[#ececeb] transition-all">
                                    <button
                                        className="w-full flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#222222] dark:hover:bg-[#dcdcdc] transition-colors text-left outline-none"
                                        onClick={() => toggleCollapse(layerId)}
                                    >
                                        <span className="font-semibold text-[13px] truncate break-all flex-1 pr-2">
                                            {displayName}
                                        </span>
                                        <div className="shrink-0 text-white/50 dark:text-black/50">
                                            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                        </div>
                                    </button>
                                    {!isCollapsed && (
                                        <div className="p-3 pt-0 border-t border-white/5 dark:border-black/5 flex flex-col gap-3 mt-3">
                                            {features.map((info, idx) => {
                                                const props = info.object?.properties || {};
                                                const visibleProps = Object.entries(props).filter(([k, v]) => v !== null && v !== undefined && v !== '');

                                                if (visibleProps.length === 0) return null;

                                                return (
                                                    <div key={idx} className="bg-[#0b0b0b]/50 dark:bg-white/50 p-3.5 rounded-lg flex flex-col gap-2.5">
                                                        {visibleProps.map(([k, v], i) => (
                                                            <div key={i} className="text-[12px] flex flex-col gap-0.5">
                                                                <span className="opacity-60 font-medium text-[11px] uppercase tracking-wider">{formatPropName(k)}</span>
                                                                <span className="font-medium text-[13px] break-words">{String(v)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}
