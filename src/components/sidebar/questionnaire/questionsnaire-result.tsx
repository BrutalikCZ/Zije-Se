import React from 'react';
import { useLanguage } from '@/components/providers/language-provider';

interface QuestionnaireResultProps {
    isFinished: boolean;
    answeredCount: number;
    onContinue: () => void;
    onRemoveHeatmap: () => void;
    hasHeatmap: boolean;
}

export function QuestionnaireResult({ isFinished, answeredCount, onContinue, onRemoveHeatmap, hasHeatmap }: QuestionnaireResultProps) {
    const { language } = useLanguage();

    return (
        <div className="flex flex-col h-full items-center justify-center text-center p-6 w-full">
            <h2 className="text-xl tracking-tight leading-tight font-black mb-4 uppercase">
                {language === 'cs' ? 'Děkujeme za vyplnění!' : 'Thank you for answering!'}
            </h2>
            <p className="text-sm font-medium opacity-80 mb-8 leading-relaxed">
                {isFinished
                    ? (language === 'cs' ? 'Vyplnili jste celý dotazník, mapa je plně optimalizována pro vás. Heatmapu můžete kdykoliv vypnout a znovu zapnout v "Nastavení Mapy".' : 'You completed the whole questionnaire, the map is fully optimized for you. You can toggle the heatmap anytime in "Map Settings".')
                    : (language === 'cs' ? `Odpověděli jste na ${answeredCount} z 50 otázek. Pro ještě lepší a přesnější mapu prosím příště vyplňte i zbývající otázky! Heatmapu si můžete vždy přizpůsobit v Nastavení.` : `You answered ${answeredCount} of 50 questions. For even better and more accurate map results, please complete the remaining questions next time! You can always customize the heatmap in Settings.`)}
            </p>
            <button
                onClick={onContinue}
                className="cursor-pointer px-8 py-3 w-full rounded-full bg-[#3388ff] hover:bg-[#2563eb] text-white font-medium transition-transform transform-gpu duration-300 active:translate-y-px shadow-lg border border-white/10 dark:border-black/10 backdrop-blur-md"
            >
                {language === 'cs' ? 'Pokračovat' : 'Continue'}
            </button>
            {hasHeatmap && (
                <button
                    onClick={onRemoveHeatmap}
                    className="cursor-pointer mt-2 px-8 py-3 w-full rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] hover:bg-[#262626] dark:hover:bg-[#dcdcdc] font-medium transition-transform transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md text-sm"
                >
                    {language === 'cs' ? 'Odebrat heatmapu' : 'Remove heatmap'}
                </button>
            )}
        </div>
    );
}
