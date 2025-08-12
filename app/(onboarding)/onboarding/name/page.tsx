"use client";

import { useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/custom/loader";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import client from "@/supabase/client";
import { Loader2 } from "lucide-react";

const NamePage = () => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    if (isLoading) return <Loader />;
    if (!user) redirect("/sign-in");

    const saveName = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const {
                data: { user },
            } = await client.auth.getUser();

            if (!user) {
                toast.error("You are not authenticated");
                return;
            }

            const { error } = await client
                .from("users")
                .update({ name })
                .eq("id", user.id);

            if (error) toast.error(error.message);
            else router.push("/onboarding/avatar");
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold">
                        What should we call you?
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Let's personalize your Spanish learning experience
                    </p>
                </div>

                <form onSubmit={saveName} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default NamePage;
