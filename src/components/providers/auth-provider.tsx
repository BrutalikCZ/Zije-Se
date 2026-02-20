"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type User = {
    id: string;
    email: string;
    name: string;
    credits: number;
    questionnaireData?: any;
};

type AuthContextType = {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Load from localStorage on mount as session persistence
        const stored = localStorage.getItem("zije_user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse user from local storage.");
            }
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem("zije_user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("zije_user");
    };

    const updateUser = (data: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, ...data };
            localStorage.setItem("zije_user", JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
