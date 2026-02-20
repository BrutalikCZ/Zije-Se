"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BotMessageSquare, ListChecks, PanelLeftClose, PanelLeft, User, Globe, ChevronDown, Layers, Settings2, RotateCcw, X, AlertTriangle, Stethoscope, Bus, Landmark, Dumbbell, GraduationCap, TreePine, Map as MapIcon, Factory, Coins, LogOut } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Map, MapControls } from "@/components/map/map";
import { LegacyLayers } from "@/components/map/legacy-layers";
import { QuestionnairePanel, SettingsPanel, AIChatPanel, AiSettingsPanel } from "@/components/sidebar";
import { useAuth } from "@/components/providers/auth-provider";

export default function AppPage() {
    const { user, logout } = useAuth();
    const { language, toggleLanguage } = useLanguage();
    const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);

    // Map Settings State
    const [mapType, setMapType] = useState('default');
    const [colorBlindMode, setColorBlindMode] = useState(false);
    const [showFills, setShowFills] = useState(true);
    const [layerOpacity, setLayerOpacity] = useState(0.8);
    const [mapOpacity, setMapOpacity] = useState(1.0);

    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({});
    const [files, setFiles] = useState<string[]>([]);

    const resetSettings = () => {
        setMapType('default');
        setColorBlindMode(false);
        setShowFills(true);
        setLayerOpacity(0.8);
        setMapOpacity(1.0);
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
        return undefined; // Let maplibre component use default dark/light Carto
    }, [mapType]);

    return (
        <div className="h-screen w-full flex overflow-hidden bg-[#f3f3f3] dark:bg-[#0b0b0b] font-sans text-black dark:text-white transition-colors duration-300">
            <style>{`.maplibregl-canvas { opacity: ${mapOpacity} !important; transition: opacity 0.2s; }`}</style>

            {/* Sidebars Wrapper */}
            <div className={`relative h-full shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-80"}`}>
                {/* Original Sidebar */}
                <aside
                    className={`absolute top-0 left-0 w-full h-full border-r border-black/5 dark:border-white/5 bg-[#0b0b0b] text-white dark:bg-[#f3f3f3] dark:text-black flex flex-col p-4 md:p-6 z-10 overflow-hidden transition-all duration-300 ease-in-out ${(isChatOpen || isQuestionnaireOpen || isSettingsOpen || isAiSettingsOpen) ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100 pointer-events-auto"
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

                        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
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
                                        <div className="flex flex-col flex-1 items-start overflow-hidden leading-tight">
                                            <span className="font-bold truncate w-full text-left">{user.name}</span>
                                            <div className="flex items-center gap-1 text-[10px] text-[#3388ff] font-medium">
                                                <Coins size={10} />
                                                <span>{user.credits} {language === 'cs' ? 'kreditů' : 'credits'}</span>
                                            </div>
                                        </div>
                                        <div className="pr-1 text-[#3388ff]/80 hover:text-[#3388ff] transition-colors">
                                            <LogOut size={16} />
                                        </div>
                                    </>
                                )}
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className={`outline-none focus:outline-none focus:ring-0 cursor-pointer flex items-center justify-center rounded-full transition-all transform-gpu duration-300 ease-in-out active:translate-y-px ${isCollapsed
                                    ? "h-12 w-12 mx-auto bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 backdrop-blur-md"
                                    : "gap-3 px-5 py-3 w-full bg-[#1a1a1a] dark:bg-[#ececeb] text-sm font-medium text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc] border border-white/10 dark:border-black/10 backdrop-blur-md"
                                    }`}
                                title={language === 'cs' ? 'Profil / Přihlásit se' : 'Profile / Login'}
                            >
                                <User size={20} />
                                {!isCollapsed && <span className="flex-1 text-left">{language === 'cs' ? 'Přihlásit se' : 'Login'}</span>}
                            </Link>
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
                </Map>
            </main>
        </div>
    );
}
