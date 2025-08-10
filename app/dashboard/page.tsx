"use client";

import Loader from "@/components/custom/Loader";
import useAuth from "@/hooks/useAuth";
import { redirect } from "next/navigation";

const DashboardPage = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) return <Loader />;
    if (!user) redirect("/sign-in");

    return (
        <div>
            <h1>Dashboard</h1>
        </div>
    );
};

export default DashboardPage;
