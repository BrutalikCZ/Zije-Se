import React from 'react';
import { ArrowLeft, PanelLeftClose, PanelLeft, User, Globe, Coins, LogOut } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { Logo } from '@/components/logo';
import { ModeToggle } from '@/components/mode-toggle';

interface SidebarLayoutProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    /** z-index for stacking order among sidebar panels */
    zIndex?: number;
    /** Icon element shown in the collapsed state's main action button */
    collapsedIcon?: React.ReactNode;
    /** Title for the collapsed icon button */
    collapsedIconTitle?: string;
    /** Extra action buttons rendered in the bottom controls row (e.g. settings button) */
    extraBottomControls?: React.ReactNode;
    /** Text for the back button. Defaults to 'Zpět k filtrům' / 'Back to Filters' */
    backText?: { cs: string; en: string };
    /** Main content rendered in the middle area (only shown when expanded) */
    children: React.ReactNode;
}

export function SidebarLayout({
    isOpen,
    onClose,
    isCollapsed,
    setIsCollapsed,
    zIndex = 10,
    collapsedIcon,
    collapsedIconTitle,
    extraBottomControls,
    backText,
    children,
}: SidebarLayoutProps) {
    const { language, toggleLanguage } = useLanguage();
    const { user, logout } = useAuth();

    const backLabel = backText
        ? (language === 'cs' ? backText.cs : backText.en)
        : (language === 'cs' ? 'Zpět k filtrům' : 'Back to Filters');

    return (
        <aside
            className={`absolute top-0 left-0 w-full h-full border-r border-black/5 dark:border-white/5 bg-[#0b0b0b] text-white dark:bg-[#f3f3f3] dark:text-black flex flex-col p-4 md:p-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-full opacity-0 pointer-events-none"
                } ${isCollapsed ? "items-center justify-between" : ""}`}
            style={{ zIndex }}
        >
            {/* Background Glows */}
            {!isCollapsed && isOpen && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-r-3xl transition-opacity duration-300">
                    <div className="absolute top-12 right-40 -translate-y-1/2 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-36 -right-12 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl pointer-events-none"></div>
                </div>
            )}

            {/* Top Section: Collapse Toggle & Logo */}
            {isCollapsed ? (
                <div className="flex flex-col gap-6 w-full items-center mt-2 relative z-10 shrink-0">
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
                <div className="flex items-center justify-between mt-2 relative z-10 shrink-0">
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

            {/* Middle Section: Panel-specific Content */}
            {!isCollapsed ? (
                <>{children}</>
            ) : (
                <div className="flex flex-col items-center flex-1 mt-2 z-10 gap-4">
                    {collapsedIcon && (
                        <button
                            onClick={() => setIsCollapsed(false)}
                            className="h-12 w-12 flex items-center justify-center rounded-full bg-[#3388ff] text-white hover:bg-[#2563eb] cursor-pointer shadow-lg transition-transform hover:scale-105 active:scale-95"
                            title={collapsedIconTitle}
                        >
                            {collapsedIcon}
                        </button>
                    )}
                </div>
            )}

            {/* Bottom Area */}
            <div className={`mt-auto relative z-10 border-t border-white/10 dark:border-black/10 flex shrink-0 ${isCollapsed ? "flex-col gap-4 pt-4 items-center" : "flex-col gap-4 pt-4"}`}>

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

                {/* Language & Theme & Extra Controls */}
                {isCollapsed ? (
                    <>
                        <button
                            onClick={toggleLanguage}
                            className="cursor-pointer flex items-center justify-center transition-colors mb-2 p-2 text-white dark:text-black opacity-60 hover:opacity-100"
                            title={language === 'cs' ? 'Přepnout jazyk' : 'Switch Language'}
                        >
                            <Globe size={20} />
                        </button>
                        {extraBottomControls}
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

                        {extraBottomControls}

                        <ModeToggle />
                    </div>
                )}

                {/* Back Button */}
                {!isCollapsed && (
                    <div
                        className="text-[12px] mt-2 font-medium opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 group w-full cursor-pointer"
                        onClick={onClose}
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        {backLabel}
                    </div>
                )}

                {isCollapsed && (
                    <div
                        className="text-[12px] mt-2 font-medium opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 group w-full cursor-pointer"
                        onClick={onClose}
                        title={backLabel}
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    </div>
                )}
            </div>
        </aside>
    );
}
