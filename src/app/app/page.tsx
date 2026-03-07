"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, BotMessageSquare, ListChecks, PanelLeftClose, PanelLeft, Globe, ChevronDown, Settings2, LogOut, User, MapPin, Database, Folder } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Map, MapControls, MapFillLayer, useMap } from "@/components/map/map";
import { MapCircleLayer } from "@/components/map/circle-layer";
import { MapLocationLayer } from "@/components/map/location-layer";
import { LegacyLayers } from "@/components/map/legacy-layers";
import { QuestionnairePanel, SettingsPanel, AIChatPanel, AiSettingsPanel, AuthPanel, RegionDataPanel, DatasetsPanel, FeatureInfoPanel } from "@/components/sidebar";
import { ALL_REGIONS, getRegionLabel } from "@/lib/data-mapping";
import { evaluateAnswers } from "@/lib/questionnaire-evaluator";
import { useAuth } from "@/components/providers/auth-provider";
import { AppTour } from "@/components/app-tour";

function MapRightClickHandler() {
    const { map } = useMap();
    useEffect(() => {
        if (!map) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handler = (e: any) => {
            const { lat, lng } = e.lngLat;
            (window as any).CurrentTileContext = { lat, lng };
            window.dispatchEvent(new CustomEvent('tileContextUpdated', { detail: { lat, lng } }));
            window.dispatchEvent(new CustomEvent('open-ai-chat'));
        };
        map.on('contextmenu', handler);
        return () => { map.off('contextmenu', handler); };
    }, [map]);
    return null;
}

export default function AppPage() {
    const { user, logout, updateUser } = useAuth();
    const { language, toggleLanguage } = useLanguage();
    const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const isResizing = useRef(false);

    const startResize = useCallback((e: React.MouseEvent) => {
        isResizing.current = true;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        const onMouseMove = (ev: MouseEvent) => {
            if (!isResizing.current) return;
            const newWidth = Math.min(Math.max(ev.clientX, 200), 600);
            setSidebarWidth(newWidth);
        };
        const onMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    }, []);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
    const [isDatasetsOpen, setIsDatasetsOpen] = useState(false);
    const [isFeatureInfoOpen, setIsFeatureInfoOpen] = useState(false);
    const [clickedFeatures, setClickedFeatures] = useState<any[]>([]);

    const [aiModel, setAiModel] = useState<'gemma' | 'gemini'>('gemma');

    // Auth Panel Toggle Exposed for nested components
    const openAuthPanel = () => {
        setIsQuestionnaireOpen(false);
        setIsChatOpen(false);
        setIsSettingsOpen(false);
        setIsAiSettingsOpen(false);
        setIsDatasetsOpen(false);
        setIsAuthOpen(true);
    };

    // Map Settings State
    const [mapType, setMapType] = useState('default');
    const [colorBlindMode, setColorBlindMode] = useState(false);
    const [showFills, setShowFills] = useState(true);
    const [layerOpacity, setLayerOpacity] = useState(0.8);
    const [mapOpacity, setMapOpacity] = useState(1.0);
    const [pointSize, setPointSize] = useState(8);

    const [globalData, setGlobalData] = useState<Record<string, Record<string, string[]>>>({});
    const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({});

    const [activeRegionPanel, setActiveRegionPanel] = useState<string | null>(null);

    const toggleLayer = (layerPath: string, value: boolean) => {
        setActiveLayers(prev => ({ ...prev, [layerPath]: value }));
    };

    // --- Loading & Saving settings to DB ---
    // Load from user object when it arrives or login happens 
    useEffect(() => {
        if (user) {
            if (user.mapSettings) {
                if (user.mapSettings.mapType !== undefined) setMapType(user.mapSettings.mapType);
                if (user.mapSettings.colorBlindMode !== undefined) setColorBlindMode(user.mapSettings.colorBlindMode);
                if (user.mapSettings.showFills !== undefined) setShowFills(user.mapSettings.showFills);
                if (user.mapSettings.layerOpacity !== undefined) setLayerOpacity(user.mapSettings.layerOpacity);
                if (user.mapSettings.mapOpacity !== undefined) setMapOpacity(user.mapSettings.mapOpacity);
                if (user.mapSettings.pointSize !== undefined) setPointSize(user.mapSettings.pointSize);
            }
            if (user.aiSettings) {
                if (user.aiSettings.aiModel !== undefined) setAiModel(user.aiSettings.aiModel);
            }
        }
    }, [user?.id]); // Only init when User ID changes (i.e. logged in)

    // Debounce save when settings change
    const saveTimer = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (!user) return;

        if (saveTimer.current) clearTimeout(saveTimer.current);

        saveTimer.current = setTimeout(async () => {
            const mapSettings = { mapType, colorBlindMode, showFills, layerOpacity, mapOpacity, pointSize };
            const aiSettings = { aiModel };

            const mapChanged = JSON.stringify(mapSettings) !== JSON.stringify(user.mapSettings || {});
            const aiChanged = JSON.stringify(aiSettings) !== JSON.stringify(user.aiSettings || {});

            if (mapChanged || aiChanged) {
                const updates: any = {};
                if (mapChanged) updates.mapSettings = mapSettings;
                if (aiChanged) updates.aiSettings = aiSettings;

                try {
                    const resp = await fetch("/api/auth", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            action: "update_data",
                            id: user.id,
                            ...updates
                        })
                    });
                    if (resp.ok) {
                        updateUser(updates);
                    }
                } catch (err) {
                    console.error("Failed to save settings", err);
                }
            }
        }, 1200);

        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [mapType, colorBlindMode, showFills, layerOpacity, mapOpacity, pointSize, aiModel, user, updateUser]);

    // Per-category heatmap toggles
    const HEATMAP_CATEGORIES = [
        { key: 'healthcareScore', labelCs: 'Zdravotnictví', labelEn: 'Healthcare' },
        { key: 'educationScore', labelCs: 'Vzdělávání', labelEn: 'Education' },
        { key: 'transportScore', labelCs: 'Doprava', labelEn: 'Transport' },
        { key: 'cultureScore', labelCs: 'Kultura', labelEn: 'Culture' },
        { key: 'otherScore', labelCs: 'Ostatní', labelEn: 'Other' },
        { key: 'stopsScore', labelCs: 'Zastávky', labelEn: 'Stops' },
        { key: 'natureScore', labelCs: 'Příroda', labelEn: 'Nature' },
    ] as const;

    // Unified step-based color scale for all categories
    // Score 0=dark red → light red → yellow → orange → light green → dark green → 100+=light blue
    const HEATMAP_COLOR_SCALE = [
        { threshold: 0, color: '#8B0000' },     // 0%  - dark red
        { threshold: 1, color: '#FF6B6B' },      // 1-10% - light red
        { threshold: 11, color: '#FF6B6B' },     // 11-20% - light red
        { threshold: 21, color: '#ff8000ff' },     // 21-30% - yellow
        { threshold: 31, color: '#FFD700' },     // 31-40% - yellow
        { threshold: 41, color: '#90EE90' },     // 41-50% - orange
        { threshold: 51, color: '#67e667ff' },     // 51-60% - orange
        { threshold: 61, color: '#40ea40ff' },     // 61-70% - orange
        { threshold: 71, color: '#29e729ff' },     // 71-80% - light green
        { threshold: 81, color: '#228B22' },     // 81-90% - dark green
        { threshold: 91, color: '#0a7e27ff' },     // 91-99% - dark green
        { threshold: 100, color: '#4FC3F7' },    // 100%+ - light blue
    ];

    const [activeHeatmaps, setActiveHeatmaps] = useState<Record<string, boolean>>({});
    const [heatmapData, setHeatmapData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [highlightedTilesData, setHighlightedTilesData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [aiPoiData, setAiPoiData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [aiLocationData, setAiLocationData] = useState<GeoJSON.FeatureCollection | null>(null);

    const [questionnaireHeatmapData, setQuestionnaireHeatmapData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [tileMatchScore, setTileMatchScore] = useState<number | null>(null);


    // Compute centroid of a polygon (simple average of coordinates)
    const getPolygonCentroid = useCallback((feature: GeoJSON.Feature): [number, number] | null => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const geom = feature.geometry as any;
            if (!geom || !geom.coordinates) return null;
            const coords = geom.coordinates[0] as [number, number][];
            if (!coords || coords.length === 0) return null;
            let sumLng = 0, sumLat = 0;
            // Exclude the closing vertex (same as first)
            const len = coords.length - 1;
            for (let i = 0; i < len; i++) {
                sumLng += coords[i][0];
                sumLat += coords[i][1];
            }
            return [sumLng / len, sumLat / len];
        } catch {
            return null;
        }
    }, []);

    const handleTileClick = useCallback((clickedFeature: GeoJSON.Feature) => {
        if (!heatmapData) return;

        const clickedCenter = getPolygonCentroid(clickedFeature);
        if (!clickedCenter) return;

        // Compute distances from clicked tile to all tiles
        const withDistances = (heatmapData || questionnaireHeatmapData).features
            .map(f => {
                const center = getPolygonCentroid(f);
                if (!center) return null;
                const dLng = center[0] - clickedCenter[0];
                const dLat = center[1] - clickedCenter[1];
                const dist = dLng * dLng + dLat * dLat; // squared euclidean is fine for sorting
                return { feature: f, dist };
            })
            .filter(Boolean) as { feature: GeoJSON.Feature; dist: number }[];

        // Sort by distance, take the 100 closest (excluding distance=0 which is the clicked tile itself)
        withDistances.sort((a, b) => a.dist - b.dist);
        const nearest = withDistances.slice(0, 101); // include clicked tile + 100 nearest

        setHighlightedTilesData({
            type: 'FeatureCollection',
            features: nearest.map(n => n.feature)
        });
    }, [heatmapData, getPolygonCentroid]);

    const handleQuestionnaireTileClick = useCallback((clickedFeature: GeoJSON.Feature) => {
        const score = clickedFeature.properties?.matchPercent;
        setTileMatchScore(typeof score === 'number' ? Math.round(score) : null);
        handleTileClick(clickedFeature);
    }, [handleTileClick]);

    useEffect(() => {
        const handleOpenChat = () => setIsChatOpen(true);
        window.addEventListener('open-ai-chat', handleOpenChat);
        return () => window.removeEventListener('open-ai-chat', handleOpenChat);
    }, []);

    useEffect(() => {
        const handlePois = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.geojson) setAiPoiData(detail.geojson);
        };
        const handleLocation = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.geojson) setAiLocationData(detail.geojson);
        };
        const handleReset = () => {
            setAiPoiData(null);
            setAiLocationData(null);
        };
        window.addEventListener('ai-map-pois', handlePois);
        window.addEventListener('ai-map-location', handleLocation);
        window.addEventListener('ai-map-reset', handleReset);
        return () => {
            window.removeEventListener('ai-map-pois', handlePois);
            window.removeEventListener('ai-map-location', handleLocation);
            window.removeEventListener('ai-map-reset', handleReset);
        };
    }, []);

    useEffect(() => {
        const handleFeatureClick = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.features && detail.features.length > 0) {
                setClickedFeatures(detail.features);
                setIsFeatureInfoOpen(true);
            }
        };
        window.addEventListener('dataset-features-clicked', handleFeatureClick);
        return () => window.removeEventListener('dataset-features-clicked', handleFeatureClick);
    }, []);

    useEffect(() => {
        const handleTourFocus = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const target = detail?.target;

            if (target === "[data-tour='questionnaire-panel-intro']") {
                setIsChatOpen(false); setIsSettingsOpen(false); setIsAiSettingsOpen(false); setIsDatasetsOpen(false); setActiveRegionPanel(null); setIsAuthOpen(false);
                setIsQuestionnaireOpen(true);
            } else if (target === "[data-tour='ai-chat-input']" || target === "[data-tour='ai-chat-panel']" || target === "[data-tour='ai-settings-button']") {
                setIsQuestionnaireOpen(false); setIsSettingsOpen(false); setIsAiSettingsOpen(false); setIsDatasetsOpen(false); setActiveRegionPanel(null); setIsAuthOpen(false);
                setIsChatOpen(true);
            } else if (target === "[data-tour='ai-settings-panel']") {
                setIsQuestionnaireOpen(false); setIsSettingsOpen(false); setIsChatOpen(false); setIsDatasetsOpen(false); setActiveRegionPanel(null); setIsAuthOpen(false);
                setIsAiSettingsOpen(true);
            } else if (target === "[data-tour='region-data-panel']") {
                setIsQuestionnaireOpen(false); setIsChatOpen(false); setIsSettingsOpen(false); setIsAiSettingsOpen(false); setIsDatasetsOpen(false); setIsAuthOpen(false);
                const firstRegion = Object.keys(globalData).find(regionId => {
                    const rData = globalData[regionId];
                    return rData && Object.values(rData).some(cats => cats.length > 0);
                });
                if (firstRegion) {
                    setActiveRegionPanel(firstRegion);
                } else {
                    setActiveRegionPanel(ALL_REGIONS[0].id);
                }
            } else if (target === "[data-tour='settings-panel']") {
                setIsQuestionnaireOpen(false); setIsChatOpen(false); setIsAiSettingsOpen(false); setIsDatasetsOpen(false); setActiveRegionPanel(null); setIsAuthOpen(false);
                setIsSettingsOpen(true);
            } else if (target === "[data-tour='datasets-panel']") {
                setIsQuestionnaireOpen(false); setIsChatOpen(false); setIsSettingsOpen(false); setIsAiSettingsOpen(false); setActiveRegionPanel(null); setIsAuthOpen(false);
                setIsDatasetsOpen(true);
            } else {
                setIsQuestionnaireOpen(false);
                setIsChatOpen(false);
                setIsSettingsOpen(false);
                setIsAiSettingsOpen(false);
                setIsDatasetsOpen(false);
                setActiveRegionPanel(null);
                setIsAuthOpen(false);
            }
        };
        window.addEventListener('tour:focus', handleTourFocus);
        return () => window.removeEventListener('tour:focus', handleTourFocus);
    }, [globalData]);

    const toggleHeatmap = (key: string, value: boolean) => {
        setActiveHeatmaps(prev => ({ ...prev, [key]: value }));
    };

    const anyHeatmapActive = Object.values(activeHeatmaps).some(Boolean);

    const resetSettings = () => {
        setMapType('default');
        setColorBlindMode(false);
        setShowFills(true);
        setLayerOpacity(0.8);
        setMapOpacity(1.0);
        setPointSize(8);
        setActiveHeatmaps({});
        setQuestionnaireHeatmapData(null);
    };

    useEffect(() => {
        // Přidán timestamp pro obejití případného cachování prohlížeče, aby to hned načetlo nové soubory
        fetch(`/api/files?t=${Date.now()}`)
            .then(r => r.json())
            .then(data => {
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    setGlobalData(data);
                }
            })
            .catch(err => console.error("Chyba při načítání souborů:", err));
    }, []);

    const handleQuestionnaireEvaluated = async (answers: Record<number, boolean>) => {
        console.log("=== DOTAZNÍK: ZAČÁTEK VYHODNOCENÍ ===");
        console.log("Odpovědi z panelu:", answers);

        // Získat aktuální data
        let currentTilesData = heatmapData;

        if (!currentTilesData) {
            try {
                const resp = await fetch('/data/tiles_database_final_purged.json');
                const data = await resp.json();
                const featureList = Array.isArray(data) ? data : (data.features || []);
                currentTilesData = {
                    type: 'FeatureCollection',
                    features: featureList
                };
                setHeatmapData(currentTilesData);
            } catch (err) {
                console.error("Chyba při stahování hodnot pro heatmapu:", err);
                return;
            }
        }

        const result = evaluateAnswers(answers, currentTilesData);

        console.log("=== DOTAZNÍK: VYHODNOCENÍ DOKONČENO ===");
        console.log("Vygenerováno dlaždic k zobrazení:", result.features.length);

        setQuestionnaireHeatmapData(result);

        // Vypneme per-category heatmapy ať neruší
        setActiveHeatmaps({});
    };



    // Base map styles
    const mapStyleProp = useMemo(() => {
        if (mapType === 'satellite') {
            const style = {
                version: 8,
                sources: {
                    'esri-satellite': {
                        type: 'raster',
                        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                        tileSize: 256,
                        attribution: 'Esri'
                    }
                },
                layers: [{
                    id: 'satellite',
                    type: 'raster',
                    source: 'esri-satellite',
                    minzoom: 0,
                    maxzoom: 22
                }]
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { light: style as any, dark: style as any };
        }
        if (mapType === 'osm') {
            const style = {
                version: 8,
                sources: {
                    'osm': {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© OpenStreetMap'
                    }
                },
                layers: [{
                    id: 'osm',
                    type: 'raster',
                    source: 'osm',
                    minzoom: 0,
                    maxzoom: 19
                }]
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { light: style as any, dark: style as any };
        }
        if (mapType === 'katastr') {
            const style = {
                version: 8,
                sources: {
                    'osm': {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© OpenStreetMap'
                    },
                    'katastr': {
                        type: 'raster',
                        tiles: ['https://services.cuzk.cz/wmts/local-km-wmts-google/rest/WMTS/default/KN/{z}/{y}/{x}'],
                        tileSize: 256,
                        attribution: '© ČÚZK'
                    }
                },
                layers: [
                    {
                        id: 'osm',
                        type: 'raster',
                        source: 'osm',
                        minzoom: 0,
                        maxzoom: 19
                    },
                    {
                        id: 'katastr',
                        type: 'raster',
                        source: 'katastr',
                        minzoom: 15,
                        maxzoom: 24
                    }
                ]
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { light: style as any, dark: style as any };
        }
        return undefined; // Let maplibre component use default dark/light Carto
    }, [mapType]);

    useEffect(() => {
        if (anyHeatmapActive && !heatmapData) {
            fetch('/data/tiles_database_final_purged.json')
                .then(r => r.json())
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .then((data: any) => {
                    const featureList = Array.isArray(data) ? data : (data.features || []);
                    setHeatmapData({
                        type: 'FeatureCollection',
                        features: featureList
                    });
                })
                .catch(err => {
                    console.error("Chyba při stahování hodnot pro heatmapu:", err);
                });
        }
    }, [anyHeatmapActive, heatmapData]);

    return (
        <div className="h-screen w-full flex overflow-hidden bg-[#f3f3f3] dark:bg-[#0b0b0b] font-sans text-black dark:text-white transition-colors duration-300">
            <AppTour />
            <style>{`.maplibregl-canvas { opacity: ${mapOpacity} !important; transition: opacity 0.2s; }`}</style>

            {/* Sidebars Wrapper */}
            <div
                className={`relative h-full shrink-0 ${isCollapsed ? "transition-all duration-300 ease-in-out" : ""}`}
                style={{ width: isCollapsed ? 80 : sidebarWidth }}
            >
                {/* Resize Handle */}
                {!isCollapsed && (
                    <div
                        onMouseDown={startResize}
                        className="absolute top-0 right-0 w-1 h-full z-50 cursor-ew-resize hover:bg-blue-500/40 transition-colors"
                    />
                )}
                {/* Original Sidebar */}
                <aside
                    className={`absolute top-0 left-0 w-full h-full border-r border-black/5 dark:border-white/5 bg-[#0b0b0b] text-white dark:bg-[#f3f3f3] dark:text-black flex flex-col p-4 md:p-6 z-10 overflow-hidden transition-all duration-300 ease-in-out ${(isChatOpen || isQuestionnaireOpen || isSettingsOpen || isAiSettingsOpen || isAuthOpen || isDatasetsOpen || !!activeRegionPanel) ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100 pointer-events-auto"
                        } ${isCollapsed ? "items-center justify-between" : ""}`}
                >
                    {/* Background Glows (adapted from navbar styling) */}
                    {!isCollapsed && (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-r-3xl">
                            <div className="absolute top-12 right-40 -translate-y-1/2 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute bottom-36 -right-12 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl pointer-events-none"></div>
                        </div>
                    )}

                    {/* Top Section: Collapse Toggle & Logo */}
                    {isCollapsed ? (
                        <div className="flex flex-col gap-6 w-full items-center mt-2 relative z-10">
                            <div className="transition-opacity">
                                <Logo className="h-6 w-6 shrink-0" />
                            </div>
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-2 cursor-pointer transition-colors text-white dark:text-black opacity-60 hover:opacity-100"
                                title={language === 'cs' ? 'Rozbalit panel' : 'Expand panel'}
                            >
                                <PanelLeft size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mt-2 relative z-10">
                            <div className="flex items-center gap-3 font-bold tracking-tight transition-opacity text-xl">
                                <Logo className="h-8 w-8 shrink-0" />
                                <span>ZIJE!SE</span>
                            </div>

                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-2 cursor-pointer transition-colors text-white dark:text-black opacity-60 hover:opacity-100"
                                title={language === 'cs' ? 'Sbalit panel' : 'Collapse panel'}
                            >
                                <PanelLeftClose size={20} />
                            </button>
                        </div>
                    )}

                    <div className="h-px w-full bg-white/10 dark:bg-black/10 shrink-0 my-4"></div>

                    {/* Navigation Elements / Buttons */}
                    <nav className="flex flex-col gap-4 relative z-10 flex-1 min-h-0 mb-4">
                        <button
                            data-tour="questionnaire"
                            onClick={() => setIsQuestionnaireOpen(true)}
                            className={`outline-none focus:outline-none focus:ring-0 cursor-pointer flex items-center justify-center rounded-full transition-all transform-gpu duration-300 ease-in-out active:translate-y-px ${isCollapsed
                                ? "h-12 w-12 mx-auto bg-[#ececeb] dark:bg-[#0b0b0b] text-black dark:text-white hover:bg-white dark:hover:bg-black/90 border border-white/10 dark:border-black/10 backdrop-blur-md"
                                : "gap-3 px-5 py-3 w-full bg-[#ececeb] text-sm font-medium text-black hover:bg-white dark:bg-[#0b0b0b] dark:text-white dark:hover:bg-black/90 border border-white/10 dark:border-black/10 backdrop-blur-md"
                                }`}
                            title={language === 'cs' ? 'Dotazník' : 'Questionnaire'}
                        >
                            <ListChecks size={20} className={isCollapsed ? "" : "shrink-0"} />
                            {!isCollapsed && <span className="flex-1 text-left">{language === 'cs' ? 'Dotazník' : 'Questionnaire'}</span>}
                        </button>

                        <button
                            data-tour="ai-chat"
                            onClick={() => setIsChatOpen(true)}
                            className={`outline-none focus:outline-none focus:ring-0 cursor-pointer flex items-center justify-center rounded-full transition-all transform-gpu duration-300 ease-in-out active:translate-y-px ${isCollapsed
                                ? "h-12 w-12 mx-auto bg-[#3388ff] hover:bg-[#2563eb] text-white border border-white/10 dark:border-black/10 backdrop-blur-md"
                                : "gap-3 px-5 py-3 w-full bg-[#3388ff] hover:bg-[#2563eb] text-sm font-medium text-white border border-white/10 dark:border-black/10 backdrop-blur-md"
                                }`}
                            title="AI Chat"
                        >
                            <BotMessageSquare size={20} className={isCollapsed ? "" : "shrink-0"} />
                            {!isCollapsed && <span className="flex-1 text-left">AI Chat</span>}
                        </button>

                        <div className="h-px w-full bg-white/10 dark:bg-black/10 shrink-0 my-0"></div>

                        <div data-tour="regions" className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-1.5 pr-1" data-lenis-prevent>
                            {Object.keys(globalData).length === 0 ? (
                                <div className="text-xs opacity-50 py-2 pl-2 text-center mt-4">
                                    {language === 'cs' ? "Načítám data..." : "Loading data..."}
                                </div>
                            ) : isCollapsed ? (
                                <button
                                    onClick={() => setIsCollapsed(false)}
                                    className="h-12 w-12 mx-auto rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#222222] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 flex items-center justify-center transition-all transform-gpu duration-300 ease-in-out cursor-pointer active:translate-y-px"
                                    title={language === 'cs' ? 'Kraje' : 'Regions'}
                                >
                                    <MapPin size={20} />
                                </button>
                            ) : (
                                <>
                                    {[...ALL_REGIONS].sort((a, b) => {
                                        const aData = Object.values(globalData[a.id] || {}).some(cats => cats.length > 0);
                                        const bData = Object.values(globalData[b.id] || {}).some(cats => cats.length > 0);
                                        if (aData && !bData) return -1;
                                        if (!aData && bData) return 1;
                                        return 0; // keep original order for ties
                                    }).map((region) => {
                                        const regionCats = globalData[region.id] || {};
                                        const hasData = Object.values(regionCats).some(cats => cats.length > 0);
                                        const catCount = Object.values(regionCats).filter(cats => cats.length > 0).length;
                                        return (
                                            <button
                                                key={region.id}
                                                onClick={() => hasData && setActiveRegionPanel(region.id)}
                                                disabled={!hasData}
                                                className={`group outline-none focus:outline-none focus:ring-0 flex items-center justify-between transition-all transform-gpu duration-300 ease-in-out ${!hasData ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:translate-y-px'} px-5 py-3 w-full text-sm font-medium rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#222222] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10`}
                                                title={!hasData ? (language === 'cs' ? 'Prázdný' : 'Empty') : region.label}
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <Folder size={13} className="shrink-0 opacity-60" />
                                                    <span className="flex-1 text-left truncate">{region.label}</span>
                                                </div>
                                                {hasData && (
                                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                        <span className="text-[11px] tabular-nums opacity-50 font-mono">{catCount}</span>
                                                        <ChevronDown size={14} className="text-white/60 dark:text-black/60" />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </>
                            )}
                        </div>
                    </nav>

                    {/* Bottom Area */}
                    <div data-tour="user-area" className={`mt-auto relative z-10 border-t border-white/10 dark:border-black/10 flex ${isCollapsed ? "flex-col gap-4 pt-4 items-center" : "flex-col gap-4 pt-4"}`}>

                        {/* User Profile / Login */}
                        {user ? (
                            <button
                                onClick={logout}
                                className={`outline-none focus:outline-none focus:ring-0 cursor-pointer flex items-center rounded-full transition-all transform-gpu duration-300 ease-in-out active:translate-y-px ${isCollapsed
                                    ? "justify-center h-12 w-12 mx-auto bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 backdrop-blur-md"
                                    : "justify-between gap-3 p-1.5 pl-2 pr-4 w-full bg-[#1a1a1a] dark:bg-[#ececeb] text-sm text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 backdrop-blur-md"
                                    }`}
                                title={language === 'cs' ? 'Odhlásit se' : 'Logout'}
                            >
                                {isCollapsed ? (
                                    <div className="h-8 w-8 rounded-full bg-[#3388ff] flex items-center justify-center text-white font-bold shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                ) : (
                                    <>
                                        <div className="h-8 w-8 rounded-full bg-[#3388ff] flex items-center justify-center text-white font-bold shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col flex-1 items-start justify-center overflow-hidden leading-tight">
                                            <span className="font-bold truncate w-full text-left">{user.name}</span>
                                        </div>
                                        <div className="pr-1 text-[#3388ff]/80 hover:text-[#3388ff] transition-colors">
                                            <LogOut size={16} />
                                        </div>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={openAuthPanel}
                                className={`outline-none focus:outline-none focus:ring-0 cursor-pointer flex items-center justify-center rounded-full transition-all transform-gpu duration-300 ease-in-out active:translate-y-px ${isCollapsed
                                    ? "h-12 w-12 mx-auto bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 backdrop-blur-md"
                                    : "gap-3 px-5 py-3 w-full bg-[#1a1a1a] dark:bg-[#ececeb] text-sm font-medium text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 backdrop-blur-md"
                                    }`}
                                title={language === 'cs' ? 'Profil / Přihlásit se' : 'Profile / Login'}
                            >
                                <User size={20} />
                                {!isCollapsed && <span className="flex-1 text-left">{language === 'cs' ? 'Přihlásit se' : 'Login'}</span>}
                            </button>
                        )}

                        <div className="h-px w-full bg-white/10 dark:bg-black/10 shrink-0 my-0"></div>

                        {/* Language & Theme Controls */}
                        {isCollapsed ? (
                            <>
                                <button
                                    onClick={toggleLanguage}
                                    className="cursor-pointer flex items-center justify-center transition-colors mb-2 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                                    title={language === 'cs' ? 'Přepnout jazyk' : 'Switch Language'}
                                >
                                    <Globe size={20} />
                                </button>
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="cursor-pointer flex items-center justify-center transition-colors mb-2 duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                                    title={language === 'cs' ? 'Nastavení' : 'Settings'}
                                >
                                    <Settings2 size={20} />
                                </button>
                                <button
                                    onClick={() => setIsDatasetsOpen(true)}
                                    className="cursor-pointer flex items-center justify-center transition-colors mb-2 duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                                    title={language === 'cs' ? 'Datasety' : 'Datasets'}
                                >
                                    <Database size={20} />
                                </button>
                                <ModeToggle />
                            </>
                        ) : (
                            <div className="flex items-center justify-between w-full mt-2">
                                <button
                                    data-tour="language"
                                    onClick={toggleLanguage}
                                    className="group cursor-pointer flex items-center justify-center transition-all overflow-hidden p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                                    title={language === 'cs' ? 'Přepnout jazyk' : 'Switch Language'}
                                >
                                    <Globe size={18} />
                                    <span className="text-xs font-bold uppercase max-w-0 opacity-0 group-hover:max-w-[20px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 overflow-hidden">{language}</span>
                                </button>

                                <button
                                    data-tour="settings"
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                                    title={language === 'cs' ? 'Nastavení' : 'Settings'}
                                >
                                    <Settings2 size={18} />
                                </button>
                                <button
                                    data-tour="datasets"
                                    onClick={() => setIsDatasetsOpen(true)}
                                    className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                                    title={language === 'cs' ? 'Datasety' : 'Datasets'}
                                >
                                    <Database size={18} />
                                </button>

                                <ModeToggle />
                            </div>
                        )}

                        {!isCollapsed && (
                            <div className="text-[12px] mt-2 font-medium opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 group w-full cursor-pointer" onClick={() => window.location.href = "/"}>
                                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                {language === 'cs' ? 'Zpět na úvod' : 'Back to Home'}
                            </div>
                        )}
                    </div>
                </aside>

                <AIChatPanel
                    isOpen={isChatOpen && !isAiSettingsOpen}
                    onClose={() => setIsChatOpen(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    onOpenAiSettings={() => setIsAiSettingsOpen(true)}
                    onLoginClick={openAuthPanel}
                    aiModel={aiModel}
                />
                <AiSettingsPanel
                    isOpen={isAiSettingsOpen}
                    onClose={() => setIsAiSettingsOpen(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    onLoginClick={openAuthPanel}
                    aiModel={aiModel}
                    setAiModel={setAiModel}
                />
                <QuestionnairePanel
                    isOpen={isQuestionnaireOpen}
                    onClose={() => setIsQuestionnaireOpen(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    onEvaluated={handleQuestionnaireEvaluated}
                    onLoginClick={openAuthPanel}
                    onRemoveHeatmap={() => setQuestionnaireHeatmapData(null)}
                    hasHeatmap={questionnaireHeatmapData !== null}
                />
                <AuthPanel
                    isOpen={isAuthOpen}
                    onClose={() => setIsAuthOpen(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />

                <RegionDataPanel
                    isOpen={!!activeRegionPanel}
                    onClose={() => setActiveRegionPanel(null)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    regionId={activeRegionPanel || ''}
                    regionName={activeRegionPanel ? getRegionLabel(activeRegionPanel) : ''}
                    regionData={activeRegionPanel && globalData[activeRegionPanel] ? globalData[activeRegionPanel] : {}}
                    activeLayers={activeLayers}
                    toggleLayer={toggleLayer}
                    onOpenDatasets={() => {
                        setActiveRegionPanel(null);
                        setIsDatasetsOpen(true);
                    }}
                />

                <SettingsPanel
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    mapType={mapType}
                    setMapType={setMapType}
                    colorBlindMode={colorBlindMode}
                    setColorBlindMode={setColorBlindMode}
                    showFills={showFills}
                    setShowFills={setShowFills}
                    layerOpacity={layerOpacity}
                    setLayerOpacity={setLayerOpacity}
                    mapOpacity={mapOpacity}
                    setMapOpacity={setMapOpacity}
                    pointSize={pointSize}
                    setPointSize={setPointSize}
                    heatmapCategories={HEATMAP_CATEGORIES}
                    activeHeatmaps={activeHeatmaps}
                    toggleHeatmap={toggleHeatmap}
                    resetSettings={resetSettings}
                    onOpenDatasets={() => {
                        setIsSettingsOpen(false);
                        setIsDatasetsOpen(true);
                    }}
                />
                <DatasetsPanel
                    isOpen={isDatasetsOpen}
                    onClose={() => setIsDatasetsOpen(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    activeLayers={activeLayers}
                    toggleLayer={toggleLayer}
                    onOpenSettings={() => {
                        setIsDatasetsOpen(false);
                        setIsSettingsOpen(true);
                    }}
                />
            </div>

            <main data-tour="map" className="flex-1 h-full relative">
                <Map
                    center={[15.4730, 49.8175]}
                    zoom={6.5}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    styles={mapStyleProp as any}
                >
                    <MapRightClickHandler />
                    <MapControls position="bottom-right" showZoom showCompass />
                    <LegacyLayers
                        activeLayers={activeLayers}
                        colorBlindMode={colorBlindMode}
                        layerOpacity={layerOpacity}
                        showFills={showFills}
                        pointSize={pointSize}
                    />
                    {heatmapData && HEATMAP_CATEGORIES.map(cat => (
                        activeHeatmaps[cat.key] && (
                            <MapFillLayer
                                key={cat.key}
                                id={cat.key}
                                data={heatmapData}
                                colorProp={cat.key}
                                colorScale={HEATMAP_COLOR_SCALE}
                                defaultColor="rgba(0,0,0,0)"
                                opacity={layerOpacity}
                                onClick={handleTileClick}
                            />
                        )
                    ))}
                    {questionnaireHeatmapData && (
                        <MapFillLayer
                            id="questionnaire-heatmap"
                            data={questionnaireHeatmapData}
                            colorProp="matchPercent"
                            colorScale={HEATMAP_COLOR_SCALE}
                            defaultColor="rgba(0,0,0,0)"
                            opacity={layerOpacity}
                            onClick={handleQuestionnaireTileClick}
                        />
                    )}
                    {highlightedTilesData && (
                        <MapFillLayer
                            id="highlighted-nearest"
                            data={highlightedTilesData}
                            colorProp="healthcareScore"
                            colorScale={[]}
                            defaultColor="rgba(0, 200, 255, 0.25)"
                            opacity={1}
                            outlineColor="#00e5ff"
                        />
                    )}
                    {aiLocationData && (
                        <MapLocationLayer
                            id="ai-location"
                            data={aiLocationData}
                            autoFlyTo={true}
                        />
                    )}
                    {aiPoiData && (
                        <MapCircleLayer
                            id="ai-pois"
                            data={aiPoiData}
                            autoFlyTo={true}
                            onClick={(f) => {
                                setClickedFeatures([{
                                    layer: { id: 'Nalezená místa' },
                                    object: f
                                }]);
                                setIsFeatureInfoOpen(true);
                            }}
                        />
                    )}
                </Map>
                {tileMatchScore !== null && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0b0b0b]/90 dark:bg-[#f3f3f3]/90 backdrop-blur-md border border-white/10 dark:border-black/10 shadow-xl text-white dark:text-black">
                        <span className="text-xs opacity-60 font-medium">{language === 'cs' ? 'Shoda' : 'Match'}</span>
                        <span className="text-lg font-black tabular-nums">{tileMatchScore}%</span>
                        <button onClick={() => setTileMatchScore(null)} className="cursor-pointer opacity-40 hover:opacity-100 transition-opacity ml-1 text-sm">✕</button>
                    </div>
                )}
                <FeatureInfoPanel
                    isOpen={isFeatureInfoOpen}
                    onClose={() => setIsFeatureInfoOpen(false)}
                    clickedFeatures={clickedFeatures}
                />
            </main>
        </div>
    );
}
