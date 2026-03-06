import React, { useEffect, useState } from 'react';
import { Database, File, ChevronDown, Settings2, Globe, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { SidebarLayout } from './sidebar-layout';
import { WFS_SERVICES, WfsService, wfsLayerKey } from '@/lib/wfs-services';

interface FileNode {
    name: string;
    type: 'file' | 'directory' | 'property';
    path?: string;
    children?: FileNode[];
}

interface DatasetsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    activeLayers: Record<string, boolean>;
    toggleLayer: (layerPath: string, value: boolean) => void;
    onOpenSettings?: () => void;
}

function FileTreeNode({ node, level = 0, activeLayers, toggleLayer, insideTree = false }: { node: FileNode; level?: number; activeLayers: Record<string, boolean>; toggleLayer: (layerPath: string, value: boolean) => void; insideTree?: boolean; }) {
    const [expanded, setExpanded] = useState(false);
    const isDir = node.type === 'directory' || (node.type === 'file' && node.name.endsWith('.geojson'));
    const isProperty = node.type === 'property';
    const layerPath = node.path ? node.path.replace(/^\/data\//, '') : '';
    const isActive = isProperty ? !!activeLayers[layerPath] : false;

    if (isDir) {
        return (
            <div className={`flex flex-col ${insideTree ? 'relative' : ''}`}>
                {insideTree && <div className="absolute left-[-12px] top-[24px] w-3 h-px bg-white/10 dark:bg-black/10 z-0" />}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`group px-5 py-3 w-full text-sm font-medium rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#222222] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 flex items-center justify-between transition-all transform-gpu duration-300 ease-in-out cursor-pointer active:translate-y-px relative z-10 ${expanded ? 'mb-1' : ''}`}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="flex-1 text-left truncate">
                            {node.name.replace('.geojson', '')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[11px] tabular-nums opacity-50 font-mono bg-white/10 dark:bg-black/10 px-1.5 py-0.5 rounded-full">
                            {node.children ? node.children.length : 0}
                        </span>
                        <ChevronDown
                            size={14}
                            className={`text-white/60 dark:text-black/60 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                        />
                    </div>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${expanded && node.children && node.children.length > 0 ? 'grid-rows-[1fr] opacity-100 mt-1 mb-2' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className="relative flex flex-col ml-4 pl-4 pr-2 mt-1 gap-1">
                            <div className="absolute left-1 top-[-26px] bottom-[18px] w-px bg-white/10 dark:bg-black/10" />
                            {node.children?.map((child, i) => (
                                <FileTreeNode key={i} node={child} level={level + 1} activeLayers={activeLayers} toggleLayer={toggleLayer} insideTree />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <label className="relative flex items-center gap-3 cursor-pointer py-1.5 pl-3 pr-2 group rounded-xl hover:bg-white/5 dark:hover:bg-black/5 transition-colors border border-transparent hover:border-white/5 dark:hover:border-black/5">
            {insideTree && <div className="absolute left-[-12px] top-1/2 w-3 h-px bg-white/10 dark:bg-black/10" />}
            {isProperty ? (
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
            ) : (
                <div className="flex items-center shrink-0 opacity-50 ml-1.5 mr-1.5">
                    <File size={14} />
                </div>
            )}
            <span className={`text-[13px] font-medium truncate opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all w-full flex-1 ${isProperty && isActive ? 'text-[#3388ff]' : ''}`} title={node.name}>
                {node.name.replace(/_/g, ' ')}
            </span>
        </label>
    );
}

function WfsServiceFolder({
    service,
    activeLayers,
    toggleLayer,
}: {
    service: WfsService;
    activeLayers: Record<string, boolean>;
    toggleLayer: (layerPath: string, value: boolean) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [layers, setLayers] = useState<{ name: string; title: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetched = React.useRef(false);

    const handleExpand = async () => {
        const next = !expanded;
        setExpanded(next);
        if (next && !fetched.current && !loading) {
            fetched.current = true;
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/wfs?url=${encodeURIComponent(service.url)}&request=GetCapabilities`);
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setLayers(data.layers || []);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Nepodařilo se načíst vrstvy');
                fetched.current = false; // allow retry
            } finally {
                setLoading(false);
            }
        }
    };

    const activeCount = layers.filter(l => activeLayers[wfsLayerKey(service.url, l.name)]).length;

    return (
        <div className="flex flex-col">
            <button
                onClick={handleExpand}
                className={`group px-5 py-3 w-full text-sm font-medium rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#222222] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 flex items-center justify-between transition-all transform-gpu duration-300 ease-in-out cursor-pointer active:translate-y-px ${expanded ? 'mb-1' : ''}`}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Globe size={13} className="shrink-0 opacity-60" />
                    <span className="flex-1 text-left truncate">{service.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {layers.length > 0 && (
                        <span className="text-[11px] tabular-nums opacity-50 font-mono bg-white/10 dark:bg-black/10 px-1.5 py-0.5 rounded-full">
                            {activeCount}/{layers.length}
                        </span>
                    )}
                    <ChevronDown
                        size={14}
                        className={`text-white/60 dark:text-black/60 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100 mt-1 mb-2' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="relative flex flex-col ml-4 pl-4 pr-2 mt-1 gap-1">
                        <div className="absolute left-1 top-[-26px] bottom-[18px] w-px bg-white/10 dark:bg-black/10" />

                        {loading && (
                            <div className="text-xs opacity-50 py-3 text-center">Načítám vrstvy…</div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-xs text-red-400 py-2 px-2">
                                <AlertCircle size={12} className="shrink-0" />
                                <span className="truncate" title={error}>{error}</span>
                            </div>
                        )}

                        {!loading && !error && layers.length === 0 && fetched.current && (
                            <div className="text-xs opacity-50 py-3 text-center">Žádné vrstvy</div>
                        )}

                        {layers.map((layer) => {
                            const key = wfsLayerKey(service.url, layer.name);
                            const isActive = !!activeLayers[key];
                            return (
                                <label
                                    key={layer.name}
                                    className="relative flex items-center gap-3 cursor-pointer py-1.5 pl-3 pr-2 group rounded-xl hover:bg-white/5 dark:hover:bg-black/5 transition-colors border border-transparent hover:border-white/5 dark:hover:border-black/5"
                                >
                                    <div className="absolute left-[-12px] top-1/2 w-3 h-px bg-white/10 dark:bg-black/10" />
                                    <div className="relative flex items-center shrink-0">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isActive}
                                            onChange={(e) => toggleLayer(key, e.target.checked)}
                                        />
                                        <div className={`w-9 h-5 rounded-full transition-colors ${isActive ? 'bg-[#3388ff]' : 'bg-white/10 dark:bg-black/10 group-hover:bg-white/20 dark:group-hover:bg-black/20'}`} />
                                        <div className={`absolute w-4 h-4 bg-white dark:bg-[#0b0b0b] rounded-full left-0.5 top-0.5 transition-transform shadow-sm ${isActive ? 'translate-x-[16px]' : ''}`} />
                                    </div>
                                    <span
                                        className={`text-[13px] font-medium truncate opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all w-full flex-1 ${isActive ? 'text-[#3388ff]' : ''}`}
                                        title={`${layer.title} (${layer.name})`}
                                    >
                                        {layer.title}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function DatasetsPanel({
    isOpen, onClose, isCollapsed, setIsCollapsed, activeLayers, toggleLayer, onOpenSettings
}: DatasetsPanelProps) {
    const { language } = useLanguage();
    const [data, setData] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && data.length === 0) {
            setLoading(true);
            fetch('/api/datasets')
                .then(res => res.json())
                .then(json => {
                    setData(Array.isArray(json) ? json : []);
                })
                .catch(err => console.error("Error loading datasets:", err))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const extraControls = (
        <>
            {onOpenSettings && (
                <button
                    onClick={onOpenSettings}
                    className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                    title={language === 'cs' ? 'Nastavení mapy' : 'Map Settings'}
                >
                    <Settings2 size={isCollapsed ? 20 : 18} />
                </button>
            )}
            <button
                className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-[#3388ff] opacity-100 hover:opacity-100"
                title={language === 'cs' ? 'Datasety' : 'Datasets'}
            >
                <Database size={isCollapsed ? 20 : 18} />
            </button>
        </>
    );

    return (
        <SidebarLayout
            isOpen={isOpen}
            onClose={onClose}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            zIndex={20}
            collapsedIcon={<Database size={20} />}
            collapsedIconTitle={language === 'cs' ? 'Datasety' : 'Datasets'}
            extraBottomControls={extraControls}
            showAuthSection={false}
        >
            <div data-tour="datasets-panel" className="flex-1 flex flex-col min-h-0 relative z-10 w-full">
                <div className="text-center shrink-0 mb-6 mt-4">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white dark:text-black mb-2">
                        {language === 'cs' ? 'DATASETY' : 'DATASETS'}
                    </h1>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 px-2">
                        {language === 'cs' ? 'Dostupné datové sady a soubory' : 'Available datasets and files'}
                    </p>
                    <div className="h-px w-full bg-white/10 dark:bg-black/10"></div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1 pb-4" data-lenis-prevent>
                    {/* GeoJSON file tree */}
                    {loading ? (
                        <div className="text-xs opacity-50 py-4 text-center">
                            {language === 'cs' ? 'Načítám...' : 'Loading...'}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-xs opacity-50 py-4 text-center">
                            {language === 'cs' ? 'Složka data/datasets je prázdná nebo neexistuje.' : 'data/datasets folder is empty or missing.'}
                        </div>
                    ) : (
                        data.map((node, i) => (
                            <FileTreeNode key={i} node={node} activeLayers={activeLayers} toggleLayer={toggleLayer} />
                        ))
                    )}

                    {/* WFS Services section */}
                    <div className="mt-4 mb-1">
                        <div className="flex items-center gap-2 px-1 mb-3">
                            <div className="h-px flex-1 bg-white/10 dark:bg-black/10" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 shrink-0 flex items-center gap-1.5">
                                <Globe size={10} />
                                {language === 'cs' ? 'WFS Služby' : 'WFS Services'}
                            </span>
                            <div className="h-px flex-1 bg-white/10 dark:bg-black/10" />
                        </div>

                        <div className="flex flex-col gap-2">
                            {WFS_SERVICES.map(service => (
                                <WfsServiceFolder
                                    key={service.id}
                                    service={service}
                                    activeLayers={activeLayers}
                                    toggleLayer={toggleLayer}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
