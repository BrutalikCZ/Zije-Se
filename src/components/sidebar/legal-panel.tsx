import React from "react";
import { Shield, FileText, Lock, MessageSquare } from "lucide-react";
import { SidebarLayout } from "./sidebar-layout";
import { useLanguage } from "@/components/providers/language-provider";

export type LegalPanelType = "gdpr" | "terms" | "privacy" | "contact";

interface LegalPanelProps {
    isOpen: boolean;
    onClose: () => void;
    type: LegalPanelType | null;
}

export function LegalPanel({ isOpen, onClose, type }: LegalPanelProps) {
    const { language } = useLanguage();

    if (!type) return null;

    const getConfig = () => {
        switch (type) {
            case "gdpr":
                return {
                    icon: <Shield size={24} />,
                    titleCs: "GDPR",
                    titleEn: "GDPR",
                    contentCs: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Tento dokument shrnuje naše zásady zpracování osobních údajů v souladu s nařízením GDPR.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Jaké údaje sbíráme</h3>
                            <p>Sbíráme pouze ty údaje, které jsou nezbytné pro fungování naší aplikace a poskytování našich služeb. Mezi tyto údaje patří e-mailová adresa, jméno a informace zadané do chatu s AI.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Vaše práva</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Právo na přístup k údajům</li>
                                <li>Právo na opravu nepřesných údajů</li>
                                <li>Právo na výmaz ("právo být zapomenut")</li>
                                <li>Právo na přenositelnost údajů</li>
                            </ul>
                        </div>
                    ),
                    contentEn: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>This document summarizes our personal data processing policy in accordance with the GDPR regulation.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">What data we collect</h3>
                            <p>We collect only the data necessary for the operation of our application and the provision of our services. This data includes email address, name, and information entered in the AI chat.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Your rights</h3>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Right of access to data</li>
                                <li>Right to rectification of inaccurate data</li>
                                <li>Right to erasure ("right to be forgotten")</li>
                                <li>Right to data portability</li>
                            </ul>
                        </div>
                    )
                };
            case "terms":
                return {
                    icon: <FileText size={24} />,
                    titleCs: "Podmínky použití",
                    titleEn: "Terms of Service",
                    contentCs: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Používáním naší aplikace souhlasíte s následujícími podmínkami.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Uživatelský účet</h3>
                            <p>Jste zodpovědní za udržování důvěrnosti svého hesla a za všechny aktivity, ke kterým dojde pod vaším účtem.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Omezení odpovědnosti</h3>
                            <p>Informace poskytované naší AI a na mapě mají pouze informativní charakter. Neneseme odpovědnost za jakákoli rozhodnutí učiněná na jejich základě.</p>
                        </div>
                    ),
                    contentEn: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>By using our application, you agree to the following terms and conditions.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">User Account</h3>
                            <p>You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Limitation of Liability</h3>
                            <p>The information provided by our AI and on the map is for informational purposes only. We are not liable for any decisions made based on it.</p>
                        </div>
                    )
                };
            case "privacy":
                return {
                    icon: <Lock size={24} />,
                    titleCs: "Ochrana soukromí",
                    titleEn: "Privacy Policy",
                    contentCs: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Vaše soukromí je pro nás důležité. Zde se dozvíte, jak chráníme vaše data.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Zabezpečení</h3>
                            <p>Používáme šifrování a bezpečné servery k ochraně vašich osobních údajů před neoprávněným přístupem.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Sdílení dat</h3>
                            <p>Vaše data neprodáváme ani nesdílíme se třetími stranami pro marketingové účely. Data mohou být sdílena pouze s našimi poskytovateli služeb v nezbytném rozsahu.</p>
                        </div>
                    ),
                    contentEn: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Your privacy is important to us. Here you will learn how we protect your data.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Security</h3>
                            <p>We use encryption and secure servers to protect your personal information from unauthorized access.</p>
                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Data Sharing</h3>
                            <p>We do not sell or share your data with third parties for marketing purposes. Data may only be shared with our service providers to the extent necessary.</p>
                        </div>
                    )
                };
            case "contact":
                return {
                    icon: <MessageSquare size={24} />,
                    titleCs: "Kontaktujte nás",
                    titleEn: "Contact Us",
                    contentCs: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Máte dotaz nebo potřebujete pomoci? Neváhejte se na nás obrátit.</p>

                            <div className="bg-[#1a1a1a] dark:bg-white p-6 rounded-2xl border border-white/10 dark:border-black/10 mt-6 text-center">
                                <MailIcon className="w-8 h-8 text-[#3388ff] mx-auto mb-4" />
                                <h4 className="font-bold text-white dark:text-black text-base mb-1">E-mail</h4>
                                <a href="mailto:podpora@zijese.cz" className="text-[#3388ff] hover:underline font-medium">podpora@zijese.cz</a>
                            </div>

                            <div className="bg-[#1a1a1a] dark:bg-white p-6 rounded-2xl border border-white/10 dark:border-black/10 mt-4 text-center">
                                <BuildingIcon className="w-8 h-8 text-[#3388ff] mx-auto mb-4" />
                                <h4 className="font-bold text-white dark:text-black text-base mb-1">Sídlo</h4>
                                <p className="text-gray-400 dark:text-gray-500">Václavské náměstí 1<br />110 00 Praha 1<br />Česká republika</p>
                            </div>
                        </div>
                    ),
                    contentEn: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Have a question or need help? Do not hesitate to contact us.</p>

                            <div className="bg-[#1a1a1a] dark:bg-white p-6 rounded-2xl border border-white/10 dark:border-black/10 mt-6 text-center">
                                <MailIcon className="w-8 h-8 text-[#3388ff] mx-auto mb-4" />
                                <h4 className="font-bold text-white dark:text-black text-base mb-1">Email</h4>
                                <a href="mailto:support@zijese.cz" className="text-[#3388ff] hover:underline font-medium">support@zijese.cz</a>
                            </div>

                            <div className="bg-[#1a1a1a] dark:bg-white p-6 rounded-2xl border border-white/10 dark:border-black/10 mt-4 text-center">
                                <BuildingIcon className="w-8 h-8 text-[#3388ff] mx-auto mb-4" />
                                <h4 className="font-bold text-white dark:text-black text-base mb-1">Headquarters</h4>
                                <p className="text-gray-400 dark:text-gray-500">Wenceslas Square 1<br />110 00 Prague 1<br />Czech Republic</p>
                            </div>
                        </div>
                    )
                };
        }
    };

    const config = getConfig();

    return (
        <SidebarLayout
            isOpen={isOpen}
            onClose={onClose}
            isCollapsed={false}
            setIsCollapsed={() => { }}
            zIndex={50}
            collapsedIcon={config.icon}
            collapsedIconTitle={language === 'cs' ? config.titleCs : config.titleEn}
            showAuthSection={false}
            hideCollapseButton={true}
            showCloseIcon={true}
            hideBackButton={true}
        >
            <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2 relative z-10 w-full pb-20" data-lenis-prevent>
                <div className="text-center shrink-0 mb-6 mt-4">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white dark:text-black mb-2">
                        {language === 'cs' ? config.titleCs : config.titleEn}
                    </h1>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 px-2">
                        {language === 'cs' ? 'Informační dokumenty k provozu a podmínkám aplikace' : 'Information documents regarding app operation and terms'}
                    </p>
                    <div className="h-px w-full bg-white/10 dark:bg-black/10"></div>
                </div>

                <div className="flex-1">
                    {language === 'cs' ? config.contentCs : config.contentEn}
                </div>
            </div>
        </SidebarLayout>
    );
}

// Helper icons for Contact panel
const MailIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
)

const BuildingIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M12 6h.01" />
        <path d="M12 10h.01" />
        <path d="M12 14h.01" />
        <path d="M16 10h.01" />
        <path d="M16 14h.01" />
        <path d="M8 10h.01" />
        <path d="M8 14h.01" />
    </svg>
)
