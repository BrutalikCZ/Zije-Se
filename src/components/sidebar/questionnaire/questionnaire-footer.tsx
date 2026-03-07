import React from 'react';
import { Lock } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

interface QuestionnaireFooterProps {
    currentStep: number;
    isLastStep: boolean;
    answeredCount: number;
    handleBack: () => void;
    handleNext: () => void;
    handleFinish: () => void;
    debugUnlocked: boolean;
}

export function QuestionnaireFooter({ currentStep, isLastStep, answeredCount, handleBack, handleNext, handleFinish, debugUnlocked }: QuestionnaireFooterProps) {
    const { language } = useLanguage();

    return (
        <div className="shrink-0 border-t border-white/10 dark:border-black/10 py-4 flex flex-col gap-2 text-xs">

            <div className="flex items-center justify-between gap-2">
            <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`flex-1 max-w-[80px] group relative px-2 py-2.5 rounded-full font-medium transition-all transform-gpu duration-300 border backdrop-blur-md flex items-center justify-center overflow-hidden ${currentStep === 1 ? 'opacity-50 cursor-not-allowed bg-[#1a1a1a] dark:bg-[#ececeb] border-white/10 dark:border-black/10 text-white dark:text-black' : 'bg-[#1a1a1a] hover:bg-[#262626] dark:bg-[#ececeb] dark:hover:bg-[#dcdcdc] border-white/10 dark:border-black/10 text-white dark:text-black active:translate-y-px shadow-sm'}`}
                title={language === 'cs' ? 'Zpět' : 'Back'}
            >
                {currentStep === 1 ? (
                    <>
                        <span className="group-hover:opacity-0 transition-opacity">{language === 'cs' ? 'Zpět' : 'Back'}</span>
                        <Lock size={14} className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                ) : (
                    <span>{language === 'cs' ? 'Zpět' : 'Back'}</span>
                )}
            </button>

            <div className="flex flex-1 justify-center">
                <button
                    onClick={(answeredCount >= 10 || debugUnlocked) ? handleFinish : undefined}
                    className={`group relative overflow-hidden px-2 py-2.5 rounded-full font-bold transition-all transform-gpu duration-300 border backdrop-blur-md flex items-center justify-center w-full max-w-[120px] ${(answeredCount >= 10 || debugUnlocked) ? 'bg-white hover:bg-gray-100 text-black dark:bg-[#0b0b0b] dark:text-white dark:hover:bg-[#1a1a1a] border border-transparent dark:border-black/10 active:translate-y-px shadow-md cursor-pointer' : 'bg-[#1a1a1a] dark:bg-[#ececeb] border-white/10 dark:border-black/10 text-white dark:text-black cursor-default opacity-80'}`}
                >
                    {(answeredCount >= 10 || debugUnlocked) ? (
                        <span>{language === 'cs' ? 'Vyhodnotit' : 'Evaluate'}</span>
                    ) : (
                        <>
                            <span className="group-hover:opacity-0 transition-opacity">{language === 'cs' ? 'Vyhodnotit' : 'Eval'}</span>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] mr-1 opacity-80">{language === 'cs' ? 'Zbývá' : 'Left'}:</span>
                                <span className="font-black mr-1">{Math.max(0, 10 - answeredCount)}</span>
                                <Lock size={10} className="opacity-80" />
                            </div>
                        </>
                    )}
                </button>
            </div>

            <button
                onClick={isLastStep ? undefined : handleNext}
                disabled={isLastStep}
                className={`flex-1 max-w-[80px] group relative px-2 py-2.5 rounded-full font-medium transition-all transform-gpu duration-300 border backdrop-blur-md flex items-center justify-center overflow-hidden ${isLastStep ? 'opacity-50 cursor-not-allowed bg-[#3388ff] border-white/10 dark:border-black/10 text-white' : 'bg-[#3388ff] hover:bg-[#2563eb] border-white/10 dark:border-black/10 text-white active:translate-y-px shadow-md cursor-pointer'}`}
            >
                {isLastStep ? (
                    <>
                        <span className="group-hover:opacity-0 transition-opacity">{language === 'cs' ? 'Další' : 'Next'}</span>
                        <Lock size={14} className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                ) : (
                    <span>{language === 'cs' ? 'Další' : 'Next'}</span>
                )}
            </button>
            </div>
        </div>
    );
}
