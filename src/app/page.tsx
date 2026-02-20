"use client";

import { Globe } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export default function Home() {
  const { language, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#f3f3f3] dark:bg-[#0b0b0b] font-sans text-black dark:text-white relative transition-colors duration-300">
      {/* Top Bar - CTA */}
      <div className="relative w-full h-10 bg-[#0b0b0b] text-white dark:bg-[#f3f3f3] dark:text-black transition-colors duration-300 flex items-center justify-center text-xs md:text-sm font-medium z-50 px-4 overflow-hidden text-center">
        {/* Background Glows for Top Bar */}
        <div className="absolute top-12 left-60 -translate-y-1/2 w-24 h-24 bg-[#3388ff]/80 rounded-full blur-2xl dark:opacity-50"></div>
        <div className="absolute top-0 right-120 -translate-y-1/2 w-24 h-24 bg-[#3388ff]/80 rounded-full blur-2xl dark:opacity-50"></div>

        <p className="relative z-10">
          <span className="opacity-80">{language === 'cs' ? 'Chcete najít lepší bydlení? ' : 'Want to find a better home? '}</span>
          <Link href="/login" className="font-bold text-[#3388ff] ml-1 cursor-pointer hover:underline">{language === 'cs' ? 'Přihlaste se' : 'Log in'}</Link>
          <span className="opacity-80 ml-1">{language === 'cs' ? ' a využijte naši AI pro nalezení ideálního místa!' : ' and use our AI to find the perfect place!'}</span>
        </p>
      </div>

      {/* Floating Navbar */}
      <nav className="sticky top-4 mx-auto w-[95%] md:w-[100%] max-w-7xl bg-[#0b0b0b] text-white dark:bg-[#f3f3f3] dark:text-black dark:border-black/5 rounded-2xl px-6 md:px-10 py-4 flex items-center justify-between z-40 overflow-hidden border border-white/5 transition-colors duration-300 mt-4">
        {/* Background Glows */}
        <div className="absolute top-12 left-20 -translate-y-1/2 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -top-36 -right-12 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl -z-10"></div>

        {/* Kdyby se chtělo vrátit staré logo/vymaž logo.tsx
        <div className="text-xl font-bold tracking-tight relative z-10">
          ZIJE!SE
        </div>
      */}

        {/* Left: Logo */}
        <div className="flex items-center gap-4 text-xl font-bold tracking-tight relative z-10">
          <Logo className="h-8 w-8" />
          <span>ZIJE!SE</span>
        </div>

        {/* Center: Sections */}
        {/* Center: Sections */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-200 dark:text-gray-800 relative z-10">
          <a href="#" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'Domů' : 'Home'}</a>
          <a href="#" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'Funkce' : 'Features'}</a>
          <a href="#" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'Ceník' : 'Pricing'}</a>
          <a href="#" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'O nás' : 'About'}</a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 relative z-10">
          {/* Globe Icon */}
          <button
            onClick={toggleLanguage}
            className="cursor-pointer flex items-center justify-center transition-colors p-2 text-white dark:text-black opacity-60 hover:opacity-100"
            title={language === 'cs' ? 'Přepnout jazyk' : 'Switch Language'}
          >
            <Globe size={18} />
          </button>

          {/* Mode Toggle */}
          <div className="pr-2 border-r border-gray-600 dark:border-gray-300">
            <ModeToggle />
          </div>

          {/* Login Button / User Profile */}
          {user ? (
            <div
              onClick={logout}
              title={language === 'cs' ? 'Odhlásit se' : 'Logout'}
              className="cursor-pointer hidden sm:flex items-center justify-center h-[38px] w-[38px] rounded-full bg-[#3388ff] text-sm font-bold text-white transition-all transform-gpu duration-300 ease-in-out border border-white/10 dark:border-black/10 hover:opacity-80"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Link href="/login" className="cursor-pointer hidden sm:flex items-center justify-center px-5 py-2 rounded-full bg-[#ececeb] text-sm font-medium text-black hover:bg-white dark:bg-[#0b0b0b] dark:text-white dark:hover:bg-black/90 transition-all transform-gpu duration-300 ease-in-out active:translate-y-px border border-white/10 dark:border-black/10">
              {language === 'cs' ? 'Přihlásit se' : 'Login'}
            </Link>
          )}

          {/* Launch App Button */}
          <Link
            href="/app"
            className="px-5 py-2 rounded-full bg-[#3388ff] hover:bg-[#2563eb] text-sm font-medium text-white transition-all transform-gpu duration-300 ease-in-out active:translate-y-px border border-white/10 dark:border-black/10"
          >
            {language === 'cs' ? 'Spustit aplikaci' : 'Launch App'}
          </Link>
        </div>
      </nav>

      {/* Hero Section with Scroll Animation */}
      <div className="flex flex-col overflow-hidden">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center text-center z-10 relative mb-10 md:mb-30 mt-20">
              <h1 className="text-[40px] md:text-[60px] lg:text-[90px] font-black text-[#0b0b0b] dark:text-white leading-[1.1] tracking-wide uppercase max-w-4xl">
                {language === 'cs' ? 'NAJDĚTE SI BYDLENÍ ' : 'FIND YOUR PERFECT '}
                <span className="relative inline-block whitespace-nowrap">
                  {language === 'cs' ? 'NA MÍRU' : 'HOME'}
                  <svg
                    className="absolute w-[110%] h-[0.2em] -bottom-[0.2em] -left-[5%] text-[#3388ff]"
                    viewBox="0 0 200 9"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.00025 6.99997C25.0003 3.99999 92.5003 -1.00003 198.001 5.99999"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p className="mt-8 text-[10px] md:text-[14px] font-thin text-black dark:text-gray-300 max-w-base leading-relaxed mx-auto">
                {language === 'cs' ? 'Procházejte interaktivní mapu, vyplňte dotazník nebo chatujte s AI vytvořenou na míru Vašim potřebám.' : 'Browse the interactive map, fill out a questionnaire, or chat with our custom AI tailored to your needs.'}
              </p>
            </div>
          }
        >
          <Link href="/app" className="block w-full h-full relative cursor-pointer group">
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-20" />
            <img
              src="https://d39-a.sdn.cz/d_39/c_img_E_M/rzCCaj.png?fl=cro,0,4,2862,1610%7Cres,1200,,1"
              alt="App Preview"
              className="w-full h-full object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-500"
            />
          </Link>
        </ContainerScroll>
      </div>
    </div>
  );
}
