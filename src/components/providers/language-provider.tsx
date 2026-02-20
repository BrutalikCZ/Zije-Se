"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type LanguageContextType = {
    language: "cs" | "en";
    setLanguage: (lang: "cs" | "en") => void;
    toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<"cs" | "en">("cs");

    useEffect(() => {
        const saved = localStorage.getItem("language");
        if (saved === "en" || saved === "cs") {
            setLanguage(saved);
        }
    }, []);

    const handleSetLanguage = (lang: "cs" | "en") => {
        setLanguage(lang);
        localStorage.setItem("language", lang);
    };

    const toggleLanguage = () => {
        handleSetLanguage(language === "cs" ? "en" : "cs");
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
