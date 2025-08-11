"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Loader from "@/components/custom/Loader";
import useAuth from "@/hooks/useAuth";
import { redirect } from "next/navigation";
import client from "@/supabase/client";

type User = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
};

const DashboardPage = () => {
    const { user, isLoading } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            const { data, error } = await client
                .from("users")
                .select("name, avatar")
                .eq("id", user.id)
                .single();

            if (!error) setProfile(data as User);
        };

        fetchProfile();
    }, [user]);

    if (isLoading) return <Loader />;
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
                />
            ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Avatar</span>
                </div>
            )}
            <h1 className="text-2xl font-semibold">
                {profile?.name || "No name set"}
            </h1>
            <p className="text-gray-500">{user.email}</p>
        </div>
    );
};

export default DashboardPage;
