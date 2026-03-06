import React, { useState, useRef } from 'react';
import { ListChecks } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import Stepper, { Step } from '@/components/ui/stepper';
import { useAuth } from '@/components/providers/auth-provider';
import { SidebarLayout } from './sidebar-layout';
import { getQuestions } from './questionnaire/questions-data';
import { QuestionStep } from './questionnaire/question-step';
import { QuestionnaireIntro } from './questionnaire/questionnaire-intro';
import { QuestionnaireResult } from './questionnaire/questionnaire-result';
import { QuestionnaireFooter } from './questionnaire/questionnaire-footer';

interface QuestionnairePanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
    onEvaluated?: (answers: Record<number, boolean>) => void;
    onLoginClick?: () => void;
}

export function QuestionnairePanel({ isOpen, onClose, isCollapsed, setIsCollapsed, onEvaluated, onLoginClick }: QuestionnairePanelProps) {
    const { language } = useLanguage();
    const [mode, setMode] = useState<'intro' | 'questionnaire' | 'result'>('intro');
    const [answers, setAnswers] = useState<Record<number, boolean>>({});
    const [debugUnlocked, setDebugUnlocked] = useState(false);

    const { user, updateUser } = useAuth();

    React.useEffect(() => {
        if (user?.questionnaireData && Object.keys(answers).length === 0) {
            // Fix: Clean up null values that might have been saved in DB if it was serialized as an array
            const cleanData: Record<number, boolean> = {};

            if (Array.isArray(user.questionnaireData)) {
                user.questionnaireData.forEach((val, i) => {
                    if (val === true || val === false) cleanData[i] = val;
                });
            } else if (typeof user.questionnaireData === 'object') {
                Object.entries(user.questionnaireData).forEach(([key, val]) => {
                    if (val === true || val === false) cleanData[parseInt(key, 10)] = val as boolean;
                });
            }
            setAnswers(cleanData);
        }
    }, [user, isOpen]);

    const questions = getQuestions(language as 'cs' | 'en');
    const stepperRef = useRef<any>(null);
    const completedSteps = Object.keys(answers).map(key => parseInt(key, 10) + 1);
    const answeredCount = Object.keys(answers).length;
    const isFinished = answeredCount === questions.length;
    const hasHistory = answeredCount > 0;

    const firstUnansweredIndex = questions.findIndex((_, i) => answers[i] === undefined || answers[i] === null);
    const calculatedInitialStep = firstUnansweredIndex === -1 ? 1 : firstUnansweredIndex + 1;

    const handleAnswer = (index: number, answer: boolean) => {
        console.log(`Otázka ${index} zodpovězena:`, answer);
        setAnswers(prev => {
            const newAnswers = { ...prev, [index]: answer };
            console.log("Aktuální stav odpovědí:", newAnswers);
            return newAnswers;
        });
        if (stepperRef.current) {
            setTimeout(() => {
                stepperRef.current.nextStep();
            }, 250);
        }
    };

    const handleFinish = async () => {
        console.log("Answers:", answers);
        if (user) {
            try {
                const resp = await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "update_data",
                        id: user.id,
                        questionnaireData: answers,
                    }),
                });
                if (resp.ok) {
                    const data = await resp.json();
                    updateUser({ questionnaireData: answers });
                    console.log("Data saved!", data);
                }
            } catch (err) {
                console.error("Failed to save data", err);
            }
        }

        if (onEvaluated) {
            onEvaluated(answers);
        }
        setMode('result');
    };

    const handleSkip = () => {
        setMode('intro');
        onClose();
    };

    const handleStartQuestionnaire = () => {
        if (!user) return;
        if (isFinished) {
            setAnswers({});
        }
        setMode('questionnaire');
    };

    const handleResultContinue = () => {
        setMode('intro');
        onClose();
    };

    const handleDebugReset = async () => {
        setDebugUnlocked(true);
        setAnswers({});
        if (user) {
            try {
                await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "update_data",
                        id: user.id,
                        questionnaireData: {},
                    }),
                });
                updateUser({ questionnaireData: {} });
            } catch (err) {
                console.error("Failed to reset questionnaire data", err);
            }
        }
    };

    return (
        <SidebarLayout
            isOpen={isOpen}
            onClose={onClose}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            zIndex={20}
            collapsedIcon={<ListChecks size={20} />}
            collapsedIconTitle={language === 'cs' ? 'Dotazník' : 'Questionnaire'}
            showAuthSection={mode === 'intro'}
            onLoginClick={onLoginClick}
        >
            <div data-tour="questionnaire-panel-intro" className="flex-1 flex flex-col min-h-0 relative z-10 w-full">
                <div className="text-center shrink-0 mb-6 mt-4">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white dark:text-black mb-2">
                        {language === 'cs' ? 'DOTAZNÍK' : 'QUESTIONNAIRE'}
                    </h1>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 px-2">
                        {language === 'cs' ? 'Vaše osobní preference pro ideální bydlení' : 'Your personal preferences for ideal living'}
                    </p>
                    <div className="h-px w-full bg-white/10 dark:bg-black/10"></div>
                </div>

                <div className="flex-1 overflow-hidden min-h-0 flex flex-col relative z-10">
                    {mode === 'result' ? (
                        <QuestionnaireResult
                            isFinished={isFinished}
                            answeredCount={answeredCount}
                            onContinue={handleResultContinue}
                        />
                    ) : mode === 'intro' ? (
                        <QuestionnaireIntro
                            isLoggedIn={!!user}
                            isFinished={isFinished}
                            hasHistory={hasHistory}
                            onStart={handleStartQuestionnaire}
                            onSkip={handleSkip}
                        />
                    ) : (
                        <div className="flex flex-col h-full w-full">
                            {/* @ts-ignore */}
                            <Stepper
                                ref={stepperRef}
                                initialStep={calculatedInitialStep}
                                completedSteps={completedSteps}
                                className="!h-full !flex-1 flex flex-col"
                                onStepChange={(step: number) => console.log(step)}
                                onFinalStepCompleted={handleFinish}
                                stepCircleContainerClassName="!max-w-full !w-full !h-full flex flex-col flex-1 bg-transparent !shadow-none border-none border-0 m-0 !bg-transparent rounded-none"
                                stepContainerClassName="!px-0 !py-2 shrink-0 border-b border-white/10 dark:border-black/10 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]"
                                contentClassName="!flex-1 !h-full !min-h-0 !overflow-y-auto overflow-x-hidden w-full px-0 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent [height:100%!important]"
                                renderFooter={({ currentStep, handleBack, handleNext, isLastStep }: any) => (
                                    <QuestionnaireFooter
                                        currentStep={currentStep}
                                        isLastStep={isLastStep}
                                        answeredCount={answeredCount}
                                        handleBack={handleBack}
                                        handleNext={handleNext}
                                        handleFinish={handleFinish}
                                        handleDebugReset={handleDebugReset}
                                        debugUnlocked={debugUnlocked}
                                    />
                                )}
                            >
                                {questions.map((question, index) => (
                                    <Step key={index}>
                                        <QuestionStep
                                            question={question}
                                            index={index}
                                            totalQuestions={questions.length}
                                            currentAnswer={answers[index]}
                                            onAnswer={handleAnswer}
                                        />
                                    </Step>
                                ))}
                            </Stepper>
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
}
