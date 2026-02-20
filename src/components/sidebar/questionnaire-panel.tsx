import React, { useState, useRef } from 'react';
import { ListChecks, Lock } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import Stepper, { Step } from '@/components/ui/stepper';
import { useAuth } from '@/components/providers/auth-provider';
import { SidebarLayout } from './sidebar-layout';

interface QuestionnairePanelProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (v: boolean) => void;
}

const getQuestions = (lang: 'cs' | 'en') => {
    const cs = [
        "Preferujete bydlet spíše ve městě než na vesnici?",
        "Je pro vás absolutní prioritou bydlet mimo oblasti ohrožené povodněmi (mimo záplavová území)?",
        "Potřebujete mít v krátké docházkové vzdálenosti zastávku hromadné dopravy (MHD, autobus nebo vlak)?",
        "Je pro vás důležité mít v blízkosti bydliště (do 10 km) nemocnici nebo lékařskou pohotovost?",
        "Máte děti (nebo je plánujete) a potřebujete mít blízko mateřskou či základní školu?",
        "Vadí vám vysoká hluková zátěž (např. bydlení blízko hlavních silnic, železnic či letiště)?",
        "Je pro vás klíčové, aby se ve vašem okolí nenacházely velké průmyslové zóny nebo továrny?",
        "Požadujete lokalitu s dostupností spolehlivého a vysokorychlostního internetu?",
        "Chcete bydlet v místě s dobrou dopravní dostupností do nejbližšího krajského města (např. do 30 minut)?",
        "Je pro vás důležité žít v oblasti s čistým ovzduším (mimo zóny s vysokou koncentrací znečišťujících látek)?",
        "Rádi navštěvujete ZOO nebo zooparky a chcete je mít v rozumné dojezdové vzdálenosti?",
        "Potřebujete mít v okolí snadno dostupnou lékárnu?",
        "Chcete mít v pěším dosahu veřejnou knihovnu?",
        "Uvítali byste mít v dojezdové vzdálenosti letiště?",
        "Láká vás život v těsné blízkosti historického centra nebo městské památkové zóny?",
        "Preferujete oblasti, kde je nízká nezaměstnanost a dobrá nabídka pracovních míst?",
        "Hrajete golf a oceníte blízkost golfového hřiště?",
        "Chtěli byste mít poblíž pedagogicko-psychologickou poradnu nebo školské poradenské zařízení?",
        "Je pro vás důležité vyhnout se oblastem, které jsou v létě extrémně ohrožené vlnami veder (nedostatek zeleně a vody)?",
        "Jste milovníci piva a uvítali byste v blízkosti lokální pivovary?",
        "Oceníte v blízkosti dětské dopravní hřiště pro výuku dětí?",
        "Chcete mít blízko bydliště přírodní park, rezervaci nebo chráněné území?",
        "Rádi nakupujete ve velkých supermarketech a plnosortimentních prodejnách, které chcete mít co nejblíže?",
        "Navštěvujete rádi divadla či filharmonie a chcete je mít blízko?",
        "Přáli byste si bydlet poblíž botanické zahrady nebo arboreta?",
        "Chcete mít v okolí aquapark, koupaliště nebo plavecký bazén?",
        "Jsou pro vás důležité domovy dětí a mládeže nebo střediska volného času pro kroužky?",
        "Je pro vás výhodné mít nedaleko sběrný dvůr nebo velkoobjemové kontejnery na odpad?",
        "Zajímá vás agroturistika (farmy, statky, jízda na koni) a chcete ji mít v okolí?",
        "Je pro vás důležité mít poblíž lanové nebo zábavní centrum pro rodinné výlety?",
        "Potřebujete mít v dojezdové vzdálenosti střední nebo vysokou školu?",
        "Preferujete bydlení mimo oblasti s vysokým rizikem větrné eroze (např. velké otevřené lány)?",
        "Zajímají vás hornické či technické památky ve vašem regionu?",
        "Vyhýbáte se rádi bydlení v blízkosti věznice?",
        "Je pro vás důležité mít v blízkosti kina nebo kinosály?",
        "Oceníte blízkost velkých sportovišť (např. zimní stadiony, sportovní haly)?",
        "Je pro vás atraktivní mít blízko památky zapsané na seznamu UNESCO?",
        "Láká vás blízkost hudebních klubů nebo areálů pro festivaly?",
        "Oceníte v okolí hustou síť naučných stezek pro procházky?",
        "Jste častými návštěvníky muzeí a galerií?",
        "Je pro vás důležité mít poblíž ordinaci zubního lékaře?",
        "Chcete bydlet v blízkosti hradů, zámků nebo archeologických památek?",
        "Zajímá vás dostupnost domovů pro seniory nebo pečovatelských služeb ve vašem okolí?",
        "Zajímají vás lokální trhy a dostupnost certifikovaných regionálních produktů?",
        "Chcete mít v docházkové vzdálenosti ordinaci praktického lékaře nebo pediatra?",
        "Chtěli byste bydlet blízko lázeňského města nebo lázní?",
        "Oceníte, pokud je v obci dostupná pošta?",
        "Vyhledáváte blízkost lyžařských areálů, vleků nebo běžkařských tras?",
        "Preferujete bydlení v místě, kde není zaveden systém placených parkovacích zón?",
        "Jezdíte na kole a požadujete v okolí hustou síť cyklostezek a cyklotras?"
    ];
    const en = [
        "Do you prefer living in a city rather than a village?",
        "Is it an absolute priority for you to live outside flood-prone areas (outside floodplains)?",
        "Do you need public transport stops (public transit, bus, or train) within a short walking distance?",
        "Is it important for you to have a hospital or medical emergency within 10 km of your residence?",
        "Do you have children (or plan to) and need a kindergarten or elementary school nearby?",
        "Are you bothered by high noise pollution (e.g., living near main roads, railways, or airports)?",
        "Is it crucial for you not to have large industrial zones or factories in your vicinity?",
        "Do you require a location with reliable, high-speed internet access?",
        "Do you want to live somewhere with good transport access to the nearest regional capital (e.g., within 30 minutes)?",
        "Is it important for you to live in an area with clean air (outside zones with a high concentration of pollutants)?",
        "Do you enjoy visiting zoos or zooparks and want them within reasonable driving distance?",
        "Do you need an easily accessible pharmacy nearby?",
        "Do you want a public library within walking distance?",
        "Would you appreciate having an airport within driving distance?",
        "Are you attracted to living very close to a historical center or a municipal conservation area?",
        "Do you prefer areas with low unemployment and a good supply of jobs?",
        "Do you play golf and appreciate the proximity of a golf course?",
        "Would you like an educational-psychological counseling center nearby?",
        "Is it important to avoid areas globally exposed to heatwaves in summer (lack of greenery and water)?",
        "Are you a beer lover and would appreciate local breweries nearby?",
        "Would you appreciate a children's traffic park nearby for teaching children?",
        "Do you want to live near a nature park, reserve, or protected area?",
        "Do you like shopping in large supermarkets and want them as close as possible?",
        "Do you enjoy theaters or philharmonic halls and want them near?",
        "Would you like to live near a botanical garden or arboretum?",
        "Do you want an aquapark, public swimming pool, or swimming pool in the area?",
        "Are children's and youth centers or leisure facilities important to you?",
        "Is it convenient for you to have a recycling center or large-capacity waste containers nearby?",
        "Are you interested in agrotourism (farms, horseback riding) and want it nearby?",
        "Is it important to have a rope park or amusement center for family trips nearby?",
        "Do you need a high school or university within driving distance?",
        "Do you prefer living outside areas with a high risk of wind erosion (e.g., large open fields)?",
        "Are you interested in mining or industrial monuments in your region?",
        "Do you prefer avoiding living near a prison?",
        "Is it important for you to have a cinema or movie theaters nearby?",
        "Do you appreciate the proximity of large sports facilities (e.g., winter stadiums, sports halls)?",
        "Is it attractive to have UNESCO world heritage sites nearby?",
        "Are you attracted to the proximity of music clubs or festival grounds?",
        "Do you appreciate a dense network of educational trails for walking in the area?",
        "Are you a frequent visitor to museums and galleries?",
        "Is it important for you to have a dentist's office nearby?",
        "Do you want to live near castles, chateaus, or archaeological monuments?",
        "Are you interested in the availability of retirement homes or care services in your area?",
        "Are you interested in local markets and the availability of certified regional products?",
        "Do you want a general practitioner's or pediatrician's office within walking distance?",
        "Would you like to live near a spa town or spa center?",
        "Do you appreciate it if a post office is accessible in the municipality?",
        "Are you looking for the proximity of ski resorts, lifts, or cross-country trails?",
        "Do you prefer living where there is no paid parking zone system?",
        "Do you cycle and require a dense network of cycle paths and cycle routes nearby?"
    ];

    return Array.from({ length: 50 }, (_, i) => {
        if (lang === 'cs') {
            return cs[i] || `Doplňující otázka k vašim preferencím č. ${(i + 1)}`;
        } else {
            return en[i] || `Additional preference question number ${(i + 1)}`;
        }
    });
};

export function QuestionnairePanel({ isOpen, onClose, isCollapsed, setIsCollapsed }: QuestionnairePanelProps) {
    const { language } = useLanguage();
    const [mode, setMode] = useState<'intro' | 'questionnaire'>('intro');
    const [answers, setAnswers] = useState<Record<number, boolean>>({});

    const { user, updateUser } = useAuth();

    const questions = getQuestions(language as 'cs' | 'en');
    const stepperRef = useRef<any>(null);
    const completedSteps = Object.keys(answers).map(key => parseInt(key, 10) + 1);

    const handleAnswer = (index: number, answer: boolean) => {
        setAnswers(prev => ({ ...prev, [index]: answer }));
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

        setMode('intro');
        setAnswers({});
        onClose();
    };

    const handleSkip = () => {
        setMode('intro');
        onClose();
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
        >
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col relative z-10">
                {mode === 'intro' ? (
                    <div className="flex flex-col h-full">
                        <p className="text-sm md:text-md opacity-80 mb-6 leading-relaxed font-medium">
                            {language === 'cs'
                                ? 'Chcete-li personalizovat výsledky a mapové podklady přímo na míru vašemu životnímu stylu, vyplňte náš dotazník. Celkem máme 50 otázek, ale pro základní doporučení stačí odpovědět na prvních 10.'
                                : 'To personalize results and map layouts specifically to your lifestyle, please fill out our survey. We have 50 questions in total, but answering the first 10 is enough for basic recommendations.'}
                        </p>

                        <div className="flex flex-col gap-3 mt-auto pt-4 text-sm w-full">
                            <button
                                onClick={() => setMode('questionnaire')}
                                className="w-full cursor-pointer text-center px-4 py-3 rounded-full bg-[#3388ff] hover:bg-[#2563eb] text-white font-medium transition-transform transform-gpu duration-300 active:translate-y-px shadow-lg border border-white/10 dark:border-black/10 backdrop-blur-md"
                            >
                                {language === 'cs' ? 'Začít dotazník' : 'Start questionnaire'}
                            </button>

                            <button
                                onClick={handleSkip}
                                className="w-full cursor-pointer text-center px-4 py-3 mb-4 rounded-full bg-[#1a1a1a] dark:bg-[#ececeb] hover:bg-[#262626] dark:hover:bg-[#dcdcdc] font-medium transition-transform transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md"
                            >
                                {language === 'cs' ? 'Nedělat a jen prohlížet' : 'Skip and just view'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full w-full">
                        {/* @ts-ignore */}
                        <Stepper
                            ref={stepperRef}
                            initialStep={1}
                            completedSteps={completedSteps}
                            className="!h-full !flex-1 flex flex-col"
                            onStepChange={(step: number) => console.log(step)}
                            onFinalStepCompleted={handleFinish}
                            stepCircleContainerClassName="!max-w-full !w-full !h-full flex flex-col flex-1 bg-transparent !shadow-none border-none border-0 m-0 !bg-transparent rounded-none"
                            stepContainerClassName="!px-0 !py-2 shrink-0 border-b border-white/10 dark:border-black/10 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]"
                            contentClassName="!flex-1 !h-full !min-h-0 !overflow-y-auto overflow-x-hidden w-full px-0 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent [height:100%!important]"
                            renderFooter={({ currentStep, handleBack, handleNext, isLastStep }: any) => (
                                <div className="shrink-0 border-t border-white/10 dark:border-black/10 py-4 flex items-center justify-between gap-2 text-xs">
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
                                            onClick={currentStep >= 10 ? handleFinish : undefined}
                                            className={`group relative overflow-hidden px-2 py-2.5 rounded-full font-bold transition-all transform-gpu duration-300 border backdrop-blur-md flex items-center justify-center w-full max-w-[120px] ${currentStep >= 10 ? 'bg-white hover:bg-gray-100 text-black dark:bg-[#0b0b0b] dark:text-white dark:hover:bg-[#1a1a1a] border border-transparent dark:border-black/10 active:translate-y-px shadow-md cursor-pointer' : 'bg-[#1a1a1a] dark:bg-[#ececeb] border-white/10 dark:border-black/10 text-white dark:text-black cursor-default opacity-80'}`}
                                        >
                                            {currentStep >= 10 ? (
                                                <span>{language === 'cs' ? 'Vyhodnotit' : 'Evaluate'}</span>
                                            ) : (
                                                <>
                                                    <span className="group-hover:opacity-0 transition-opacity">{language === 'cs' ? 'Vyhodnotit' : 'Eval'}</span>
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] mr-1 opacity-80">{language === 'cs' ? 'Zbývá' : 'Left'}:</span>
                                                        <span className="font-black mr-1">{10 - currentStep}</span>
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
                            )}
                        >
                            {questions.map((question, index) => (
                                <Step key={index}>
                                    <div className="flex flex-col items-center text-center h-full min-h-full max-w-sm mx-auto pt-2 pb-6 overflow-y-auto w-full">
                                        <div className="inline-block px-3 py-1.5 rounded-full bg-[#3388ff]/10 text-[#3388ff] text-[10px] font-bold mb-4 border border-[#3388ff]/20 shrink-0">
                                            {language === 'cs' ? 'Otázka' : 'Question'} {index + 1} / 50
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
                                                onClick={() => handleAnswer(index, true)}
                                                className={`cursor-pointer group py-3 px-4 rounded-full transition-all transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md ${answers[index] === true ? 'bg-[#3388ff] text-white border-transparent' : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc]'}`}
                                            >
                                                <span className={`transition-transform inline-block ${answers[index] === true ? 'scale-105' : 'group-hover:scale-105'}`}>
                                                    {language === 'cs' ? 'Ano' : 'Yes'}
                                                </span>
                                            </button>

                                            <button
                                                onClick={() => handleAnswer(index, false)}
                                                className={`cursor-pointer group py-3 px-4 rounded-full transition-all transform-gpu duration-300 active:translate-y-px border border-white/10 dark:border-black/10 backdrop-blur-md ${answers[index] === false ? 'bg-[#3388ff] text-white border-transparent' : 'bg-[#1a1a1a] dark:bg-[#ececeb] text-white dark:text-black hover:bg-[#262626] dark:hover:bg-[#dcdcdc]'}`}
                                            >
                                                <span className={`transition-transform inline-block ${answers[index] === false ? 'scale-105' : 'group-hover:scale-105'}`}>
                                                    {language === 'cs' ? 'Ne' : 'No'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </Step>
                            ))}
                        </Stepper>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
