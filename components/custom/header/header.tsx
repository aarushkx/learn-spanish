"use client";

import { usePathname } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import UserButton from "./user-button";
import Logo from "./logo";
import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@/types";
import client from "@/supabase/client";
import { Badge } from "@/components/ui/badge";

const Header = () => {
    const { user } = useAuth();
    const pathname = usePathname();

    const unauthenticatedRoutes = [
        "/",
        "/sign-in",
        "/sign-up",
        "/onboarding/name",
        "/onboarding/avatar",
    ];

    const fetchProfile = async (): Promise<UserProfile> => {
        if (!user?.id) throw new Error("User ID not found");

        const { data, error } = await client
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (error) throw error;
        return data as UserProfile;
    };

    const { data: profile } = useQuery({
        queryKey: ["userProfile", user?.id],
        queryFn: fetchProfile,
        enabled: !!user?.id,
    });

    return (
        <header className="w-full border-b bg-background">
            <div className="flex h-14 items-center justify-between px-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Logo />
                    {/* Admin Badge */}
                    {profile?.role === "admin" &&
                        !unauthenticatedRoutes.includes(pathname) && (
                            <Badge variant="default">Admin</Badge>
                        )}
                </div>

                {/* User Button */}
                {user && !unauthenticatedRoutes.includes(pathname) && (
                    <UserButton />
                )}
            </div>
        </header>
    );
};

export default Header;
