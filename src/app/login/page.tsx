"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Logo } from "@/components/logo";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const { language } = useLanguage();

    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "", name: "" });
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
            router.push("/app"); // Přesměrování do aplikace
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = () => {
        setIsRegistering(!isRegistering);
        setError("");
        setFormData({ email: "", password: "", name: "" });
    };

    return (
        <div className="min-h-screen w-full bg-[#f3f3f3] dark:bg-[#0b0b0b] font-sans text-black dark:text-white relative transition-colors duration-300 flex items-center justify-center overflow-hidden">

            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#3388ff]/30 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#3388ff]/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

            {/* Header controls (Back, Dark mode, Language) */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
                <Link
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-black transition-colors backdrop-blur-md"
                >
                    <ArrowLeft size={16} />
                    <span className="text-sm font-medium">{language === 'cs' ? 'Zpět' : 'Back'}</span>
                </Link>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 backdrop-blur-md">
                        <Logo className="h-5 w-5" />
                        <span className="text-sm font-bold">ZIJE!SE</span>
                    </div>
                    <ModeToggle />
                </div>
            </div>

            {/* Main card */}
            <div className="w-full max-w-md mx-4 relative z-10">
                <div className="bg-white/80 dark:bg-[#151515]/80 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-3xl p-8 shadow-2xl">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black uppercase tracking-wider text-black dark:text-white mb-2">
                            {isRegistering
                                ? (language === 'cs' ? 'Vytvořit účet' : 'Create Account')
                                : (language === 'cs' ? 'Přihlášení' : 'Welcome Back')}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isRegistering
                                ? (language === 'cs' ? 'Zaregistrujte se pro ukládání postupu a získání kreditů' : 'Register to save your progress and earn credits')
                                : (language === 'cs' ? 'Zadejte své údaje pro návrat do aplikace' : 'Enter your details to sign in to the app')}
                        </p>
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
                                    className="w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-[#0b0b0b] border border-black/5 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3388ff]/50 transition-all text-sm"
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
                                className="w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-[#0b0b0b] border border-black/5 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3388ff]/50 transition-all text-sm"
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
                                className="w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-[#0b0b0b] border border-black/5 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3388ff]/50 transition-all text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="mt-4 w-full py-3 px-4 bg-[#3388ff] hover:bg-[#2563eb] text-white rounded-xl font-medium text-sm transition-all transform-gpu active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 border border-white/10 shadow-lg shadow-[#3388ff]/20"
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

                    <div className="mt-8 text-center border-t border-black/5 dark:border-white/5 pt-6">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isRegistering
                                ? (language === 'cs' ? 'Už máte účet? ' : 'Already have an account? ')
                                : (language === 'cs' ? 'Ještě nemáte účet? ' : 'Dont have an account? ')}
                            <button
                                onClick={handleToggle}
                                className="text-[#3388ff] font-semibold hover:underline bg-transparent border-none cursor-pointer"
                            >
                                {isRegistering
                                    ? (language === 'cs' ? 'Přihlaste se' : 'Sign In')
                                    : (language === 'cs' ? 'Zaregistrujte se' : 'Sign Up')}
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
