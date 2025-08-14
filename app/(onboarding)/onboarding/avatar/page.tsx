"use client";

import { useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader, Loader2, Upload, User } from "lucide-react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import client from "@/supabase/client";
import path from "path";

const AvatarPage = () => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (isLoading) return <Loader />;
    if (!user) redirect("/sign-in");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setAvatarFile(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const uploadAvatar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!avatarFile) return toast.error("Please select a file");

        setIsUploading(true);
        try {
            const {
                data: { user },
            } = await client.auth.getUser();

            if (!user) {
                toast.error("You are not authenticated");
                return;
            }

            const extension = path.extname(avatarFile.name).toLowerCase();
            const filePath = `avatar/${user.id}${extension}`;

            const { error: uploadError } = await client.storage
                .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
                .upload(filePath, avatarFile, { upsert: true });

            if (uploadError) {
                toast.error(uploadError.message);
                return;
            }

            const { error: profileError } = await client
                .from("users")
                .update({ avatar: filePath })
                .eq("id", user.id);

            if (profileError) toast.error(profileError.message);
            else router.push("/dashboard");
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsUploading(false);
        }
    };

    const skipAvatar = () => router.push("/dashboard");

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold">Add your photo</h1>
                    <p className="text-sm text-muted-foreground">
                        Make your profile more personal with a photo
                    </p>
                </div>

                <form onSubmit={uploadAvatar} className="space-y-4">
                    {/* Avatar Preview */}
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Avatar preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <User className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* File Input */}
                    <div className="space-y-2">
                        <Label htmlFor="avatar">Choose Photo</Label>
                        <div className="relative">
                            <Input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="file:mr-4 file:px-4 pr-8 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            />
                            <Upload className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !avatarFile}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Continue"
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onClick={skipAvatar}
                            disabled={isUploading}
                        >
                            Skip for now
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AvatarPage;
