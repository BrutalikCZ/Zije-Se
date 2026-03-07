import React from "react";
import { Shield, FileText, Lock, MessageSquare, BookOpen } from "lucide-react";
import { SidebarLayout } from "./sidebar-layout";
import { useLanguage } from "@/components/providers/language-provider";

export type LegalPanelType = "gdpr" | "terms" | "privacy" | "contact" | "attribution";

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
                            <p>Zásady zpracování osobních údajů dle Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR) a zákona č. 110/2019 Sb., o zpracování osobních údajů.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Správce osobních údajů</h3>
                            <p>Správcem osobních údajů je společnost provozující aplikaci ZIJE!SE se sídlem Václavské náměstí 1, 110 00 Praha 1, Česká republika. Kontakt: <span className="text-[#3388ff]">podpora@zijese.cz</span></p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Jaké osobní údaje zpracováváme</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Registrační údaje:</span> jméno a e-mailová adresa při vytvoření účtu</li>
                                <li><span className="text-white/80 dark:text-black/80">Údaje z chatu s AI:</span> obsah zpráv, které zadáváte do AI asistenta</li>
                                <li><span className="text-white/80 dark:text-black/80">Poloha:</span> souřadnice GPS, pokud udělíte souhlas v prohlížeči (zpracovává se pouze v rámci relace, neukládá se)</li>
                                <li><span className="text-white/80 dark:text-black/80">Technické údaje:</span> IP adresa, typ prohlížeče a záznamy o přístupu pro účely zabezpečení a diagnostiky</li>
                                <li><span className="text-white/80 dark:text-black/80">Dotazník:</span> odpovědi na otázky o preferencích bydlení (anonymizovány, nejsou vázány na identitu)</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Účel a právní základ zpracování</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Poskytování služby a správa uživatelského účtu — <span className="opacity-70">čl. 6 odst. 1 písm. b) GDPR (plnění smlouvy)</span></li>
                                <li>Zodpovídání dotazů a podpora — <span className="opacity-70">čl. 6 odst. 1 písm. b) GDPR</span></li>
                                <li>Zabezpečení a prevence podvodů — <span className="opacity-70">čl. 6 odst. 1 písm. f) GDPR (oprávněný zájem)</span></li>
                                <li>Zlepšování kvality služby — <span className="opacity-70">čl. 6 odst. 1 písm. f) GDPR (oprávněný zájem)</span></li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Doba uchovávání</h3>
                            <p>Osobní údaje uchováváme po dobu existence vašeho účtu a ještě 3 roky po jeho zrušení, pokud právní předpisy nevyžadují delší dobu. Záznamy z AI chatu jsou uchovávány maximálně 12 měsíců.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Příjemci údajů</h3>
                            <p>Vaše údaje sdílíme výhradně s níže uvedenými zpracovateli nezbytnými pro provoz služby. Tito zpracovatelé jsou smluvně vázáni ochranou vašich dat. Vaše osobní údaje neprodáváme třetím stranám.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Google LLC</span> — AI asistent (Gemini API) a vyhledávání míst (Places API); USA, dle standardních smluvních doložek</li>
                                <li><span className="text-white/80 dark:text-black/80">Supabase Inc.</span> — databáze a autentizace; EU (AWS eu-central-1)</li>
                                <li><span className="text-white/80 dark:text-black/80">Vercel Inc.</span> — hosting a CDN; USA/EU, dle standardních smluvních doložek</li>
                                <li><span className="text-white/80 dark:text-black/80">OpenStreetMap Foundation</span> — geokódování a mapové dotazy (Nominatim, Overpass); EU/UK; odesílány pouze souřadnice a hledané výrazy</li>
                                <li><span className="text-white/80 dark:text-black/80">DuckDuckGo</span> — webové vyhledávání AI asistenta; neukládá IP adresy ani osobní profily</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Vaše práva</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Přístup</span> — právo získat potvrzení, zda zpracováváme vaše údaje, a kopii těchto údajů</li>
                                <li><span className="text-white/80 dark:text-black/80">Oprava</span> — právo na opravu nepřesných nebo doplnění neúplných údajů</li>
                                <li><span className="text-white/80 dark:text-black/80">Výmaz</span> — právo na smazání osobních údajů („právo být zapomenut"), pokud nejsou důvody pro jejich další zpracování</li>
                                <li><span className="text-white/80 dark:text-black/80">Omezení zpracování</span> — právo požadovat omezení zpracování ve stanovených případech</li>
                                <li><span className="text-white/80 dark:text-black/80">Přenositelnost</span> — právo obdržet údaje ve strukturovaném, strojově čitelném formátu</li>
                                <li><span className="text-white/80 dark:text-black/80">Námitka</span> — právo vznést námitku proti zpracování na základě oprávněného zájmu</li>
                                <li><span className="text-white/80 dark:text-black/80">Odvolání souhlasu</span> — kdykoli a bez uvedení důvodu, kde je souhlas právním základem</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Uplatnění práv a stížnosti</h3>
                            <p>Žádosti zasílejte na <span className="text-[#3388ff]">podpora@zijese.cz</span>. Odpovíme nejpozději do 30 dnů. Máte také právo podat stížnost u dozorového orgánu — Úřadu pro ochranu osobních údajů (ÚOOÚ), Pplk. Sochora 27, 170 00 Praha 7, <span className="text-[#3388ff]">uoou.cz</span>.</p>

                            <p className="text-xs opacity-40 mt-4">Platné od: 1. 1. 2025. Správce si vyhrazuje právo tyto zásady aktualizovat; o změnách budete informováni e-mailem.</p>
                        </div>
                    ),
                    contentEn: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Personal data processing policy under Regulation (EU) 2016/679 (GDPR) and Czech Act No. 110/2019 Coll. on personal data processing.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Data Controller</h3>
                            <p>The data controller is the company operating the ZIJE!SE application, registered at Václavské náměstí 1, 110 00 Prague 1, Czech Republic. Contact: <span className="text-[#3388ff]">support@zijese.cz</span></p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">What personal data we process</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Registration data:</span> name and email address when creating an account</li>
                                <li><span className="text-white/80 dark:text-black/80">AI chat data:</span> content of messages you enter into the AI assistant</li>
                                <li><span className="text-white/80 dark:text-black/80">Location:</span> GPS coordinates if you grant browser permission (processed within the session only, not stored)</li>
                                <li><span className="text-white/80 dark:text-black/80">Technical data:</span> IP address, browser type and access logs for security and diagnostics</li>
                                <li><span className="text-white/80 dark:text-black/80">Questionnaire:</span> answers to housing preference questions (anonymised, not linked to identity)</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Purpose and legal basis</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Providing the service and managing your account — <span className="opacity-70">Art. 6(1)(b) GDPR (performance of contract)</span></li>
                                <li>Answering queries and support — <span className="opacity-70">Art. 6(1)(b) GDPR</span></li>
                                <li>Security and fraud prevention — <span className="opacity-70">Art. 6(1)(f) GDPR (legitimate interest)</span></li>
                                <li>Service quality improvement — <span className="opacity-70">Art. 6(1)(f) GDPR (legitimate interest)</span></li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Retention period</h3>
                            <p>Personal data is retained for the duration of your account and 3 years after its deletion, unless longer retention is required by law. AI chat logs are retained for a maximum of 12 months.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Recipients of data</h3>
                            <p>We share your data exclusively with the processors listed below, who are necessary for operating the service and contractually bound to data protection. We do not sell your personal data to third parties.</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Google LLC</span> — AI assistant (Gemini API) and place search (Places API); USA, under standard contractual clauses</li>
                                <li><span className="text-white/80 dark:text-black/80">Supabase Inc.</span> — database and authentication; EU (AWS eu-central-1)</li>
                                <li><span className="text-white/80 dark:text-black/80">Vercel Inc.</span> — hosting and CDN; USA/EU, under standard contractual clauses</li>
                                <li><span className="text-white/80 dark:text-black/80">OpenStreetMap Foundation</span> — geocoding and map queries (Nominatim, Overpass); EU/UK; only coordinates and search terms are sent</li>
                                <li><span className="text-white/80 dark:text-black/80">DuckDuckGo</span> — web search for AI assistant; does not store IP addresses or personal profiles</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Your rights</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Access</span> — right to obtain confirmation of whether we process your data and a copy thereof</li>
                                <li><span className="text-white/80 dark:text-black/80">Rectification</span> — right to correct inaccurate or complete incomplete data</li>
                                <li><span className="text-white/80 dark:text-black/80">Erasure</span> — right to have personal data deleted ("right to be forgotten") where there is no reason for further processing</li>
                                <li><span className="text-white/80 dark:text-black/80">Restriction</span> — right to request restriction of processing in specified cases</li>
                                <li><span className="text-white/80 dark:text-black/80">Portability</span> — right to receive data in a structured, machine-readable format</li>
                                <li><span className="text-white/80 dark:text-black/80">Objection</span> — right to object to processing based on legitimate interest</li>
                                <li><span className="text-white/80 dark:text-black/80">Withdrawal of consent</span> — at any time and without reason where consent is the legal basis</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Exercising rights and complaints</h3>
                            <p>Send requests to <span className="text-[#3388ff]">support@zijese.cz</span>. We will respond within 30 days. You also have the right to lodge a complaint with the Czech supervisory authority — Office for Personal Data Protection (ÚOOÚ), Pplk. Sochora 27, 170 00 Prague 7, <span className="text-[#3388ff]">uoou.cz</span>.</p>

                            <p className="text-xs opacity-40 mt-4">Effective from: 1 January 2025. The controller reserves the right to update this policy; you will be notified of changes by email.</p>
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
                            <p>Tyto podmínky použití upravují přístup a používání aplikace ZIJE!SE. Používáním aplikace vyjadřujete souhlas s těmito podmínkami.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">1. Popis služby</h3>
                            <p>ZIJE!SE je webová mapová aplikace poskytující přístup k veřejným geografickým datům a AI asistentovi pro pomoc při výběru místa k bydlení. Obsah aplikace má výhradně informativní charakter.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">2. Uživatelský účet</h3>
                            <p>Registrací souhlasíte s poskytnutím pravdivých a aktuálních údajů. Jste zodpovědní za důvěrnost svého hesla a za veškerou aktivitu provedenou pod vaším účtem. Přístupové údaje nesdílejte s třetími osobami. Zjistíte-li neoprávněné použití účtu, okamžitě nás informujte na <span className="text-[#3388ff]">podpora@zijese.cz</span>.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">3. Přijatelné používání</h3>
                            <p>Zavazujete se, že nebudete:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Používat aplikaci k nezákonným účelům nebo v rozporu s těmito podmínkami</li>
                                <li>Automaticky stahovat data bez našeho výslovného souhlasu (scraping)</li>
                                <li>Pokoušet se narušit zabezpečení nebo dostupnost aplikace</li>
                                <li>Vydávat se za jinou osobu nebo organizaci</li>
                                <li>Šířit skrze aplikaci škodlivý obsah nebo malware</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">4. Duševní vlastnictví</h3>
                            <p>Aplikace, její design a vlastní obsah jsou chráněny autorským právem a dalšími právy duševního vlastnictví. Data třetích stran (mapy, geodata) podléhají licencím příslušných poskytovatelů — viz sekce Zdroje dat.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">5. AI asistent</h3>
                            <p>Odpovědi AI asistenta jsou generovány automaticky a mohou obsahovat nepřesnosti. Neslouží jako odborné poradenství (právní, finanční, realitní). Před rozhodnutím o bydlení doporučujeme ověřit informace z dalších zdrojů.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">6. Dostupnost a změny</h3>
                            <p>Službu poskytujeme bez záruky nepřetržité dostupnosti. Vyhrazujeme si právo kdykoli upravit, omezit nebo ukončit provoz aplikace či její části. O zásadních změnách vás budeme informovat.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">7. Omezení odpovědnosti</h3>
                            <p>Aplikaci poskytujeme „tak jak je". Neodpovídáme za přesnost, úplnost ani aktuálnost zobrazených dat. Naše odpovědnost za škody vzniklé použitím aplikace je v rozsahu povoleném zákonem vyloučena.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">8. Rozhodné právo</h3>
                            <p>Tyto podmínky se řídí právním řádem České republiky. Veškeré spory budou řešeny před příslušnými českými soudy.</p>

                            <p className="text-xs opacity-40 mt-4">Verze: 1.0 — platné od 1. 1. 2025</p>
                        </div>
                    ),
                    contentEn: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>These Terms of Service govern access to and use of the ZIJE!SE application. By using the application, you agree to these terms.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">1. Service Description</h3>
                            <p>ZIJE!SE is a web mapping application providing access to public geographic data and an AI assistant to help with choosing a place to live. All content is for informational purposes only.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">2. User Account</h3>
                            <p>By registering, you agree to provide truthful and current information. You are responsible for the confidentiality of your password and all activity carried out under your account. Do not share your credentials with third parties. If you discover unauthorised use of your account, notify us immediately at <span className="text-[#3388ff]">support@zijese.cz</span>.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">3. Acceptable Use</h3>
                            <p>You agree not to:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Use the application for unlawful purposes or in violation of these terms</li>
                                <li>Automatically download data without our express consent (scraping)</li>
                                <li>Attempt to compromise the security or availability of the application</li>
                                <li>Impersonate another person or organisation</li>
                                <li>Distribute harmful content or malware through the application</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">4. Intellectual Property</h3>
                            <p>The application, its design and original content are protected by copyright and other intellectual property rights. Third-party data (maps, geodata) is subject to the licences of the respective providers — see the Data Sources section.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">5. AI Assistant</h3>
                            <p>AI assistant responses are generated automatically and may contain inaccuracies. They do not constitute professional advice (legal, financial, real estate). We recommend verifying information from additional sources before making any housing decision.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">6. Availability and Changes</h3>
                            <p>We provide the service without a guarantee of uninterrupted availability. We reserve the right to modify, restrict or discontinue the application or any part thereof at any time. We will notify you of significant changes.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">7. Limitation of Liability</h3>
                            <p>The application is provided "as is". We are not responsible for the accuracy, completeness or currency of displayed data. Our liability for damages arising from use of the application is excluded to the extent permitted by law.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">8. Governing Law</h3>
                            <p>These terms are governed by the laws of the Czech Republic. Any disputes shall be resolved before the competent Czech courts.</p>

                            <p className="text-xs opacity-40 mt-4">Version: 1.0 — effective from 1 January 2025</p>
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
                            <p>Tento dokument podrobně popisuje, jaká data v aplikaci ZIJE!SE shromažďujeme, jak je používáme a jak je chráníme.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">1. Data, která shromažďujeme</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Účet:</span> jméno, e-mailová adresa, hashované heslo</li>
                                <li><span className="text-white/80 dark:text-black/80">AI chat:</span> text vašich zpráv odesílaných AI asistentovi</li>
                                <li><span className="text-white/80 dark:text-black/80">Poloha:</span> souřadnice GPS, pokud dáte souhlas — zpracovávány pouze v rámci relace, neukládány na server</li>
                                <li><span className="text-white/80 dark:text-black/80">Dotazník:</span> vaše preference bydlení — ukládány anonymně bez vazby na identitu</li>
                                <li><span className="text-white/80 dark:text-black/80">Technické:</span> IP adresa, HTTP hlavičky, logy přístupu — pro diagnostiku a ochranu před zneužitím</li>
                                <li><span className="text-white/80 dark:text-black/80">Cookies:</span> relační cookie pro přihlášení; nepoužíváme sledovací ani reklamní cookies</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">2. Jak data používáme</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Poskytování a zlepšování funkcí aplikace</li>
                                <li>Zpracování dotazů AI asistenta a vrácení odpovědí</li>
                                <li>Správa uživatelského účtu a autentizace</li>
                                <li>Zabezpečení a detekce podvodů</li>
                                <li>Technická podpora a komunikace s uživatelem</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">3. Sdílení s třetími stranami</h3>
                            <p>Vaše data neprodáváme. Pro provoz aplikace využíváme níže uvedené zpracovatele, kteří jsou smluvně vázáni ochranou dat:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Google LLC (Gemini API)</span> — zpracování dotazů AI asistenta a hodnocení odpovědí; zprávy chatu jsou odesílány na servery Google v USA; Google se řídí EU standardními smluvními doložkami</li>
                                <li><span className="text-white/80 dark:text-black/80">Google LLC (Places API)</span> — vyhledávání míst a bodů zájmu; odesílány jsou hledané výrazy a zeměpisné souřadnice; zpracování probíhá v USA dle standardních smluvních doložek</li>
                                <li><span className="text-white/80 dark:text-black/80">OpenStreetMap Foundation (Nominatim, Overpass API)</span> — geokódování adres a dotazy na prvky mapy; odesílány jsou pouze hledané výrazy a souřadnice, žádné osobní údaje; zpracování v EU/UK</li>
                                <li><span className="text-white/80 dark:text-black/80">DuckDuckGo</span> — webové vyhledávání využívané AI asistentem; odesílány jsou hledané dotazy; DuckDuckGo neukládá IP adresy ani osobní profily</li>
                                <li><span className="text-white/80 dark:text-black/80">Supabase Inc.</span> — databáze a autentizace; uživatelské účty a hesla uložena v EU (AWS eu-central-1); Supabase dodržuje GDPR</li>
                                <li><span className="text-white/80 dark:text-black/80">Vercel Inc.</span> — hosting a CDN; přístupové logy (IP, User-Agent) jsou zpracovávány v USA dle standardních smluvních doložek; data jsou automaticky anonymizována po 30 dnech</li>
                                <li><span className="text-white/80 dark:text-black/80">CARTO (CartoDB S.L.)</span> — podkladové mapové dlaždice; požadavky jsou anonymní (dlaždice neobsahují osobní data); zpracování v EU</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">4. Cookies</h3>
                            <p>Používáme pouze technicky nezbytné cookies (relační cookie pro přihlášení). Nepoužíváme analytické, marketingové ani sledovací cookies třetích stran.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">5. Přeshraniční přenos dat</h3>
                            <p>Data mohou být zpracovávána mimo EU (Google LLC, Vercel Inc., DuckDuckGo). Přenos probíhá na základě standardních smluvních doložek dle čl. 46 GDPR, jež zajišťují odpovídající úroveň ochrany.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">6. Zabezpečení</h3>
                            <p>Přenosy dat šifrujeme pomocí TLS. Hesla ukládáme výhradně jako hashované hodnoty (bcrypt). Přístup k datům je omezen pouze na oprávněné osoby.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">7. Vaše volby</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Přístup k poloze můžete kdykoli odvolat v nastavení prohlížeče</li>
                                <li>Účet a všechna přidružená data lze smazat na žádost zaslanou na <span className="text-[#3388ff]">podpora@zijese.cz</span></li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">8. Kontakt</h3>
                            <p>Pro dotazy k ochraně soukromí pište na <span className="text-[#3388ff]">podpora@zijese.cz</span>. Stížnosti můžete podat u ÚOOÚ (<span className="text-[#3388ff]">uoou.cz</span>).</p>

                            <p className="text-xs opacity-40 mt-4">Platné od: 1. 1. 2025</p>
                        </div>
                    ),
                    contentEn: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>This document describes in detail what data we collect in the ZIJE!SE application, how we use it and how we protect it.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">1. Data we collect</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Account:</span> name, email address, hashed password</li>
                                <li><span className="text-white/80 dark:text-black/80">AI chat:</span> text of messages you send to the AI assistant</li>
                                <li><span className="text-white/80 dark:text-black/80">Location:</span> GPS coordinates if you grant consent — processed within the session only, not stored on server</li>
                                <li><span className="text-white/80 dark:text-black/80">Questionnaire:</span> your housing preferences — stored anonymously without link to identity</li>
                                <li><span className="text-white/80 dark:text-black/80">Technical:</span> IP address, HTTP headers, access logs — for diagnostics and abuse prevention</li>
                                <li><span className="text-white/80 dark:text-black/80">Cookies:</span> session cookie for login; we do not use tracking or advertising cookies</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">2. How we use data</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Providing and improving application features</li>
                                <li>Processing AI assistant queries and returning responses</li>
                                <li>User account management and authentication</li>
                                <li>Security and fraud detection</li>
                                <li>Technical support and user communication</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">3. Sharing with third parties</h3>
                            <p>We do not sell your data. We use the following processors who are contractually bound to data protection:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="text-white/80 dark:text-black/80">Google LLC (Gemini API)</span> — AI assistant query processing and response evaluation; chat messages are sent to Google servers in the USA; Google adheres to EU standard contractual clauses</li>
                                <li><span className="text-white/80 dark:text-black/80">Google LLC (Places API)</span> — place and point-of-interest search; search terms and geographic coordinates are sent; processed in the USA under standard contractual clauses</li>
                                <li><span className="text-white/80 dark:text-black/80">OpenStreetMap Foundation (Nominatim, Overpass API)</span> — address geocoding and map feature queries; only search terms and coordinates are sent, no personal data; processed in the EU/UK</li>
                                <li><span className="text-white/80 dark:text-black/80">DuckDuckGo</span> — web search used by the AI assistant; search queries are sent; DuckDuckGo does not store IP addresses or personal profiles</li>
                                <li><span className="text-white/80 dark:text-black/80">Supabase Inc.</span> — database and authentication; user accounts and passwords stored in the EU (AWS eu-central-1); Supabase is GDPR-compliant</li>
                                <li><span className="text-white/80 dark:text-black/80">Vercel Inc.</span> — hosting and CDN; access logs (IP, User-Agent) processed in the USA under standard contractual clauses; data is automatically anonymised after 30 days</li>
                                <li><span className="text-white/80 dark:text-black/80">CARTO (CartoDB S.L.)</span> — basemap tile delivery; requests are anonymous (tiles contain no personal data); processed in the EU</li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">4. Cookies</h3>
                            <p>We use only technically necessary cookies (session cookie for login). We do not use third-party analytical, marketing or tracking cookies.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">5. Cross-border data transfer</h3>
                            <p>Data may be processed outside the EU (Google LLC, Vercel Inc., DuckDuckGo). Transfer takes place on the basis of standard contractual clauses under Art. 46 GDPR, which ensure an adequate level of protection.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">6. Security</h3>
                            <p>We encrypt data transfers using TLS. Passwords are stored exclusively as hashed values (bcrypt). Access to data is restricted to authorised persons only.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">7. Your choices</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Location access can be revoked at any time in your browser settings</li>
                                <li>Your account and all associated data can be deleted on request sent to <span className="text-[#3388ff]">support@zijese.cz</span></li>
                            </ul>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">8. Contact</h3>
                            <p>For privacy queries write to <span className="text-[#3388ff]">support@zijese.cz</span>. Complaints can be filed with ÚOOÚ (<span className="text-[#3388ff]">uoou.cz</span>).</p>

                            <p className="text-xs opacity-40 mt-4">Effective from: 1 January 2025</p>
                        </div>
                    )
                };
            case "attribution":
                return {
                    icon: <BookOpen size={24} />,
                    titleCs: "Zdroje dat",
                    titleEn: "Data Sources",
                    contentCs: (
                        <div className="space-y-5 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Aplikace využívá data z níže uvedených otevřených zdrojů. Ke každé licenci jsou uvedeny konkrétní datasety, které se pod ní nacházejí.</p>

                            {/* 1. CARTO */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-4 mb-2 text-xs uppercase tracking-widest opacity-60">Podkladová mapa — © CARTO, CC BY 3.0 + © OpenStreetMap contributors, ODbL</h3>
                                <p className="opacity-70 text-xs">Dlaždice světlé (Positron) a tmavé (Dark Matter) varianty mapy. Atribuce je zobrazována automaticky mapovou knihovnou MapLibre GL.</p>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 2. ČÚZK INSPIRE */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© ČÚZK — INSPIRE (EU direktiva 2007/2/EC — volné pro veškerá použití)</h3>
                                <p className="opacity-70 text-xs mb-2">Data povinně zpřístupněná dle evropské direktivy INSPIRE. Bez omezení komerčního použití.</p>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>INSPIRE – Zeměpisná jména (GN)</li>
                                    <li>INSPIRE – Územní správní jednotky (AU)</li>
                                    <li>INSPIRE – Adresy (AD)</li>
                                    <li>INSPIRE – Parcely (CP) a národní rozšíření (CPX)</li>
                                    <li>INSPIRE – Dopravní sítě: letecká, lanová, železniční, silniční, vodní (TN)</li>
                                    <li>INSPIRE – Vodstvo: fyzické vody (HY-P), sítě (HY-NET)</li>
                                    <li>INSPIRE – Využití území (LU)</li>
                                    <li>INSPIRE – Nadmořská výška TIN (EL-TIN)</li>
                                    <li>INSPIRE – Budovy (BU)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 3. ČÚZK komerční produkty */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© ČÚZK — licencované produkty (nekomerční použití zdarma; komerční vyžaduje licenční smlouvu s ČÚZK)</h3>
                                <p className="opacity-70 text-xs mb-2">Přístup probíhá přes veřejné WFS rozhraní ČÚZK. Data jsou streamována přímo ze serverů ČÚZK — nejsou stahována ani redistribuována. Podmínky: geoportal.cuzk.cz</p>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>ZABAGED® – polohopis</li>
                                    <li>ZABAGED® – vrstevnice</li>
                                    <li>DATA50</li>
                                    <li>DATA250</li>
                                    <li>GEONAMES (zeměpisná jména)</li>
                                    <li>Bodová pole (geodetické body)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 4. VÚV TGM */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© VÚV TGM — podmínky: vuv.cz</h3>
                                <p className="opacity-70 text-xs mb-2">Data z Informačního systému veřejné správy vodního hospodářství (ISVS). Přístup přes WFS.</p>
                                <ul className="opacity-70 text-xs list-disc pl-4">
                                    <li>Záplavová území (WFS vrstva)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 5. ČGS */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© Česká geologická služba (ČGS) — CC BY 4.0</h3>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>Chráněná ložisková území v České republice</li>
                                    <li>Chráněná území pro zvláštní zásahy do zemské kůry v ČR</li>
                                    <li>Důlní díla v České republice</li>
                                    <li>Inventarizace úložných míst těžebních odpadů v ČR</li>
                                    <li>Poddolovaná území v České republice</li>
                                    <li>Průzkumná území v České republice</li>
                                    <li>Svahové deformace v ČR – body, linie, plochy</li>
                                    <li>Významné geologické lokality v ČR – body, plochy</li>
                                    <li>Výhradní ložiska a schválené prognózní zdroje nerostných surovin v ČR</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 6. ČSÚ + ČÚZK RUIAN */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© Český statistický úřad (ČSÚ) — CC BY 4.0 · část dat © ČÚZK RÚIAN — CC BY 4.0</h3>
                                <p className="opacity-70 text-xs mb-2">Statistické geodatabáze a územní jednotky. Soubory Adresní místa a Budovy s č.p. pocházejí z registru RÚIAN spravovaného ČÚZK (zdroj v datech: &quot;RUIAN&quot;).</p>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>Geodatabáze SDE: statistiky bytů, demografie a vyjížďky na úrovni krajů, okresů a obcí (9 souborů)</li>
                                    <li>Grid bytů SLDB 2021</li>
                                    <li>Kraje NUTS 3, Území NUTS 1, Stát NUTS 0</li>
                                    <li>Základní územní jednotky, Základní sídelní jednotky, Části obce</li>
                                    <li>Katastrální území, Městské obvody a části, PSČ oblasti</li>
                                    <li>Správní obvody hl. m. Prahy</li>
                                    <li>Adresní místa <span className="italic">(zdroj: RÚIAN/ČSÚ)</span></li>
                                    <li>Budovy s číslem domovním <span className="italic">(zdroj: RÚIAN/ČÚZK)</span></li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 7. ČHMÚ */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© Český hydrometeorologický ústav (ČHMÚ) — CC BY 4.0</h3>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>Dílčí povodí</li>
                                    <li>Rozvodnice povodí 1. řádu</li>
                                    <li>Rozvodnice povodí 2. řádu</li>
                                    <li>Rozvodnice povodí 3. řádu</li>
                                    <li>Rozvodnice povodí 4. řádu (základní a rozšířené)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 8. AOPK */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© Agentura ochrany přírody a krajiny ČR (AOPK ČR) — CC BY 4.0</h3>
                                <p className="opacity-70 text-xs mb-2">Monitoring průchodnosti vodních toků – příčné překážky, úseky toků, mokřady.</p>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>Příčné překážky: hráze, jezy, přehrážky, skluzy, práhy, poldry a jiné (7 typů)</li>
                                    <li>Prostupné objekty: rybí přechody, vodácké propusti, balvanité skluzy, samovolné propusti (4 typy)</li>
                                    <li>Bobří hráze, Malé vodní elektrárny</li>
                                    <li>Mapované toky – úseky k mapování části 1 a 2, navržená opatření, vzduté MVN, přehled zmapovaných</li>
                                    <li>Výpusti do koryt, Zatrubněné úseky, Nepřístupné úseky</li>
                                    <li>Mokřady mezinárodního a národního významu</li>
                                    <li>Příčné překážky Malá vodní nádrž (včetně navržených opatření)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 9. Krajská data */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">Krajská a místní otevřená data — CC BY 4.0</h3>
                                <p className="opacity-70 text-xs mb-2">Data stažená z portálů otevřených dat jednotlivých krajů a statutárních měst (data.gov.cz a krajské portály). Uváděny jsou pouze regiony, které obsahují skutečná data.</p>
                                <ul className="opacity-70 text-xs space-y-1">
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Hlavní město Praha</span> (IPR Praha / MHMP) — 58 vrstev: územní plán, doprava, odpady, příroda, kultura, zdravotnictví, POI</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Jihočeský kraj</span> — 6 vrstev: doprava, příroda, mapa</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Karlovarský kraj</span> — 59 vrstev: volný čas, rekreace, vzdělávání, zdravotnictví, správa, inovace</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Liberecký kraj</span> — 27 vrstev: příroda, doprava, vzdělávání, kultura, zdravotnictví</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Moravskoslezský kraj</span> — 45 vrstev: správa, doprava, příroda, kultura, zdravotnictví</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Olomoucký kraj</span> — 45 vrstev: vzdělávání, správa, socioekonomika, doprava, příroda</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Pardubický kraj</span> — 21 vrstev: správa, příroda, kultura, socioekonomika, doprava</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Královéhradecký kraj</span> — 45 vrstev: doprava, zdravotnictví, vzdělávání, rekreace, kultura, odpady</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Jihomoravský kraj</span> — 15 vrstev: doprava, rekreace, sociální služby, zdravotnictví</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Statutární město Brno</span> — 46 vrstev: doprava, cyklodoprava, příroda, mapa přístupnosti, správa, odpad, kultura</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Plzeňský kraj / Statutární město Plzeň</span> — 20 vrstev: příroda, rekreace</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Ústecký kraj</span> — 1 vrstva: ulice (data RÚIAN)</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Zlínský kraj</span> — 8 vrstev: správa, kultura, vzdělávání</li>
                                </ul>
                                <p className="opacity-50 text-xs mt-2 italic">Středočeský kraj a Kraj Vysočina: žádná otevřená data dostupná.</p>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 10. OpenStreetMap */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© OpenStreetMap contributors — ODbL</h3>
                                <p className="opacity-70 text-xs mb-1">Použito prostřednictvím Nominatim (geokódování adres a vyhledávání míst) a Overpass API (data o místech pro AI asistenta). Jakékoli využití dat OSM vyžaduje tuto atribuci.</p>
                            </section>

                            <p className="text-xs opacity-40 mt-4 leading-relaxed">CC BY 4.0 = Creative Commons Uveďte původ 4.0. ODbL = Open Database License. INSPIRE = EU Directive 2007/2/EC. RÚIAN = Registr územní identifikace, adres a nemovitostí.</p>
                        </div>
                    ),
                    contentEn: (
                        <div className="space-y-5 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>This application uses data from the sources listed below. For each license, the specific datasets covered are listed.</p>

                            {/* 1. CARTO */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-4 mb-2 text-xs uppercase tracking-widest opacity-60">Base Map — © CARTO, CC BY 3.0 + © OpenStreetMap contributors, ODbL</h3>
                                <p className="opacity-70 text-xs">Light (Positron) and dark (Dark Matter) map tile variants. Attribution is displayed automatically by the MapLibre GL map library.</p>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 2. ČÚZK INSPIRE */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© ČÚZK — INSPIRE (EU Directive 2007/2/EC — free for all uses)</h3>
                                <p className="opacity-70 text-xs mb-2">Data mandatorily made available under the European INSPIRE directive. No restriction on commercial use.</p>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>INSPIRE – Geographical Names (GN)</li>
                                    <li>INSPIRE – Administrative Units (AU)</li>
                                    <li>INSPIRE – Addresses (AD)</li>
                                    <li>INSPIRE – Cadastral Parcels (CP) and national extension (CPX)</li>
                                    <li>INSPIRE – Transport Networks: air, cable, rail, road, water (TN)</li>
                                    <li>INSPIRE – Hydrography: physical waters (HY-P), networks (HY-NET)</li>
                                    <li>INSPIRE – Land Use (LU)</li>
                                    <li>INSPIRE – Elevation TIN (EL-TIN)</li>
                                    <li>INSPIRE – Buildings (BU)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 3. ČÚZK commercial */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© ČÚZK — Licensed products (free for non-commercial use; commercial use requires a license agreement with ČÚZK)</h3>
                                <p className="opacity-70 text-xs mb-2">Access via ČÚZK&apos;s public WFS interface. Data is streamed directly from ČÚZK servers — not downloaded or redistributed. Terms: geoportal.cuzk.cz</p>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>ZABAGED® – topographic features (polohopis)</li>
                                    <li>ZABAGED® – contour lines (vrstevnice)</li>
                                    <li>DATA50</li>
                                    <li>DATA250</li>
                                    <li>GEONAMES (geographical names)</li>
                                    <li>Geodetic control points (Bodová pole)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 4. VÚV TGM */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© VÚV TGM — terms: vuv.cz</h3>
                                <p className="opacity-70 text-xs mb-2">Data from the Public Administration Water Management Information System (ISVS). Access via WFS.</p>
                                <ul className="opacity-70 text-xs list-disc pl-4">
                                    <li>Flood zones (WFS layer)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 5. ČGS */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© Czech Geological Survey (ČGS) — CC BY 4.0</h3>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>Protected mineral deposit areas in the Czech Republic</li>
                                    <li>Protected areas for special interventions in the Earth&apos;s crust</li>
                                    <li>Mine workings in the Czech Republic</li>
                                    <li>Inventory of mining waste disposal sites in the Czech Republic</li>
                                    <li>Undermined areas in the Czech Republic</li>
                                    <li>Exploration areas in the Czech Republic</li>
                                    <li>Slope deformations in the Czech Republic – points, lines, polygons</li>
                                    <li>Significant geological localities in the Czech Republic – points, polygons</li>
                                    <li>Exclusive deposits and approved prognostic mineral resources in the Czech Republic</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 6. ČSÚ + RUIAN */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© Czech Statistical Office (ČSÚ) — CC BY 4.0 · partial data © ČÚZK RÚIAN — CC BY 4.0</h3>
                                <p className="opacity-70 text-xs mb-2">Statistical geodatabases and territorial units. The &quot;Address Points&quot; and &quot;Buildings&quot; files originate from the RÚIAN register managed by ČÚZK (source field in data: &quot;RUIAN&quot;).</p>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>SDE geodatabase: housing, demographics and commuting statistics at region, district and municipality level (9 files)</li>
                                    <li>Housing grid SLDB 2021 (census)</li>
                                    <li>NUTS 3 Regions, NUTS 1 Territory, NUTS 0 State</li>
                                    <li>Basic territorial units, Basic settlement units, Municipality parts</li>
                                    <li>Cadastral areas, Municipal districts, Postal code areas</li>
                                    <li>Administrative districts of Prague</li>
                                    <li>Address points <span className="italic">(source: RÚIAN/ČSÚ)</span></li>
                                    <li>Buildings with house numbers <span className="italic">(source: RÚIAN/ČÚZK)</span></li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 7. ČHMÚ */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© Czech Hydrometeorological Institute (ČHMÚ) — CC BY 4.0</h3>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>Partial catchments (Dílčí povodí)</li>
                                    <li>Watershed divides 1st–4th order (Rozvodnice povodí 1.–4. řádu, basic and extended)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 8. AOPK */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© Agency for Nature Conservation and Landscape Protection (AOPK ČR) — CC BY 4.0</h3>
                                <p className="opacity-70 text-xs mb-2">Monitoring of river passability – cross barriers, river sections, wetlands.</p>
                                <ul className="opacity-70 text-xs space-y-0.5 list-disc pl-4">
                                    <li>Cross barriers: dams, weirs, check dams, slides, sills, polders and other (7 types)</li>
                                    <li>Passable structures: fish passes, kayak sluices, boulder slides, natural passes (4 types)</li>
                                    <li>Beaver dams, Small hydro power plants</li>
                                    <li>Mapped watercourses – sections parts 1 &amp; 2, proposed measures, impounded SWR, survey overview</li>
                                    <li>Discharges into channels, Culverted sections, Inaccessible sections</li>
                                    <li>Internationally and nationally significant wetlands</li>
                                    <li>Cross barriers Small Water Reservoir (including proposed measures)</li>
                                </ul>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 9. Regional */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">Regional &amp; Local Open Data — CC BY 4.0</h3>
                                <p className="opacity-70 text-xs mb-2">Data downloaded from open data portals of individual regions and statutory cities (data.gov.cz and regional portals). Only regions with actual data are listed.</p>
                                <ul className="opacity-70 text-xs space-y-1">
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">City of Prague</span> (IPR Praha / MHMP) — 58 layers: land use, transport, waste, nature, culture, healthcare, POI</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">South Bohemian Region</span> — 6 layers: transport, nature, map</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Karlovy Vary Region</span> — 59 layers: leisure, recreation, education, healthcare, administration, innovation</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Liberec Region</span> — 27 layers: nature, transport, education, culture, healthcare</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Moravian-Silesian Region</span> — 45 layers: administration, transport, nature, culture, healthcare</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Olomouc Region</span> — 45 layers: education, administration, socioeconomics, transport, nature</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Pardubice Region</span> — 21 layers: administration, nature, culture, socioeconomics, transport</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Hradec Králové Region</span> — 45 layers: transport, healthcare, education, recreation, culture, waste</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">South Moravian Region</span> — 15 layers: transport, recreation, social services, healthcare</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">City of Brno</span> — 46 layers: transport, cycling, nature, accessibility map, administration, waste, culture</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Plzeň Region / City of Plzeň</span> — 20 layers: nature, recreation</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Ústí nad Labem Region</span> — 1 layer: streets (RÚIAN data)</li>
                                    <li><span className="text-white/80 dark:text-black/80 font-medium">Zlín Region</span> — 8 layers: administration, culture, education</li>
                                </ul>
                                <p className="opacity-50 text-xs mt-2 italic">Central Bohemian Region and Vysočina Region: no open data available.</p>
                            </section>

                            <div className="h-px bg-white/10 dark:bg-black/10" />

                            {/* 10. OSM */}
                            <section>
                                <h3 className="font-bold text-white dark:text-black mt-2 mb-2 text-xs uppercase tracking-widest opacity-60">© OpenStreetMap contributors — ODbL</h3>
                                <p className="opacity-70 text-xs">Used via Nominatim (address geocoding and place search) and Overpass API (POI data for the AI assistant). Any use of OSM data requires this attribution.</p>
                            </section>

                            <p className="text-xs opacity-40 mt-4 leading-relaxed">CC BY 4.0 = Creative Commons Attribution 4.0. ODbL = Open Database License. INSPIRE = EU Directive 2007/2/EC. RÚIAN = Czech address and property register (maintained by ČÚZK).</p>
                        </div>
                    ),
                };
            case "contact":
                return {
                    icon: <MessageSquare size={24} />,
                    titleCs: "Kontaktujte nás",
                    titleEn: "Contact Us",
                    contentCs: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Máte dotaz, zpětnou vazbu nebo potřebujete pomoc? Rádi vám odpovíme.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">E-mailová podpora</h3>
                            <p>Pro obecné dotazy, hlášení chyb nebo žádosti o pomoc nás kontaktujte na <a href="mailto:podpora@zijese.cz" className="text-[#3388ff] hover:underline">podpora@zijese.cz</a>. Snažíme se odpovídat do dvou pracovních dnů.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Ochrana osobních údajů</h3>
                            <p>Pro žádosti týkající se GDPR, výmazu dat nebo přenositelnosti dat pište na <a href="mailto:podpora@zijese.cz" className="text-[#3388ff] hover:underline">podpora@zijese.cz</a> s předmětem „GDPR žádost". Odpovíme nejpozději do 30 dnů.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Sídlo provozovatele</h3>
                            <p className="opacity-80">Václavské náměstí 1<br />110 00 Praha 1<br />Česká republika</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Hlášení chyb a zpětná vazba</h3>
                            <p>Narazili jste na technický problém nebo chybu v datech? Popište nám ji co nejpodrobněji na <a href="mailto:podpora@zijese.cz" className="text-[#3388ff] hover:underline">podpora@zijese.cz</a>. Každé hlášení pomáhá aplikaci zlepšovat.</p>
                        </div>
                    ),
                    contentEn: (
                        <div className="space-y-4 text-sm text-gray-300 dark:text-gray-600 leading-relaxed">
                            <p>Have a question, feedback or need help? We are happy to respond.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Email Support</h3>
                            <p>For general queries, bug reports or requests for help, contact us at <a href="mailto:support@zijese.cz" className="text-[#3388ff] hover:underline">support@zijese.cz</a>. We aim to respond within two business days.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Data Protection</h3>
                            <p>For GDPR requests, data deletion or portability requests, write to <a href="mailto:support@zijese.cz" className="text-[#3388ff] hover:underline">support@zijese.cz</a> with the subject line "GDPR request". We will respond within 30 days.</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Registered Address</h3>
                            <p className="opacity-80">Wenceslas Square 1<br />110 00 Prague 1<br />Czech Republic</p>

                            <h3 className="font-bold text-white dark:text-black mt-6 mb-2">Bug Reports and Feedback</h3>
                            <p>Encountered a technical issue or data error? Describe it in as much detail as possible at <a href="mailto:support@zijese.cz" className="text-[#3388ff] hover:underline">support@zijese.cz</a>. Every report helps improve the application.</p>
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
