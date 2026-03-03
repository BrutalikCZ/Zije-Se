"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, BotMessageSquare, ListChecks, PanelLeftClose, PanelLeft, User, Globe, ChevronDown, Layers, Settings2, RotateCcw, X, AlertTriangle, Stethoscope, Bus, Landmark, Dumbbell, GraduationCap, TreePine, Map as MapIcon, Factory, LogOut } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Map, MapControls, MapFillLayer } from "@/components/map/map";
import { LegacyLayers } from "@/components/map/legacy-layers";
import { QuestionnairePanel, SettingsPanel, AIChatPanel, AiSettingsPanel, AuthPanel } from "@/components/sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import * as turf from '@turf/centroid';

export default function AppPage() {
    const { user, logout } = useAuth();
    const { language, toggleLanguage } = useLanguage();
    const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

    // Auth Panel Toggle Exposed for nested components
    const openAuthPanel = () => {
        setIsQuestionnaireOpen(false);
        setIsChatOpen(false);
        setIsSettingsOpen(false);
        setIsAiSettingsOpen(false);
        setIsAuthOpen(true);
    };

    // Map Settings State
    const [mapType, setMapType] = useState('default');
    const [colorBlindMode, setColorBlindMode] = useState(false);
    const [showFills, setShowFills] = useState(true);
    const [layerOpacity, setLayerOpacity] = useState(0.8);
    const [mapOpacity, setMapOpacity] = useState(1.0);

    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({});
    const [files, setFiles] = useState<string[]>([]);

    // Per-category heatmap toggles
    const HEATMAP_CATEGORIES = [
        { key: 'healthcareScore', labelCs: 'Zdravotnictví', labelEn: 'Healthcare' },
        { key: 'educationScore', labelCs: 'Vzdělávání', labelEn: 'Education' },
        { key: 'transportScore', labelCs: 'Doprava', labelEn: 'Transport' },
        { key: 'cultureScore', labelCs: 'Kultura', labelEn: 'Culture' },
        { key: 'otherScore', labelCs: 'Ostatní', labelEn: 'Other' },
    ] as const;

    // Unified step-based color scale for all categories
    // Score 0=dark red → light red → yellow → orange → light green → dark green → 100+=light blue
    const HEATMAP_COLOR_SCALE = [
        { threshold: 0, color: '#8B0000' },     // 0%  - dark red
        { threshold: 1, color: '#FF6B6B' },      // 1-10% - light red
        { threshold: 11, color: '#FF6B6B' },     // 11-20% - light red
        { threshold: 21, color: '#FFD700' },     // 21-30% - yellow
        { threshold: 31, color: '#FFD700' },     // 31-40% - yellow
        { threshold: 41, color: '#FF8C00' },     // 41-50% - orange
        { threshold: 51, color: '#FF8C00' },     // 51-60% - orange
        { threshold: 61, color: '#FF8C00' },     // 61-70% - orange
        { threshold: 71, color: '#90EE90' },     // 71-80% - light green
        { threshold: 81, color: '#228B22' },     // 81-90% - dark green
        { threshold: 91, color: '#228B22' },     // 91-99% - dark green
        { threshold: 100, color: '#4FC3F7' },    // 100%+ - light blue
    ];

    const [activeHeatmaps, setActiveHeatmaps] = useState<Record<string, boolean>>({});
    const [heatmapData, setHeatmapData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [highlightedTilesData, setHighlightedTilesData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [questionnaireResultData, setQuestionnaireResultData] = useState<GeoJSON.FeatureCollection | null>(null);

    // Question → category mapping
    // type: 'positive' = "Ano" means tile gets +1 if it has score in that category
    // type: 'blacklist' = "Ano" means tile gets blacklisted if it has score in that category
    const QUESTION_CATEGORY_MAP: Record<number, { category: string; type: 'positive' | 'blacklist' }> = {
        // Blacklist questions ("Ano" = chci se vyhnout → blacklist tiles that have this)
        1: { category: 'transportScore', type: 'positive' },   // město vs vesnice → transport proxy
        2: { category: 'otherScore', type: 'blacklist' },       // záplavy
        3: { category: 'transportScore', type: 'positive' },    // zastávka MHD
        4: { category: 'healthcareScore', type: 'positive' },   // nemocnice
        5: { category: 'educationScore', type: 'positive' },    // škola
        6: { category: 'transportScore', type: 'blacklist' },   // hluk
        7: { category: 'otherScore', type: 'blacklist' },       // průmyslové zóny
        8: { category: 'transportScore', type: 'positive' },    // internet
        9: { category: 'transportScore', type: 'positive' },    // dostupnost krajského města
        10: { category: 'otherScore', type: 'blacklist' },      // čisté ovzduší
        11: { category: 'cultureScore', type: 'positive' },     // ZOO
        12: { category: 'healthcareScore', type: 'positive' },   // lékárna
        13: { category: 'cultureScore', type: 'positive' },     // knihovna
        14: { category: 'transportScore', type: 'positive' },   // letiště
        15: { category: 'cultureScore', type: 'positive' },     // historické centrum
        16: { category: 'otherScore', type: 'positive' },       // nezaměstnanost
        17: { category: 'otherScore', type: 'positive' },       // golf
        18: { category: 'educationScore', type: 'positive' },   // poradna
        19: { category: 'otherScore', type: 'blacklist' },      // vlny veder
        20: { category: 'otherScore', type: 'positive' },       // pivovary
        21: { category: 'educationScore', type: 'positive' },   // dětské hřiště
        22: { category: 'otherScore', type: 'positive' },       // přírodní park
        23: { category: 'otherScore', type: 'positive' },       // supermarkety
        24: { category: 'cultureScore', type: 'positive' },     // divadla
        25: { category: 'cultureScore', type: 'positive' },     // botanická zahrada
        26: { category: 'otherScore', type: 'positive' },       // aquapark
        27: { category: 'educationScore', type: 'positive' },   // volnočasová střediska
        28: { category: 'otherScore', type: 'positive' },       // sběrný dvůr
        29: { category: 'otherScore', type: 'positive' },       // agroturistika
        30: { category: 'cultureScore', type: 'positive' },     // lanové centrum
        31: { category: 'educationScore', type: 'positive' },   // střední/VŠ
        32: { category: 'otherScore', type: 'blacklist' },      // větrná eroze
        33: { category: 'cultureScore', type: 'positive' },     // hornické památky
        34: { category: 'otherScore', type: 'blacklist' },      // věznice
        35: { category: 'cultureScore', type: 'positive' },     // kino
        36: { category: 'otherScore', type: 'positive' },       // sportoviště
        37: { category: 'cultureScore', type: 'positive' },     // UNESCO
        38: { category: 'cultureScore', type: 'positive' },     // hudební kluby
        39: { category: 'otherScore', type: 'positive' },       // naučné stezky
        40: { category: 'cultureScore', type: 'positive' },     // muzea/galerie
        41: { category: 'healthcareScore', type: 'positive' },   // zubař
        42: { category: 'cultureScore', type: 'positive' },     // hrady/zámky
        43: { category: 'healthcareScore', type: 'positive' },   // domovy pro seniory
        44: { category: 'otherScore', type: 'positive' },       // lokální trhy
        45: { category: 'healthcareScore', type: 'positive' },   // praktický lékař
        46: { category: 'healthcareScore', type: 'positive' },   // lázně
        47: { category: 'otherScore', type: 'positive' },       // pošta
        48: { category: 'otherScore', type: 'positive' },       // lyžařské areály
        49: { category: 'transportScore', type: 'positive' },   // parkovací zóny
        50: { category: 'transportScore', type: 'positive' },   // cyklostezky
    };

    // Compute centroid of a polygon (simple average of coordinates)
    const getPolygonCentroid = useCallback((feature: GeoJSON.Feature): [number, number] | null => {
        try {
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
        const withDistances = heatmapData.features
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

    // Evaluate questionnaire answers and build custom heatmap
    const evaluateQuestionnaire = useCallback(async (answers: Record<number, boolean>) => {
        // Load tile data if not already loaded
        let tileData = heatmapData;
        if (!tileData) {
            try {
                const resp = await fetch('/data/tiles_database_final_purged.json');
                const rawData = await resp.json();
                const featureList = Array.isArray(rawData) ? rawData : (rawData.features || []);
                tileData = { type: 'FeatureCollection' as const, features: featureList };
                setHeatmapData(tileData);
            } catch (err) {
                console.error('Chyba při načítání dlaždic pro dotazník:', err);
                return;
            }
        }

        // Collect positive and blacklist questions that user answered "Ano"
        const positiveQuestions: { index: number; category: string }[] = [];
        const blacklistQuestions: { index: number; category: string }[] = [];

        for (const [indexStr, answer] of Object.entries(answers)) {
            const qIndex = parseInt(indexStr, 10);
            const mapping = QUESTION_CATEGORY_MAP[qIndex + 1]; // questions are 1-indexed in map
            if (!mapping) continue;

            if (answer === true) {
                if (mapping.type === 'positive') {
                    positiveQuestions.push({ index: qIndex, category: mapping.category });
                } else {
                    // blacklist type + answer "Ano" = user wants to AVOID this
                    blacklistQuestions.push({ index: qIndex, category: mapping.category });
                }
            }
        }

        const totalPositive = positiveQuestions.length;
        if (totalPositive === 0 && blacklistQuestions.length === 0) {
            // No actionable answers
            return;
        }

        // Score each tile
        const scoredFeatures = tileData.features.map((feature: any) => {
            const props = feature.properties || {};
            let blacklisted = false;

            // Check blacklist conditions
            for (const bq of blacklistQuestions) {
                const score = props[bq.category] || 0;
                if (score > 0) {
                    blacklisted = true;
                    break;
                }
            }

            if (blacklisted) {
                return {
                    ...feature,
                    properties: { ...props, matchPercent: 0 }
                };
            }

            // Count positive matches
            let matches = 0;
            for (const pq of positiveQuestions) {
                const score = props[pq.category] || 0;
                if (score > 0) {
                    matches++;
                }
            }

            const matchPercent = totalPositive > 0
                ? Math.round((matches / totalPositive) * 100)
                : 0;

            return {
                ...feature,
                properties: { ...props, matchPercent }
            };
        });

        setQuestionnaireResultData({
            type: 'FeatureCollection',
            features: scoredFeatures
        });
    }, [heatmapData]);

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
        setActiveHeatmaps({});
    };

    useEffect(() => {
        // Přidán timestamp pro obejití případného cachování prohlížeče, aby to hned načetlo nové soubory
        fetch(`/api/files?t=${Date.now()}`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setFiles(data);
                }
            })
            .catch(err => console.error("Chyba při načítání souborů:", err));
    }, []);

    const handleQuestionnaireEvaluated = () => {
        const newHeatmaps: Record<string, boolean> = {};
        HEATMAP_CATEGORIES.forEach(cat => {
            newHeatmaps[cat.key] = true;
        });
        setActiveHeatmaps(newHeatmaps);
    };

    const CATEGORY_MAP: Record<string, string[]> = {
        "Povodně a Rizika": ["záplavové", "zranitelnost"],
        "Zdravotnictví": ["lékař", "nemocnice", "ústav", "lázně", "zubní"],
        "Doprava": ["autobus", "železniční", "silnic"],
        "Kultura a Historie": ["divadl", "muze", "hrad", "památk", "knihovn", "galerie"],
        "Sport a Volný čas": ["golf", "zoo", "klub", "festival", "domov", "středisk"],
        "Vzdělávání": ["škol"],
        "Příroda": ["parky", "rezervace", "úses"],
        "Administrativa a Hranice": ["hranice", "členění", "adresář"],
        "Byznys a Průmysl": ["firmy", "infrastruktur", "pobídk", "klastr", "průmyslov", "kontejner"],
    };

    const categorizedFiles = useMemo(() => {
        const result: Record<string, string[]> = {
            "Ostatní": []
        };

        // Initialize all categories defined in CATEGORY_MAP
        Object.keys(CATEGORY_MAP).forEach(cat => {
            result[cat] = [];
        });

        files.forEach(file => {
            let matched = false;
            const lowerFile = file.toLowerCase();
            for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
                if (keywords.some(kw => lowerFile.includes(kw))) {
                    result[cat].push(file);
                    matched = true;
                    break;
                }
            }
            if (!matched) result["Ostatní"].push(file);
        });

        const finalResult: Record<string, string[]> = {};
        for (const [cat, items] of Object.entries(result)) {
            if (items.length > 0) finalResult[cat] = items;
        }
        return finalResult;
    }, [files]);

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
            return { light: style as any, dark: style as any };
        }
        return undefined; // Let maplibre component use default dark/light Carto
    }, [mapType]);

    useEffect(() => {
        if (anyHeatmapActive && !heatmapData) {
            fetch('/data/tiles_database_final_purged.json')
                .then(r => r.json())
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
            <style>{`.maplibregl-canvas { opacity: ${mapOpacity} !important; transition: opacity 0.2s; }`}</style>

            {/* Sidebars Wrapper */}
            <div className={`relative h-full shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-80"}`}>
                {/* Original Sidebar */}
                <aside
                    className={`absolute top-0 left-0 w-full h-full border-r border-black/5 dark:border-white/5 bg-[#0b0b0b] text-white dark:bg-[#f3f3f3] dark:text-black flex flex-col p-4 md:p-6 z-10 overflow-hidden transition-all duration-300 ease-in-out ${(isChatOpen || isQuestionnaireOpen || isSettingsOpen || isAiSettingsOpen || isAuthOpen) ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100 pointer-events-auto"
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

                        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1" data-lenis-prevent>
                            {Object.keys(categorizedFiles).length === 0 ? (
                                <div className="text-xs opacity-50 py-2 pl-2">
                                    {files.length === 0 ? (language === 'cs' ? "Žádné vrstvy nebyly nalezeny..." : "No layers found...") : (language === 'cs' ? "Načítám vrstvy..." : "Loading layers...")}
                                </div>
                            ) : (
                                Object.entries(categorizedFiles).map(([category, items]) => {
                                    return (
                                        <div key={category} className="flex flex-col">
                                            <button
                                                onClick={() => {
                                                    if (isCollapsed) setIsCollapsed(false);
                                                    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
                                                }}
                                                className={`outline-none focus:outline-none focus:ring-0 cursor-pointer flex items-center justify-between transition-all transform-gpu duration-300 ease-in-out active:translate-y-px ${isCollapsed
                                                    ? "h-12 w-12 mx-auto rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 backdrop-blur-md"
                                                    : "gap-3 px-5 py-3 w-full text-sm font-medium rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 backdrop-blur-md"
                                                    }`}
                                                title={language === 'cs' ? category : {
                                                    "Povodně a Rizika": "Floods & Risks",
                                                    "Zdravotnictví": "Healthcare",
                                                    "Doprava": "Transport",
                                                    "Kultura a Historie": "Culture & History",
                                                    "Sport a Volný čas": "Sports & Leisure",
                                                    "Vzdělávání": "Education",
                                                    "Příroda": "Nature",
                                                    "Administrativa a Hranice": "Administration & Borders",
                                                    "Byznys a Průmysl": "Business & Industry",
                                                    "Ostatní": "Other"
                                                }[category] || category}
                                            >
                                                <div className="flex items-center gap-3 w-full">
                                                    {!isCollapsed ? (
                                                        <span className="flex-1 text-left truncate">
                                                            {language === 'cs' ? category : {
                                                                "Povodně a Rizika": "Floods & Risks",
                                                                "Zdravotnictví": "Healthcare",
                                                                "Doprava": "Transport",
                                                                "Kultura a Historie": "Culture & History",
                                                                "Sport a Volný čas": "Sports & Leisure",
                                                                "Vzdělávání": "Education",
                                                                "Příroda": "Nature",
                                                                "Administrativa a Hranice": "Administration & Borders",
                                                                "Byznys a Průmysl": "Business & Industry",
                                                                "Ostatní": "Other"
                                                            }[category] || category}
                                                        </span>
                                                    ) : (
                                                        <span className="mx-auto text-xs font-bold uppercase truncate max-w-full px-1">
                                                            {category.substring(0, 3)}
                                                        </span>
                                                    )}
                                                </div>
                                                {!isCollapsed && (
                                                    <ChevronDown size={16} className={`shrink-0 transition-transform duration-200 ${openCategories[category] ? "rotate-180" : ""}`} />
                                                )}
                                            </button>

                                            {openCategories[category] && !isCollapsed && (
                                                <div className="flex flex-col mt-1 pl-0">
                                                    {items.map((file) => (
                                                        <label key={file} className="flex items-center gap-3 cursor-pointer py-1.5 px-1">
                                                            <div className="relative flex items-center shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only"
                                                                    checked={!!activeLayers[file]}
                                                                    onChange={(e) => setActiveLayers(prev => ({ ...prev, [file]: e.target.checked }))}
                                                                />
                                                                <div className={`w-10 h-6 rounded-full transition-colors ${activeLayers[file] ? 'bg-[#3388ff]' : 'bg-white/10 dark:bg-black/10'}`}></div>
                                                                <div className={`absolute w-4 h-4 bg-white dark:bg-[#0b0b0b] rounded-full left-1 top-1 transition-transform ${activeLayers[file] ? 'translate-x-4' : ''}`}></div>
                                                            </div>
                                                            <span className="text-sm font-medium truncate" title={file}>
                                                                {file.replace('.geojson', '').replace(/_/g, ' ')}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </nav>

                    {/* Bottom Area */}
                    <div className={`mt-auto relative z-10 border-t border-white/10 dark:border-black/10 flex ${isCollapsed ? "flex-col gap-4 pt-4 items-center" : "flex-col gap-4 pt-4"}`}>

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
                                <ModeToggle />
                            </>
                        ) : (
                            <div className="flex items-center justify-between w-full mt-2">
                                <button
                                    onClick={toggleLanguage}
                                    className="group cursor-pointer flex items-center justify-center transition-all overflow-hidden p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                                    title={language === 'cs' ? 'Přepnout jazyk' : 'Switch Language'}
                                >
                                    <Globe size={18} />
                                    <span className="text-xs font-bold uppercase max-w-0 opacity-0 group-hover:max-w-[20px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 overflow-hidden">{language}</span>
                                </button>

                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="cursor-pointer flex items-center justify-center transition-colors duration-300 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                                    title={language === 'cs' ? 'Nastavení' : 'Settings'}
                                >
                                    <Settings2 size={18} />
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
                />
                <AiSettingsPanel
                    isOpen={isAiSettingsOpen}
                    onClose={() => setIsAiSettingsOpen(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                />
                <QuestionnairePanel
                    isOpen={isQuestionnaireOpen}
                    onClose={() => setIsQuestionnaireOpen(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    onEvaluated={handleQuestionnaireEvaluated}
                    onLoginClick={openAuthPanel}
                />
                <AuthPanel
                    isOpen={isAuthOpen}
                    onClose={() => setIsAuthOpen(false)}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
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
                    heatmapCategories={HEATMAP_CATEGORIES}
                    activeHeatmaps={activeHeatmaps}
                    toggleHeatmap={toggleHeatmap}
                    resetSettings={resetSettings}
                />
            </div>

            <main className="flex-1 h-full relative">
                <Map
                    center={[15.4730, 49.8175]}
                    zoom={6.5}
                    styles={mapStyleProp as any}
                >
                    <MapControls position="bottom-right" showZoom showCompass />
                    <LegacyLayers
                        activeLayers={activeLayers}
                        colorBlindMode={colorBlindMode}
                        layerOpacity={layerOpacity}
                        showFills={showFills}
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
                    {questionnaireResultData && (
                        <MapFillLayer
                            id="questionnaire-result"
                            data={questionnaireResultData}
                            colorProp="matchPercent"
                            colorScale={HEATMAP_COLOR_SCALE}
                            defaultColor="rgba(139,0,0,0.8)"
                            opacity={layerOpacity}
                        />
                    )}
                </Map>
            </main>
        </div>
    );
}
