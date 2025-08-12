"use client";

import { usePathname } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import UserButton from "./user-button";
import Logo from "./logo";

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

    return (
        <header className="w-full border-b bg-background">
            <div className="flex h-14 items-center justify-between px-4">
                {/* Logo */}
                <Logo />
                {/* User Button */}
                {user && !unauthenticatedRoutes.includes(pathname) && (
                    <UserButton />
                )}
            </div>
        </header>
    );
};

export default Header;
