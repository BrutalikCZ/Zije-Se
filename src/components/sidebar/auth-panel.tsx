import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { SidebarLayout } from "./sidebar-layout";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";

interface AuthPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    showCloseIcon?: boolean;
    hideCollapseButton?: boolean;
    hideBackButton?: boolean;
}

export function AuthPanel({
    isOpen,
    onClose,
    isCollapsed,
    setIsCollapsed,
    showCloseIcon = false,
    hideCollapseButton = false,
    hideBackButton = false
}: AuthPanelProps) {
    const router = useRouter();
    const { login } = useAuth();
    const { language } = useLanguage();

    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "", name: "", acceptTerms: false });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const resp = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: isRegistering ? "register" : "login",
                    ...formData,
                }),
            });

            const data = await resp.json();

            if (!resp.ok) {
                throw new Error(data.error || "Něco se pokazilo");
            }

            // Provede přihlášení
            login(data.user);

            // Check if we are on the landing page or the app
            if (window.location.pathname === "/") {
                router.push("/app"); // Přesměrování do aplikace ze strany domů
            } else {
                onClose(); // Jen zavřeme sidebar, už jsme v appce
                setFormData({ email: "", password: "", name: "", acceptTerms: false }); // vyčistíme
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = () => {
        setIsRegistering(!isRegistering);
        setError("");
        setFormData({ email: "", password: "", name: "", acceptTerms: false });
    };

    return (
        <SidebarLayout
            isOpen={isOpen}
            onClose={onClose}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            zIndex={50} // Higher z-index to overlay other things optionally
            collapsedIcon={<UserIcon size={24} />}
            collapsedIconTitle={language === 'cs' ? 'Přihlášení' : 'Login'}
            showAuthSection={false}
            hideCollapseButton={hideCollapseButton}
            showCloseIcon={showCloseIcon}
            hideBackButton={hideBackButton}
        >
            <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2 relative z-10 w-full">
                <div className="text-center shrink-0 mb-6 mt-4">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white dark:text-black mb-2">
                        {isRegistering
                            ? (language === 'cs' ? 'Vytvořit účet' : 'Create Account')
                            : (language === 'cs' ? 'Přihlášení' : 'Welcome Back')}
                    </h1>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 px-2">
                        {isRegistering
                            ? (language === 'cs' ? 'Zaregistrujte se pro ukládání postupu a nastavení' : 'Register to save your progress and settings')
                            : (language === 'cs' ? 'Zadejte své údaje pro návrat do aplikace' : 'Enter your details to sign in to the app')}
                    </p>
                    <div className="h-px w-full bg-white/10 dark:bg-black/10"></div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    {isRegistering && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <UserIcon size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required={isRegistering}
                                placeholder={language === 'cs' ? 'Jméno' : 'Name'}
                                className="w-full pl-11 pr-4 py-3 bg-[#1a1a1a] dark:bg-white text-white dark:text-black border border-white/10 dark:border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3388ff]/50 transition-all text-sm placeholder:text-gray-500"
                            />
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder={language === 'cs' ? 'E-mailová adresa' : 'Email Address'}
                            className="w-full pl-11 pr-4 py-3 bg-[#1a1a1a] dark:bg-white text-white dark:text-black border border-white/10 dark:border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3388ff]/50 transition-all text-sm placeholder:text-gray-500"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            placeholder={language === 'cs' ? 'Heslo' : 'Password'}
                            className="w-full pl-11 pr-4 py-3 bg-[#1a1a1a] dark:bg-white text-white dark:text-black border border-white/10 dark:border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3388ff]/50 transition-all text-sm placeholder:text-gray-500"
                        />
                    </div>

                    {isRegistering && (
                        <label className="flex items-start gap-3 mt-1 cursor-pointer group">
                            <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                                <input
                                    type="checkbox"
                                    required={isRegistering}
                                    className="peer sr-only"
                                    checked={formData.acceptTerms}
                                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                                />
                                <div className="w-5 h-5 rounded border border-white/20 dark:border-black/20 bg-[#1a1a1a] dark:bg-white peer-checked:bg-[#3388ff] peer-checked:border-[#3388ff] transition-colors flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-xs text-left text-gray-400 dark:text-gray-500 leading-tight">
                                {language === 'cs' ? (
                                    <>Souhlasím s <span className="text-[#3388ff] hover:underline">podmínkami použití</span> a se <span className="text-[#3388ff] hover:underline">zpracováním osobních údajů</span>.</>
                                ) : (
                                    <>I agree to the <span className="text-[#3388ff] hover:underline">Terms of Service</span> and <span className="text-[#3388ff] hover:underline">Privacy Policy</span>.</>
                                )}
                            </span>
                        </label>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-4 w-full py-3 px-4 bg-[#3388ff] hover:bg-[#2563eb] text-white rounded-xl font-medium text-sm transition-all transform-gpu active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-[#3388ff]/20"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            isRegistering
                                ? (language === 'cs' ? 'Vytvořit účet' : 'Sign Up')
                                : (language === 'cs' ? 'Přihlásit se' : 'Sign In')
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-white/10 dark:border-black/10 pt-6">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        {isRegistering
                            ? (language === 'cs' ? 'Už máte účet? ' : 'Already have an account? ')
                            : (language === 'cs' ? 'Ještě nemáte účet? ' : 'Dont have an account? ')}
                        <button
                            onClick={handleToggle}
                            className="text-[#3388ff] font-semibold hover:underline bg-transparent border-none cursor-pointer p-0 ml-1"
                        >
                            {isRegistering
                                ? (language === 'cs' ? 'Přihlaste se' : 'Sign In')
                                : (language === 'cs' ? 'Zaregistrujte se' : 'Sign Up')}
                        </button>
                    </p>
                </div>
            </div>
        </SidebarLayout>
    );
}
