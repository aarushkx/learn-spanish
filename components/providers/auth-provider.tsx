"use client";

import { useState, useEffect, createContext } from "react";
import client from "@/supabase/client";

export const AuthContext = createContext({
    user: null,
    isLoading: true,
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        client.auth.getSession().then(({ data }) => {
            setUser(data?.session?.user || null);
            setIsLoading(false);
        });

        const {
            data: { subscription },
        } = client.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
