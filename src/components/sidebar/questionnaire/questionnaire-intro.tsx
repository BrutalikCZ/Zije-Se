import React from 'react';
import { useLanguage } from '@/components/providers/language-provider';

interface QuestionnaireIntroProps {
    isLoggedIn: boolean;
    isFinished: boolean;
    hasHistory: boolean;
    onStart: () => void;
    onSkip: () => void;
}

export function QuestionnaireIntro({ isLoggedIn, isFinished, hasHistory, onStart, onSkip }: QuestionnaireIntroProps) {
    const { language } = useLanguage();

    return (
        <div className="flex flex-col h-full">
            <p className="text-sm md:text-md opacity-80 mb-6 leading-relaxed font-medium">
                {language === 'cs'
                    ? 'Chcete-li personalizovat výsledky a mapové podklady přímo na míru vašemu životnímu stylu, vyplňte náš dotazník. Celkem máme 50 otázek, ale pro základní doporučení stačí odpovědět na prvních 10.'
                    : 'To personalize results and map layouts specifically to your lifestyle, please fill out our survey. We have 50 questions in total, but answering the first 10 is enough for basic recommendations.'}
            </p>

            <div className="flex flex-col gap-3 mt-auto pt-4 text-sm w-full">
                {!isLoggedIn && (
                    <div className="text-center text-[11px] text-[#3388ff]/70 -mb-1 font-medium">
                        {language === 'cs' ? 'Pro vyplnění dotazníku se přihlaste' : 'Log in to complete the questionnaire'}
                    </div>
                )}
                <button
                    onClick={onStart}
                    disabled={!isLoggedIn}
                    className={`w-full text-center px-4 py-3 rounded-full font-medium transition-transform transform-gpu duration-300 shadow-lg border border-white/10 dark:border-black/10 backdrop-blur-md ${!isLoggedIn ? 'opacity-50 cursor-not-allowed bg-[#3388ff]/50 text-white/50' : 'cursor-pointer bg-[#3388ff] hover:bg-[#2563eb] text-white active:translate-y-px'}`}
                >
                    {isFinished
                        ? (language === 'cs' ? 'Začít nový dotazník' : 'Start new questionnaire')
                        : hasHistory
                            ? (language === 'cs' ? 'Pokračovat v dotazníku' : 'Continue questionnaire')
                            : (language === 'cs' ? 'Začít dotazník' : 'Start questionnaire')}
                </button>

                <button
                    onClick={onSkip}
                    className="w-full cursor-pointer text-center px-4 py-3 mb-4 rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] hover:bg-[#262626] dark:hover:bg-[#dcdcdc] font-medium transition-transform transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md"
                >
                    {language === 'cs' ? 'Nedělat a jen prohlížet' : 'Skip and just view'}
                </button>
            </div>
        </div>
    );
}
