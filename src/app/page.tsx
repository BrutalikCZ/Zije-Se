"use client";

import { useState, useEffect } from "react";
import { Globe, Map, ListChecks, Bot, Zap, Star, ArrowRight, CheckCircle2, HeartHandshake, MessageSquareQuote, Database, ClipboardList, MapPin, X } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { AuthPanel, LegalPanel, LegalPanelType } from "@/components/sidebar";
import ScrollLink from "@/components/ui/scroll-link";
import {
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  ScaleIn,
  StaggerChildren,
  StaggerItem,
  ParallaxSection,
  DrawSVG,
} from "@/components/ui/scroll-animations";

export default function Home() {
  const { language, toggleLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeLegalPanel, setActiveLegalPanel] = useState<LegalPanelType | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#f3f3f3] dark:bg-[#0b0b0b] font-sans text-black dark:text-white relative transition-colors duration-300 z-0">
      {/* Top Bar - CTA */}
      <div className="relative w-full min-h-[40px] py-2 bg-[#0b0b0b] text-white dark:bg-[#f3f3f3] dark:text-black transition-colors duration-300 flex items-center justify-center text-xs sm:text-sm font-medium z-50 px-4 overflow-hidden text-center">
        {/* Background Glows for Top Bar */}
        <div className="absolute top-1/2 left-10 sm:left-60 -translate-y-1/2 w-24 h-24 bg-[#3388ff]/80 rounded-full blur-2xl"></div>
        <div className="absolute top-0 right-10 sm:right-120 -translate-y-1/2 w-24 h-24 bg-[#3388ff]/80 rounded-full blur-2xl"></div>

        <p className="relative z-10 leading-snug">
          <span className="opacity-80">{language === 'cs' ? 'Hledáte ideální místo k životu? ' : 'Looking for the ideal place to live? '}</span>
          <button onClick={() => setIsAuthOpen(true)} className="font-bold text-[#3388ff] mx-1 cursor-pointer hover:underline inline-block bg-transparent border-none p-0">{language === 'cs' ? 'Přihlaste se' : 'Log in'}</button>
          <span className="opacity-80">{language === 'cs' ? ' a nechte AI najít to pravé pro vás!' : ' and let AI find the right place!'}</span>
        </p>
      </div>

      {/* Floating Navbar */}
      <nav
        className={`sticky top-2 sm:top-4 mx-auto w-[95%] sm:w-[95%] md:w-[100%] max-w-7xl bg-[#0b0b0b] text-white dark:bg-[#f3f3f3] dark:text-black dark:border-black/5 rounded-2xl px-4 sm:px-6 md:px-10 py-3 sm:py-4 flex items-center justify-between z-40 overflow-hidden border border-black/5 dark:border-white/5 mt-2 sm:mt-4 transition-all duration-500 ${scrolled ? 'bg-[#0b0b0b]/90 dark:bg-[#f3f3f3]/90 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-white/5' : ''}`}
      >
        {/* Background Glows */}
        <div className="absolute top-12 left-20 -translate-y-1/2 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -top-36 -right-12 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-3xl -z-10"></div>

        {/* Left: Logo */}
        <div className="flex items-center gap-4 text-xl font-bold tracking-tight relative z-10">
          <Logo className="h-8 w-8" />
          <span>ZIJE!SE</span>
        </div>

        {/* Center: Sections */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-400 dark:text-gray-600 relative z-10">
          <ScrollLink href="#home" targetId="home" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'Domů' : 'Home'}</ScrollLink>
          <ScrollLink href="#features" targetId="features" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'Funkce' : 'Features'}</ScrollLink>
          <ScrollLink href="#about" targetId="about" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'O nás' : 'About'}</ScrollLink>
          <ScrollLink href="#how-it-works" targetId="how-it-works" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'Jak to funguje' : 'How it works'}</ScrollLink>
          <ScrollLink href="#negotiation" targetId="negotiation" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'Analýza' : 'Analysis'}</ScrollLink>
          <ScrollLink href="#pricing" targetId="pricing" className="hover:text-white dark:hover:text-black transition-colors">{language === 'cs' ? 'Ceník' : 'Pricing'}</ScrollLink>
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
              className="cursor-pointer hidden sm:flex items-center justify-center h-[38px] w-[38px] rounded-full bg-[#3388ff] text-sm font-bold text-white transition-all transform-gpu duration-300 ease-in-out border border-black/5 dark:border-white/5 hover:opacity-80"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="cursor-pointer hidden sm:flex items-center justify-center px-5 py-2 rounded-full bg-[#ececeb] text-sm font-medium text-black hover:bg-white dark:bg-[#0b0b0b] dark:text-white dark:hover:bg-black/90 transition-all transform-gpu duration-300 ease-in-out active:translate-y-px border border-black/5 dark:border-white/5">
              {language === 'cs' ? 'Přihlásit se' : 'Login'}
            </button>
          )}

          {/* Launch App Button */}
          <Link
            href="/app"
            className="px-4 sm:px-5 py-2 rounded-full bg-[#3388ff] hover:bg-[#2563eb] text-xs sm:text-sm font-medium text-white transition-all transform-gpu duration-300 ease-in-out active:translate-y-px border border-black/5 dark:border-white/5"
          >
            <span className="sm:hidden">{language === 'cs' ? 'Spustit' : 'Launch'}</span>
            <span className="hidden sm:inline">{language === 'cs' ? 'Spustit aplikaci' : 'Launch App'}</span>
          </Link>
        </div>
      </nav>

      {/* Main Content Container wrapper to match navbar framing */}
      <main className="mx-auto w-[95%] md:w-[100%] max-w-7xl flex flex-col px-4 md:px-6">

        {/* Hero Section */}
        <div id="home" className="flex flex-col overflow-hidden pt-10 mt-[-40px]">
          <FadeInUp className="flex flex-col items-center justify-center text-center z-10 relative mt-20" duration={0.9}>
            <h1 className="text-[32px] sm:text-[40px] md:text-[60px] lg:text-[80px] xl:text-[90px] font-black text-[#0b0b0b] dark:text-white leading-[1.1] tracking-wide uppercase max-w-4xl">
              {language === 'cs' ? 'NAJDĚTE SI BYDLENÍ ' : 'FIND YOUR PERFECT '}
              <span className="relative inline-block whitespace-nowrap">
                {language === 'cs' ? 'NA MÍRU' : 'HOME'}
                <DrawSVG
                  className="absolute w-[110%] h-[0.2em] -bottom-[0.2em] -left-[5%] text-[#3388ff]"
                  delay={0.5}
                  duration={1.2}
                >
                  <path
                    d="M2.00025 6.99997C25.0003 3.99999 92.5003 -1.00003 198.001 5.99999"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </DrawSVG>
              </span>
            </h1>
            <p className="mt-8 text-sm font-thin text-black dark:text-gray-300 max-w-base leading-relaxed mx-auto">
              {language === 'cs' ? 'Prozkoumejte data, vyplňte dotazník a nechte AI najít ideální místo k životu. Vše přehledně na mapě i v chatu.' : 'Explore data, fill out a questionnaire and let AI find the ideal place to live. Everything clearly on a map and in chat.'}
            </p>
          </FadeInUp>

          <ParallaxSection speed={-0.1} className="w-full max-w-5xl mx-auto pb-10 md:pb-12 flex justify-center relative mt-6 sm:mt-10 md:mt-12 perspective-[2000px] px-4 md:px-0">
            <ScaleIn delay={0.3} duration={0.9}>
              <Link href="/app" className="relative cursor-pointer group z-10 flex justify-center block" style={{ perspective: "2000px" }}>
                <div
                  className="transition-all duration-700 ease-out origin-center scale-[0.85] md:scale-100 rounded-[3rem] group-hover:-translate-y-4 relative"
                  style={{ transform: "rotateY(-15deg) rotateX(15deg) rotateZ(5deg) translateZ(0)", transformStyle: "preserve-3d" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "rotateY(-5deg) rotateX(5deg) rotateZ(2deg) translateZ(20px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "rotateY(-15deg) rotateX(15deg) rotateZ(5deg) translateZ(0)";
                  }}
                >
                  <PhoneMockup>
                    {/* Light mode mockup */}
                    <img
                      src="/light_mockup.png"
                      alt="App Preview Light"
                      className="w-full h-full object-cover transition-transform duration-700 block dark:hidden"
                    />
                    {/* Dark mode mockup */}
                    <img
                      src="/dark_mockup.png"
                      alt="App Preview Dark"
                      className="w-full h-full object-cover transition-transform duration-700 hidden dark:block"
                    />
                    {/* Subtle glass reflection overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none rounded-[2.25rem]"></div>

                    {/* Bottom home indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-[4px] bg-black/40 dark:bg-white/40 rounded-full"></div>
                  </PhoneMockup>
                </div>
              </Link>
            </ScaleIn>
          </ParallaxSection>
        </div>

        {/* 1. FEATURES SECTION */}
        <section id="features" className="relative py-10 md:py-12 w-full z-10">
          <FadeInUp className="text-center mb-16 relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-wide mb-6 text-[#0b0b0b] dark:text-white">
              {language === 'cs' ? 'Data, AI a mapa v jednom' : 'Data, AI & Map in one'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {language === 'cs' ? 'Procházejte datasety, nechte AI analyzovat vaše potřeby a najděte ideální místo k životu pomocí interaktivní heatmapy.' : 'Browse datasets, let AI analyze your needs and find the ideal place to live using an interactive heatmap.'}
            </p>
          </FadeInUp>

          <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10" staggerDelay={0.2}>
            {[
              {
                icon: <Database className="w-8 h-8" strokeWidth={1.5} />,
                title: language === 'cs' ? 'Otevřené datasety' : 'Open Datasets',
                desc: language === 'cs' ? 'Prozkoumejte desítky datasetů o kvalitě života, občanské vybavenosti, dopravě či cenách nemovitostí v celé ČR.' : 'Explore dozens of datasets on quality of life, amenities, transport, or property prices across the Czech Republic.',
                glowPos: 'top-0 right-0'
              },
              {
                icon: <ClipboardList className="w-8 h-8" strokeWidth={1.5} />,
                title: language === 'cs' ? 'Chytrý dotazník' : 'Smart Questionnaire',
                desc: language === 'cs' ? 'Vyplňte krátký dotazník a AI vám doporučí datasety a lokality přesně podle vašich potřeb a preferencí.' : 'Fill out a short questionnaire and AI will recommend datasets and locations tailored to your needs and preferences.',
                glowPos: 'bottom-0 left-0'
              },
              {
                icon: <Bot className="w-8 h-8" strokeWidth={1.5} />,
                title: language === 'cs' ? 'AI chat asistent' : 'AI Chat Assistant',
                desc: language === 'cs' ? 'Ptejte se AI na cokoliv — kde je nejbližší školka, jaké jsou ceny v okolí, kontakty na úřady nebo tipy na sousedství.' : 'Ask AI anything — where is the nearest kindergarten, local prices, office contacts, or neighborhood tips.',
                glowPos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              }
            ].map((feature, i) => (
              <StaggerItem key={i} className="relative group">
                <div className="bg-[#0b0b0b] dark:bg-[#f3f3f3] border border-black/5 dark:border-white/5 rounded-2xl md:rounded-3xl p-6 md:p-8 hover:-translate-y-1 md:hover:-translate-y-2 transition-transform duration-300 relative h-full flex flex-col z-10 overflow-hidden">
                  <div className={`absolute ${feature.glowPos} w-32 h-32 bg-[#3388ff]/40 rounded-full blur-[40px] pointer-events-none z-0`}></div>
                  <div className="relative z-10 w-16 h-16 rounded-full bg-white dark:bg-[#0b0b0b] text-[#0b0b0b] dark:text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-black/5 dark:border-white/5">
                    {feature.icon}
                  </div>
                  <h3 className="relative z-10 text-xl font-bold mb-4 text-white dark:text-[#0b0b0b]">{feature.title}</h3>
                  <p className="relative z-10 text-sm text-gray-400 dark:text-gray-600 leading-relaxed font-light flex-grow">
                    {feature.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </section>

        {/* 2. ABOUT & REVIEWS SECTION */}
        <section id="about" className="relative py-10 md:py-12 w-full overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-2 md:gap-10 lg:gap-20 items-center">

            {/* Left Text content */}
            <FadeInLeft className="flex-1 w-full text-center lg:text-left z-10">
              <h2 className="text-4xl font-black uppercase tracking-wide mb-6 text-[#0b0b0b] dark:text-white leading-[1.1]">
                {language === 'cs' ? 'Váš průvodce bydlením v Česku.' : 'Your housing guide in Czechia.'}
              </h2>
              <div className="w-full h-px bg-black/10 dark:bg-white/10 mb-8 mx-auto lg:mx-0"></div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light mb-10 max-w-xl mx-auto lg:mx-0">
                {language === 'cs' ?
                  'Hledání bydlení by nemělo být stresující. Spojili jsme otevřená data, umělou inteligenci a přehledné vizualizace do jednoho nástroje, který vám pomůže rozhodnout se, kde žít. Ať už hledáte blízkost škol, dopravní dostupnost nebo klidné sousedství — máme data i odpovědi.' :
                  'Finding a home shouldn\'t be stressful. We combined open data, artificial intelligence, and clear visualizations into a single tool that helps you decide where to live. Whether you\'re looking for proximity to schools, transport access, or a quiet neighborhood — we have the data and the answers.'}
              </p>
            </FadeInLeft>

            {/* Right Redesigned Testimonial Banner */}
            <FadeInRight className="flex-1 w-full relative z-10 perspective-[1500px] mt-4 lg:mt-0" delay={0.2}>
              <div className="bg-[#0b0b0b] dark:bg-[#f3f3f3] border border-black/5 dark:border-white/5 p-6 sm:p-10 md:p-14 rounded-[2rem] md:rounded-[3rem] relative transform lg:rotateY(-5deg) lg:rotateX(5deg) scale-100 lg:scale-[0.95] hover:rotateY(0) hover:rotateX(0) hover:scale-100 transition-all duration-700 ease-out overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-[50px] pointer-events-none z-0"></div>

                <MessageSquareQuote className="hidden md:block w-16 h-16 text-[#3388ff] mb-8 absolute top-8 right-8 z-10" strokeWidth={1.5} />

                <div className="relative z-10">
                  <p className="text-xl font-light mb-12 text-white dark:text-[#0b0b0b] leading-snug tracking-tight max-w-[90%]">
                    "{language === 'cs' ? 'Díky integrované AI a detailním datasetům jsem během chvíle zjistil všechny potřebné informace o lokalitě, které bych jinak hledal dny.' : 'Thanks to the integrated AI and detailed datasets, I quickly found all the necessary information about the location that would otherwise take me days to find.'}"
                  </p>

                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-[#0b0b0b] flex items-center justify-center text-[#0b0b0b] dark:text-white font-black text-xl border border-black/5 dark:border-white/5 shadow-sm">
                      MK
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white dark:text-[#0b0b0b] tracking-wide">Matyáš K.</h4>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-[#3388ff] text-[#3388ff]" />)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInRight>

          </div>
        </section>

        {/* 3. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="relative py-10 md:py-12 w-full">
          <FadeInUp className="text-center mb-16 relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-wide mb-6 text-[#0b0b0b] dark:text-white">
              {language === 'cs' ? 'Jak to funguje' : 'How it works'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {language === 'cs' ? 'Tři jednoduché kroky vás dělí od toho, abyste přesně věděli, kde chcete žít.' : 'Three simple steps stand between you and knowing exactly where you want to live.'}
            </p>
          </FadeInUp>

          <div className="relative z-10">
            {/* Vertical timeline line (desktop only) */}
            <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-black/10 dark:bg-white/10 z-0"></div>

            <div className="flex flex-col gap-8 md:gap-0 relative z-10">
              {[
                {
                  step: "01",
                  icon: <ClipboardList className="w-6 h-6" strokeWidth={1.5} />,
                  title: language === 'cs' ? 'Vyplňte dotazník' : 'Fill out the questionnaire',
                  desc: language === 'cs' ? 'Řekněte nám, kdo jste a co hledáte. AI pochopí váš profil a navrhne relevantní datasety a lokality.' : 'Tell us who you are and what you need. AI will understand your profile and suggest relevant datasets and locations.',
                  glowPos: 'top-0 right-0'
                },
                {
                  step: "02",
                  icon: <MapPin className="w-6 h-6" strokeWidth={1.5} />,
                  title: language === 'cs' ? 'Prozkoumejte heatmapu' : 'Explore the heatmap',
                  desc: language === 'cs' ? 'Na interaktivní mapě uvidíte, kde jsou pro vás nejlepší místa k bydlení na základě vašich preferencí a dat.' : 'On the interactive map, see the best places to live based on your preferences and data.',
                  glowPos: 'bottom-0 left-0'
                },
                {
                  step: "03",
                  icon: <Bot className="w-6 h-6" strokeWidth={1.5} />,
                  title: language === 'cs' ? 'Zeptejte se AI' : 'Ask the AI',
                  desc: language === 'cs' ? 'Chatujte s AI a zjistěte vše, co potřebujete — od nejbližší školy po kontakt na obecní úřad.' : 'Chat with AI and find out everything you need — from the nearest school to the local council contact.',
                  glowPos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                }
              ].map((step, i) => {
                const CardWrapper = i % 2 === 0 ? FadeInLeft : FadeInRight;
                const NumberWrapper = i % 2 === 0 ? FadeInRight : FadeInLeft;
                return (
                  <div key={i} className={`flex flex-col md:flex-row items-center gap-3 md:gap-16 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    {/* Content Card */}
                    <CardWrapper className="flex-1 w-full text-left" delay={0.1 * i}>
                      <div className="bg-[#0b0b0b] dark:bg-[#f3f3f3] border border-black/5 dark:border-white/5 rounded-2xl md:rounded-3xl p-6 md:p-10 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className={`absolute ${step.glowPos} w-32 h-32 bg-[#3388ff]/30 rounded-full blur-[40px] pointer-events-none z-0`}></div>

                        <div className="md:hidden text-8xl font-black text-white/5 dark:text-black/5 absolute -top-1 -right-1 select-none pointer-events-none">{step.step}</div>

                        <div className="relative z-10 flex flex-col items-start md:block">
                          <div className="md:hidden flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-[#0b0b0b] text-[#0b0b0b] dark:text-white mb-5 border border-black/5 dark:border-white/5 shadow-sm">
                            {step.icon}
                          </div>
                          <h3 className="text-xl font-bold mb-3 text-white dark:text-[#0b0b0b]">{step.title}</h3>
                          <p className="text-sm text-gray-400 dark:text-gray-600 leading-relaxed font-light text-left md:text-left max-w-[95%]">{step.desc}</p>
                        </div>
                      </div>
                    </CardWrapper>

                    {/* Center Timeline Node */}
                    <ScaleIn className="hidden md:flex relative flex-shrink-0 z-20" delay={0.15 * i}>
                      <div className="w-16 h-16 rounded-full bg-transparent flex items-center justify-center border border-black/5 dark:border-white/5 relative">
                        <div className="relative z-10 w-full h-full rounded-full bg-[#0b0b0b] dark:bg-[#f3f3f3] text-white dark:text-[#0b0b0b] flex items-center justify-center border border-black/5 dark:border-white/5">
                          {step.icon}
                        </div>
                      </div>
                    </ScaleIn>

                    {/* Step Number */}
                    <NumberWrapper className={`flex-1 w-full ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'} hidden md:block`} delay={0.2 * i}>
                      <span className="text-8xl font-black text-black/5 dark:text-white/5 select-none leading-none">{step.step}</span>
                    </NumberWrapper>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3B. SECONDARY FEATURE HIGHLIGHT (Left-Aligned Stealth Card) */}
        <section id="negotiation" className="relative py-10 md:py-12 w-full overflow-hidden">
          <div className="flex flex-col lg:flex-row-reverse gap-2 md:gap-10 lg:gap-20 items-center">

            {/* Right Text content (Now on the right) */}
            <FadeInRight className="flex-1 w-full text-center lg:text-left z-10">
              <h2 className="text-4xl font-black uppercase tracking-wide mb-6 text-[#0b0b0b] dark:text-white leading-[1.1]">
                {language === 'cs' ? 'Hluboká analýza na dosah ruky.' : 'Deep analysis at your fingertips.'}
              </h2>
              <div className="w-full h-px bg-black/10 dark:bg-white/10 mb-8 mx-auto lg:mx-0"></div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-light mb-10 max-w-xl mx-auto lg:mx-0">
                {language === 'cs' ?
                  'Nemusíte být datový analytik. Naše AI zpracovává desítky otevřených datasetů — od cen nemovitostí, přes občanskou vybavenost, dopravní spojení až po kvalitu ovzduší. Vše vizualizováno na přehledné heatmapě přizpůsobené přesně vašim potřebám.' :
                  'You don\'t need to be a data analyst. Our AI processes dozens of open datasets — from property prices, amenities, transport connections to air quality. Everything visualized on a clear heatmap tailored to your exact needs.'}
              </p>
            </FadeInRight>

            {/* Left Stealth Card (Now on the left) */}
            <FadeInLeft className="flex-1 w-full relative z-10 perspective-[1500px] mt-4 lg:mt-0" delay={0.2}>
              <div className="bg-[#0b0b0b] dark:bg-[#f3f3f3] border border-black/5 dark:border-white/5 p-6 sm:p-10 md:p-14 rounded-[2rem] md:rounded-[3rem] relative transform lg:rotateY(5deg) lg:rotateX(5deg) scale-100 lg:scale-[0.95] hover:rotateY(0) hover:rotateX(0) hover:scale-100 transition-all duration-700 ease-out overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#3388ff]/40 rounded-full blur-[50px] pointer-events-none z-0"></div>

                <MessageSquareQuote className="hidden md:block w-16 h-16 text-[#3388ff] mb-8 absolute top-8 right-8 z-10" strokeWidth={1.5} />

                <div className="relative z-10">
                  <p className="text-xl font-light mb-12 text-white dark:text-[#0b0b0b] leading-snug tracking-tight max-w-[90%]">
                    "{language === 'cs' ? 'Díky přehledným heatmapám a vizualizacím dat jsem ihned viděl, že vybraná lokalita splňuje přesně to, co potřebuji pro svou rodinu.' : 'Thanks to the clear heatmaps and data visualizations, I immediately saw that the chosen location perfectly meets the needs of my family.'}"
                  </p>

                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-[#0b0b0b] flex items-center justify-center text-[#0b0b0b] dark:text-white font-black text-xl border border-black/5 dark:border-white/5 shadow-sm">
                      TB
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white dark:text-[#0b0b0b] tracking-wide">Tomáš B.</h4>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-[#3388ff] text-[#3388ff]" />)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInLeft>

          </div>
        </section>

        {/* 4. PRICING SECTION */}
        <section id="pricing" className="relative py-10 md:py-12 w-full z-10">
          <FadeInUp className="text-center mb-16 relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-wide mb-6 text-[#0b0b0b] dark:text-white">
              {language === 'cs' ? 'Ceník' : 'Pricing'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {language === 'cs' ? 'Díky komerčním licencím může být ZIJE!SE pro všechny běžné uživatele zdarma. Děkujeme!' : 'Thanks to commercial licenses, ZIJE!SE can be free for all regular users. Thank you!'}
            </p>
          </FadeInUp>

          <div className="flex px-4 overflow-x-auto md:grid md:grid-cols-2 gap-4 md:gap-0 max-w-5xl mx-auto md:px-6 relative z-10 pb-6 md:pb-0 snap-x snap-mandatory md:snap-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              .flex::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* Free Tier */}
            <ScaleIn className="relative group z-10 min-w-[85vw] md:min-w-0 snap-center" delay={0}>
              <div className="bg-transparent border border-black/5 dark:border-white/5 rounded-3xl md:rounded-r-none md:rounded-l-[3rem] p-8 md:p-12 flex flex-col h-full transition-all duration-300 overflow-hidden relative">
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-1 text-[#0b0b0b] dark:text-white">{language === 'cs' ? 'Osobní použití' : 'Personal Use'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                    {language === 'cs' ? 'Zcela zdarma pro běžné uživatele' : 'Completely free for regular users'}
                  </p>
                </div>

                <div className="flex items-baseline gap-2 mb-8 text-[#0b0b0b] dark:text-white">
                  <span className="text-5xl font-black">0 Kč</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/{language === 'cs' ? 'měsíc' : 'month'}</span>
                </div>

                <div className="w-full h-px bg-black/10 dark:bg-white/10 mb-8"></div>

                <ul className="space-y-5 mb-10 flex-grow">
                  {[
                    { text: language === 'cs' ? 'Přístup k interaktivní mapě' : 'Access to interactive map', included: true },
                    { text: language === 'cs' ? 'Procházení datasetů' : 'Browse datasets', included: true },
                    { text: language === 'cs' ? 'AI chat asistent' : 'AI chat assistant', included: true },
                    { text: language === 'cs' ? 'Ukládání historie chatu' : 'Chat history saving', included: true }
                  ].map((item, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm flex-wrap sm:flex-nowrap ${item.included ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600 opacity-60'}`}>
                      <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                        {item.included ? (
                          <CheckCircle2 className="w-4 h-4 text-gray-500 dark:text-gray-400" strokeWidth={2} />
                        ) : (
                          <X className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2} />
                        )}
                      </div>
                      <span className={item.included ? '' : 'line-through decoration-black/20 dark:decoration-white/20'}>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => setIsAuthOpen(true)} className="w-full px-5 py-2.5 rounded-full border border-black/10 dark:border-white/10 bg-transparent text-sm text-[#0b0b0b] dark:text-white font-medium text-center hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300">
                  {language === 'cs' ? 'Začít zdarma' : 'Start for free'}
                </button>
              </div>
            </ScaleIn>

            {/* Premium Tier */}
            <ScaleIn className="relative group z-20 min-w-[85vw] md:min-w-0 snap-center" delay={0.15}>
              <div className="relative bg-[#0b0b0b] dark:bg-[#f3f3f3] border border-black/5 dark:border-white/5 rounded-3xl md:rounded-l-none md:rounded-r-[3rem] p-8 md:p-12 flex flex-col overflow-hidden h-full transition-all duration-300">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#3388ff]/30 rounded-full blur-[60px] pointer-events-none z-0"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3388ff]/20 rounded-full blur-[50px] pointer-events-none z-0"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold mb-1 flex items-center gap-2 text-white dark:text-[#0b0b0b]">
                        {language === 'cs' ? 'Komerční licence' : 'Commercial'} <Zap className="w-4 h-4 text-[#3388ff] fill-[#3388ff]" strokeWidth={1.5} />
                      </h3>
                      <p className="text-sm text-gray-400 dark:text-gray-600 font-light">
                        {language === 'cs' ? 'Děkujeme, že podporujete provoz zdarma!' : 'Thank you for supporting the free version!'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-8 text-white dark:text-[#0b0b0b]">
                    <span className="text-5xl font-black">299 Kč</span>
                    <span className="text-sm text-gray-400 dark:text-gray-600">/{language === 'cs' ? 'měsíc' : 'month'}</span>
                  </div>

                  <div className="w-full h-px bg-white/10 dark:bg-black/10 mb-8"></div>

                  <ul className="space-y-5 mb-10 flex-grow">
                    {[
                      (language === 'cs' ? 'Vše z osobního použití' : 'Everything from Personal use'),
                      (language === 'cs' ? 'Komerční využití dat' : 'Commercial data usage'),
                      (language === 'cs' ? 'API přístup (připravujeme)' : 'API access (coming soon)'),
                      (language === 'cs' ? 'Prioritní podpora' : 'Priority support')
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-[#3388ff]/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-[#3388ff]" strokeWidth={2} />
                        </div>
                        <span className="font-medium text-white dark:text-[#0b0b0b]">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <button onClick={() => setIsAuthOpen(true)} className="w-full px-5 py-2.5 rounded-full bg-[#3388ff] text-sm text-white font-medium text-center hover:bg-[#2563eb] transition-all duration-300 border border-white/10 dark:border-black/10">
                    {language === 'cs' ? 'Získat Licenci' : 'Get License'}
                  </button>
                </div>
              </div>
            </ScaleIn>
          </div>

          {/* Mobile swipe indicator */}
          <div className="md:hidden flex items-center justify-center mt-2 text-xs font-semibold text-[#0b0b0b] dark:text-white uppercase tracking-wider opacity-60">
            {language === 'cs' ? 'Posuňte pro více' : 'Swipe for more'} <ArrowRight size={14} className="ml-1" />
          </div>
        </section>

      </main>

      {/* 5. FOOTER */}
      <footer className="relative w-full overflow-hidden mt-10">
        <div className="relative z-10 w-screen left-1/2 -translate-x-1/2 bg-[#0b0b0b] dark:bg-[#f3f3f3] border-t border-black/5 dark:border-white/5 py-16 overflow-hidden">
          {/* Dark/Light Section Background Ambient Glow */}
          <div className={`absolute top-0 right-1/4 w-96 h-96 bg-[#3388ff]/30 rounded-full blur-[80px] pointer-events-none z-0`}></div>
          <div className={`absolute bottom-0 left-1/4 w-96 h-96 bg-[#3388ff]/30 rounded-full blur-[80px] pointer-events-none z-0`}></div>

          <div className="max-w-7xl mx-auto w-[95%] md:w-[100%] px-6 md:px-10 relative z-10">
            {/* Top Footer (CTA) */}
            <FadeInUp className="py-12 md:py-24 flex flex-col items-center justify-center text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-wide mb-8 md:mb-10 text-white dark:text-[#0b0b0b] px-4">
                {language === 'cs' ? 'Zjistěte, kde se žije nejlépe' : 'Discover where life is best'}
              </h2>
              <div>
                <Link
                  href="/app"
                  className="px-5 py-2 rounded-full bg-[#3388ff] hover:bg-[#2563eb] text-sm font-medium text-white transition-all transform-gpu duration-300 ease-in-out active:translate-y-px border border-white/10 dark:border-black/10 inline-flex items-center justify-center"
                >
                  {language === 'cs' ? 'Spustit aplikaci' : 'Launch App'}
                </Link>
              </div>
            </FadeInUp>

            {/* Bottom Footer (Links & Copyright) */}
            <div className="border-t border-white/10 dark:border-black/10 pt-10 pb-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-400 dark:text-gray-600">
                <div className="flex items-center gap-3 font-black text-white dark:text-[#0b0b0b] text-xl">
                  <Logo className="w-8 h-8" /> ZIJE!SE
                </div>

                <div className="flex flex-wrap justify-center gap-8 font-medium">
                  <button onClick={() => setActiveLegalPanel('gdpr')} className="hover:text-white dark:hover:text-[#0b0b0b] transition-colors bg-transparent border-none p-0 cursor-pointer text-gray-400 dark:text-gray-600">GDPR</button>
                  <button onClick={() => setActiveLegalPanel('terms')} className="hover:text-white dark:hover:text-[#0b0b0b] transition-colors bg-transparent border-none p-0 cursor-pointer text-gray-400 dark:text-gray-600">{language === 'cs' ? 'Podmínky' : 'Terms'}</button>
                  <button onClick={() => setActiveLegalPanel('privacy')} className="hover:text-white dark:hover:text-[#0b0b0b] transition-colors bg-transparent border-none p-0 cursor-pointer text-gray-400 dark:text-gray-600">{language === 'cs' ? 'Ochrana soukromí' : 'Privacy'}</button>
                  <button onClick={() => setActiveLegalPanel('contact')} className="hover:text-white dark:hover:text-[#0b0b0b] transition-colors bg-transparent border-none p-0 cursor-pointer text-gray-400 dark:text-gray-600">{language === 'cs' ? 'Kontakt' : 'Contact'}</button>
                </div>

                <div className="font-medium text-gray-500 text-center md:text-right">
                  &copy; {new Date().getFullYear()} ZIJE!SE. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Panel Overlay */}
      <div className={`fixed inset-y-0 left-0 z-[100] transition-transform duration-300 w-80 max-w-[100vw] ${isAuthOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <AuthPanel
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          isCollapsed={false}
          setIsCollapsed={() => { }}
          showCloseIcon={true}
          hideCollapseButton={true}
          hideBackButton={true}
        />
      </div>

      {/* Legal Panel Overlay */}
      <div className={`fixed inset-y-0 left-0 z-[100] transition-transform duration-300 w-80 max-w-[100vw] ${activeLegalPanel ? 'translate-x-0' : '-translate-x-full'}`}>
        <LegalPanel
          isOpen={!!activeLegalPanel}
          onClose={() => setActiveLegalPanel(null)}
          type={activeLegalPanel}
        />
      </div>

      {/* Backdrop for Panels */}
      <div
        className={`fixed inset-0 bg-black/50 z-[90] transition-opacity duration-300 ${isAuthOpen || activeLegalPanel ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => {
          setIsAuthOpen(false);
          setActiveLegalPanel(null);
        }}
      />
    </div>
  );
}
