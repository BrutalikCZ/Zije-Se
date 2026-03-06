"use client";

import React, { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from "react-joyride";
import { useLanguage } from "@/components/providers/language-provider";
import { useTheme } from "next-themes";
import { X } from "lucide-react";

const TOUR_KEY = "zijese-tour-completed";

export function AppTour() {
    const { language } = useLanguage();
    const { resolvedTheme } = useTheme();
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const completed = localStorage.getItem(TOUR_KEY);
        if (!completed) {
            // Short delay to let the UI fully render
            const t = setTimeout(() => setRun(true), 800);
            return () => clearTimeout(t);
        }
    }, []);

    const stepsCs: Step[] = [
        {
            target: "body",
            placement: "center",
            disableBeacon: true,
            title: "Vítejte v ZIJE!SE 👋",
            content: "Tato aplikace vám pomůže najít ideální místo pro život nebo objevovat detaily o lokalitách v ČR. Pojďme se podívat, co zde najdete.",
        },
        {
            target: "[data-tour='questionnaire']",
            placement: "right",
            disableBeacon: true,
            title: "Začínáme dotazníkem",
            content: "Dotazník je hlavním odrazovým můstkem pro zjištění ideální lokality. Pojďme si ho rovnou cvičně otevřít.",
        },
        {
            target: "[data-tour='questionnaire-panel-intro']",
            placement: "right",
            disableBeacon: true,
            title: "Vaše preference",
            content: "Zde si naklikáte, co je pro vás důležité – od lékařů a škol až po dobrou dopravní dostupnost. Načte se vám pak na míru šitá teplotní mapa.",
        },
        {
            target: "[data-tour='ai-chat']",
            placement: "right",
            disableBeacon: true,
            title: "AI Asistent",
            content: "Nechcete vyplňovat dotazník? Zkuste se na své vysněné místo rovnou zeptat naší umělé inteligence.",
        },
        {
            target: "[data-tour='ai-chat-input']",
            placement: "top",
            disableBeacon: true,
            title: "Analýza lokalit",
            content: "Zeptejte se asistenta na cokoliv – např. „kde jsou školy v Praze?“. Po přihlášení má asistent mimo jiné přímý přístup k detailní prostorové databázi.",
        },
        {
            target: "[data-tour='ai-settings-button']",
            placement: "top",
            disableBeacon: true,
            title: "Nastavení asistenta",
            content: "Zde dole přes malou ikonku ozubeného kolečka se dostanete do nastavení umělé inteligence.",
        },
        {
            target: "[data-tour='ai-settings-panel']",
            placement: "right",
            disableBeacon: true,
            title: "Model a historie",
            content: "Uvnitř si můžete přepínat jazykový model (např. Google Gemini) nebo jednoduše promazat dosavadní historii konverzace s asistentem.",
        },
        {
            target: "[data-tour='regions']",
            placement: "right",
            disableBeacon: true,
            title: "Přehled Dat za Kraje",
            content: "Tudy se dostanete přímo na konkrétní fyzická data pro jednotlivé kraje ČR bez jakéhokoliv dotazníkového filtrování.",
        },
        {
            target: "[data-tour='region-data-panel']",
            placement: "right",
            disableBeacon: true,
            title: "Vrstvy zájmových bodů",
            content: "Rozklikněte si složky (Zdravotnictví, Doprava...) a rovnou si zaškrtávejte zobrazení konkrétních vrstev (např. lékárny) na mapě.",
        },
        {
            target: "[data-tour='user-area']",
            placement: "right",
            disableBeacon: true,
            title: "Přihlášení k účtu",
            content: "Aplikaci můžete používat i bez účtu, ale pokud si chcete uložit progres dotazníku a využívat AI asistenta naplno, zde se můžete přihlásit.",
        },
        {
            target: "[data-tour='settings']",
            placement: "top",
            disableBeacon: true,
            title: "Spodní lišta",
            content: "Spodní lišta nabízí mimo jiné i několik dalších užitečných sekcí a možností.",
        },
        {
            target: "[data-tour='settings-panel']",
            placement: "right",
            disableBeacon: true,
            title: "Vizuální nastavení mapy",
            content: "Zde můžete změnit podklad z výchozího například na satelitní snímky či katastr, přidat mód pro barvoslepé, nebo manuálně nastavovat zobrazení teplotní mapy.",
        },
        {
            target: "[data-tour='datasets']",
            placement: "top",
            disableBeacon: true,
            title: "Zobrazit Datasety",
            content: "Pro opravdové geeks a hračičky tu máme ještě něco navíc.",
        },
        {
            target: "[data-tour='datasets-panel']",
            placement: "right",
            disableBeacon: true,
            title: "Průzkumník složek",
            content: "Správcovský pohled na všechny datové vrstvy z celé republiky hezky pohromadě v jednom adresářovém stromu, odkud si cokoliv můžete zapnout.",
        },
        {
            target: "[data-tour='map']",
            placement: "center",
            disableBeacon: true,
            title: "A nakonec – Mapa!",
            content: "Kliknutím na kterouliv obarvenou buňku heatmapy najdete ihned 100 nejpodobnějších koutů v zemi. A pravým tlačítkem můžete AI chatu poslat souřadnice. Užijte si to!",
        },
    ];

    const stepsEn: Step[] = [
        {
            target: "body",
            placement: "center",
            disableBeacon: true,
            title: "Welcome to ZIJE!SE 👋",
            content: "This app helps you find the ideal place to live or discover details about locations in the Czech Republic. Let's see what's inside.",
        },
        {
            target: "[data-tour='questionnaire']",
            placement: "right",
            disableBeacon: true,
            title: "Starting with a Questionnaire",
            content: "The questionnaire is the main stepping stone to finding your ideal location. Let's open it up.",
        },
        {
            target: "[data-tour='questionnaire-panel-intro']",
            placement: "right",
            disableBeacon: true,
            title: "Your Preferences",
            content: "Here you can select what matters to you – from doctors and schools to good transport links. A tailor-made heatmap will then be loaded.",
        },
        {
            target: "[data-tour='ai-chat']",
            placement: "right",
            disableBeacon: true,
            title: "AI Assistant",
            content: "Don't want to fill out a questionnaire? Try asking our artificial intelligence directly about your dream location.",
        },
        {
            target: "[data-tour='ai-chat-input']",
            placement: "top",
            disableBeacon: true,
            title: "Location Analysis",
            content: "Ask the assistant anything – e.g., 'Where are the schools in Prague?'. Once logged in, the assistant has direct access to a detailed spatial database.",
        },
        {
            target: "[data-tour='ai-settings-button']",
            placement: "top",
            disableBeacon: true,
            title: "Assistant Settings",
            content: "Here at the bottom, through the small gear icon, you can access the artificial intelligence settings.",
        },
        {
            target: "[data-tour='ai-settings-panel']",
            placement: "right",
            disableBeacon: true,
            title: "Model & History",
            content: "Inside you can switch the language model (e.g. Google Gemini) or simply clear the conversation history.",
        },
        {
            target: "[data-tour='regions']",
            placement: "right",
            disableBeacon: true,
            title: "Regional Data Overview",
            content: "This takes you straight to specific physical data for individual regions of the Czech Republic without any questionnaire filtering.",
        },
        {
            target: "[data-tour='region-data-panel']",
            placement: "right",
            disableBeacon: true,
            title: "Point of Interest Layers",
            content: "Expand folders (Healthcare, Transport...) and check specific layers (e.g., pharmacies) to display them directly on the map.",
        },
        {
            target: "[data-tour='user-area']",
            placement: "right",
            disableBeacon: true,
            title: "Account Login",
            content: "You can use the app without an account, but if you want to save your progress and fully use the AI assistant, you can log in here.",
        },
        {
            target: "[data-tour='settings']",
            placement: "top",
            disableBeacon: true,
            title: "Bottom Bar",
            content: "The bottom bar offers several other useful sections and options.",
        },
        {
            target: "[data-tour='settings-panel']",
            placement: "right",
            disableBeacon: true,
            title: "Visual Map Settings",
            content: "Here you can change the base from default to satellite or cadastre, add a colorblind mode, or manually set the heatmap display.",
        },
        {
            target: "[data-tour='datasets']",
            placement: "top",
            disableBeacon: true,
            title: "View Datasets",
            content: "For true geeks and tinkerers, we have a little something extra.",
        },
        {
            target: "[data-tour='datasets-panel']",
            placement: "right",
            disableBeacon: true,
            title: "Folder Explorer",
            content: "An admin view of all data layers from across the country nicely together in one directory tree, from where you can turn anything on.",
        },
        {
            target: "[data-tour='map']",
            placement: "center",
            disableBeacon: true,
            title: "Finally – The Map!",
            content: "By clicking on any colored cell of the heatmap, you will immediately find the 100 most similar spots in the country. And by right-clicking, you can send coordinates to the AI chat. Enjoy!",
        },
    ];

    const steps = language === 'cs' ? stepsCs : stepsEn;

    const handleCallback = (data: CallBackProps) => {
        const { status, index, type, action, step } = data;

        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setRun(false);
            localStorage.setItem(TOUR_KEY, "true");
            window.dispatchEvent(new CustomEvent('tour:focus', { detail: { target: "body" } }));
            return;
        }

        if (type === "step:before") {
            window.dispatchEvent(new CustomEvent('tour:focus', { detail: { target: step.target } }));

            // Pojistka: občas se joyride přepočítá, pokud panel ještě trochu popojede, tak ho takto donutíme překreslovat prvních 400ms
            let count = 0;
            const intervalId = setInterval(() => {
                window.dispatchEvent(new Event('resize'));
                window.dispatchEvent(new Event('scroll'));
                count++;
                if (count >= 8) clearInterval(intervalId);
            }, 50);
        }

        if (type === "step:after" || type === "error:target_not_found") {
            const nextIndex = index + (action === 'prev' ? -1 : 1);

            if (nextIndex >= 0 && nextIndex < steps.length) {
                // Pre-dispatch, aby sidebary začaly vyjíždět už teď
                window.dispatchEvent(new CustomEvent('tour:focus', { detail: { target: steps[nextIndex].target } }));

                // Počkáme 350ms než se dokončí CSS transition (tailwind duration-300), aby se Joyride nezaměřoval na rotující/posunující se element
                setTimeout(() => {
                    setStepIndex(nextIndex);
                }, 350);
            } else {
                setStepIndex(nextIndex);
            }
        }
    };

    const CustomTooltip = ({
        index,
        step,
        backProps,
        closeProps,
        primaryProps,
        tooltipProps,
        isLastStep,
    }: TooltipRenderProps) => (
        <div {...tooltipProps} className="relative bg-[#050505] dark:bg-[#f3f3f3] text-white dark:text-black rounded-[24px] p-6 shadow-2xl border border-white/10 dark:border-black/10 overflow-hidden w-[360px] max-w-[90vw] font-sans">
            <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-[#3388ff]/25 dark:bg-[#3388ff]/25 rounded-full blur-3xl pointer-events-none z-0"></div>

            <div className="relative z-10 flex flex-col items-center text-center mt-2">
                {!step.hideCloseButton && (
                    <button {...closeProps} className="text-[10px] uppercase font-bold tracking-widest opacity-40 hover:opacity-100 hover:text-red-400 transition-colors cursor-pointer mb-3" title={language === 'cs' ? 'Zavřít' : 'Close'}>
                        {language === 'cs' ? 'Zavřít' : 'Close'}
                    </button>
                )}
                <h3 className="text-xl font-black uppercase tracking-wider mb-2">{step.title}</h3>
                <p className="text-[13px] opacity-70 mb-6 leading-relaxed">{step.content}</p>

                <div className="h-px w-full bg-white/10 dark:bg-black/10 mb-4 opacity-50"></div>

                <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] opacity-40 font-mono bg-white/5 dark:bg-black/5 px-2 py-1 rounded-full">{index + 1} / {steps.length}</span>
                    <div className="flex items-center gap-2">
                        {index > 0 && (
                            <button {...backProps} className="px-4 py-2 text-xs font-semibold rounded-full hover:bg-white/10 dark:hover:bg-black/5 transition-colors opacity-70 hover:opacity-100 cursor-pointer">
                                {language === 'cs' ? 'Zpět' : 'Back'}
                            </button>
                        )}
                        <button {...primaryProps} className="px-5 py-2 text-xs font-bold rounded-full bg-[#3388ff] text-white hover:bg-[#2563eb] transition-all transform-gpu active:scale-95 shadow-lg shadow-[#3388ff]/20 cursor-pointer outline-none border-none focus:outline-none focus:ring-0">
                            {isLastStep ? (language === 'cs' ? 'Dokončit' : 'Finish') : (language === 'cs' ? 'Další' : 'Next')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!isMounted) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showSkipButton
            showProgress
            scrollToFirstStep
            disableScrolling={false}
            callback={handleCallback}
            tooltipComponent={CustomTooltip}
            styles={{
                options: {
                    zIndex: 10000,
                    arrowColor: 'transparent',
                    overlayColor: 'rgba(0, 0, 0, 0.45)',
                }
            }}
        />
    );
}

/** Button to re-launch the tour */
export function TourRestartButton({ className }: { className?: string }) {
    const { language } = useLanguage();

    const restart = () => {
        localStorage.removeItem(TOUR_KEY);
        window.location.reload();
    };

    return (
        <button
            onClick={restart}
            className={className}
            title={language === 'cs' ? 'Spustit průvodce' : 'Start tour'}
        >
            {language === 'cs' ? 'Průvodce' : 'Tour'}
        </button>
    );
}
