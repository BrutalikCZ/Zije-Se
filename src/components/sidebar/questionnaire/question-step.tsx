import React from 'react';
import { useLanguage } from '@/components/providers/language-provider';

interface QuestionStepProps {
    question: string;
    index: number;
    totalQuestions: number;
    currentAnswer: boolean | undefined;
    onAnswer: (index: number, answer: boolean) => void;
}

export function QuestionStep({ question, index, totalQuestions, currentAnswer, onAnswer }: QuestionStepProps) {
    const { language } = useLanguage();

    return (
        <div className="flex flex-col items-center text-center h-full min-h-full max-w-sm mx-auto pt-2 pb-6 overflow-y-auto w-full">
            <div className="inline-block px-3 py-1.5 rounded-full bg-[#3388ff]/10 text-[#3388ff] text-[10px] font-bold mb-4 border border-[#3388ff]/20 shrink-0">
                {language === 'cs' ? 'Otázka' : 'Question'} {index + 1} / {totalQuestions}
            </div>

            <div className="flex-1 flex items-center justify-center w-full px-1 mb-8">
                <h3 className={`font-bold tracking-tight leading-tight w-full text-pretty ${question.length < 45 ? 'text-2xl' :
                    question.length < 75 ? 'text-xl' :
                        question.length < 100 ? 'text-lg' :
                            'text-base'
                    }`}>
                    {question}
                </h3>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[220px] mx-auto text-base font-semibold mt-auto shrink-0">
                <button
                    onClick={() => onAnswer(index, true)}
                    className={`cursor-pointer group py-3 px-4 rounded-full transition-all transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md ${currentAnswer === true ? 'bg-[#3388ff] text-white border-transparent' : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc]'}`}
                >
                    <span className={`transition-transform inline-block ${currentAnswer === true ? 'scale-105' : 'group-hover:scale-105'}`}>
                        {language === 'cs' ? 'Ano' : 'Yes'}
                    </span>
                </button>

                <button
                    onClick={() => onAnswer(index, false)}
                    className={`cursor-pointer group py-3 px-4 rounded-full transition-all transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md ${currentAnswer === false ? 'bg-[#3388ff] text-white border-transparent' : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc]'}`}
                >
                    <span className={`transition-transform inline-block ${currentAnswer === false ? 'scale-105' : 'group-hover:scale-105'}`}>
                        {language === 'cs' ? 'Ne' : 'No'}
                    </span>
                </button>
            </div>
        </div>
    );
}
