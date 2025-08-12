"use client";

import Image from "next/image";
import { redirect } from "next/navigation";
import Loader from "@/components/custom/loader";
import useAuth from "@/hooks/useAuth";
import client from "@/supabase/client";
import { useQuery } from "@tanstack/react-query";

type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
};

const DashboardPage = () => {
    const { user, isLoading } = useAuth();

    const fetchProfile = async (): Promise<User> => {
        if (!user?.id) throw new Error("User ID not found");

        const { data, error } = await client
            .from("users")
            .select("id, name, email, avatar")
            .eq("id", user.id)
            .single();

        if (error) throw error;

        return data as User;
    };

    const {
        data: profile,
        error,
        isLoading: profileLoading,
    } = useQuery({
        queryKey: ["userProfile", user?.id],
        queryFn: fetchProfile,
        enabled: !!user?.id,
    });

    if (isLoading || profileLoading) return <Loader />;
    if (!user) redirect("/sign-in");

    return (
        <div className="flex flex-col items-center gap-4 mt-8">
            {profile?.avatar ? (
                <Image
                    src={
                        client.storage
                            .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
                            .getPublicUrl(profile.avatar).data.publicUrl
                    }
                    alt="User avatar"
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover border"
                    priority
                />
            ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Avatar</span>
                </div>
            )}
            <h1 className="text-2xl font-semibold">
                {profile?.name || "Unknown"}
            </h1>
            <p className="text-gray-500">{profile?.email}</p>
        </div>
    );
};

export default DashboardPage;
