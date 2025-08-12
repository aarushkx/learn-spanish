"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Edit3, LogOut, Check, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/custom/loader";
import useAuth from "@/hooks/useAuth";
import client from "@/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserProfile } from "@/types";
import path from "path";

const ProfilePage = () => {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [newName, setNewName] = useState("");
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

    const fetchProfile = async (): Promise<UserProfile> => {
        if (!user?.id) throw new Error("User ID not found");

        const { data, error } = await client
            .from("users")
            .select("id, name, email, avatar, role, created_at")
            .eq("id", user.id)
            .single();

        if (error) throw error;
        return data as UserProfile;
    };

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["userProfile", user?.id],
        queryFn: fetchProfile,
        enabled: !!user?.id,
    });

    const updateName = async () => {
        if (!newName.trim() || !user?.id) return;

        setIsUpdatingName(true);
        try {
            const { error } = await client
                .from("users")
                .update({ name: newName.trim() })
                .eq("id", user.id);

            if (error) throw error;

            queryClient.invalidateQueries({
                queryKey: ["userProfile", user?.id],
            });
            setIsEditingName(false);
        } catch {
            toast.error("Failed to update name");
        } finally {
            setIsUpdatingName(false);
        }
    };

    const updateAvatar = async () => {
        if (!newAvatarFile || !user?.id) return;

        setIsUpdatingAvatar(true);
        try {
            const extension = path.extname(newAvatarFile.name).toLowerCase();
            const filePath = `avatar/${user.id}-${Date.now()}.${extension}`; // Generate a unique filename to be stored in the bucket

            const { error: uploadError } = await client.storage
                .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
                .upload(filePath, newAvatarFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { error: updateError } = await client
                .from("users")
                .update({ avatar: filePath })
                .eq("id", user.id);

            if (updateError) throw updateError;

            queryClient.invalidateQueries({
                queryKey: ["userProfile", user?.id],
            });

            setIsEditingAvatar(false);
            setNewAvatarFile(null);
            setAvatarPreview(null);
        } catch {
            toast.error("Failed to update avatar");
        } finally {
            setIsUpdatingAvatar(false);
        }
    };

    const handleNameEdit = () => {
        setNewName(profile?.name || "Unknown");
        setIsEditingName(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewAvatarFile(file);
            const reader = new FileReader();
            reader.onload = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSignOut = async () => {
        const { error } = await client.auth.signOut();

        if (error) {
            toast.error("Failed to sign out");
        } else {
            toast.success("Signed out successfully");
            router.push("/sign-in");
        }
    };

    if (isLoading || profileLoading)
        return <Loader text="Loading profile..." />;
    if (!user) {
        router.push("/sign-in");
        return null;
    }

    const getAvatarSrc = () => {
        if (avatarPreview) return avatarPreview;
        if (profile?.avatar) {
            const { data } = client.storage
                .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
                .getPublicUrl(profile.avatar);

            return `${data.publicUrl}?t=${Date.now()}`; // Append a timestamp to force a refresh
        }
        return null;
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pb-6">
            <div className="w-full max-w-sm space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold">Your Profile</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your account settings
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center space-y-4">
                        {getAvatarSrc() ? (
                            <Image
                                src={getAvatarSrc()!}
                                alt="Avatar"
                                width={96}
                                height={96}
                                className="w-24 h-24 rounded-full object-cover border"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border">
                                {profile?.name ? (
                                    <span className="text-muted-foreground font-semibold text-4xl">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </span>
                                ) : (
                                    <User className="w-8 h-8 text-muted-foreground" />
                                )}
                            </div>
                        )}

                        {!isEditingAvatar ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditingAvatar(true)}
                            >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Change Avatar
                            </Button>
                        ) : (
                            <div className="space-y-3 w-full">
                                <Label htmlFor="avatar">
                                    Choose new avatar
                                </Label>
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
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={updateAvatar}
                                        disabled={
                                            !newAvatarFile || isUpdatingAvatar
                                        }
                                    >
                                        {isUpdatingAvatar ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />{" "}
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4 mr-1" />
                                                <span>Save</span>
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setIsEditingAvatar(false);
                                            setNewAvatarFile(null);
                                            setAvatarPreview(null);
                                        }}
                                        disabled={isUpdatingAvatar}
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Name Section */}
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium">Name</p>
                                {!isEditingName ? (
                                    <p className="text-sm text-muted-foreground">
                                        {profile?.name || "Unknown"}
                                    </p>
                                ) : (
                                    <div className="space-y-2 mt-2">
                                        <Input
                                            value={newName}
                                            onChange={(e) =>
                                                setNewName(e.target.value)
                                            }
                                            placeholder="Enter your name"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={updateName}
                                                disabled={
                                                    !newName.trim() ||
                                                    isUpdatingName
                                                }
                                            >
                                                {isUpdatingName ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />{" "}
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4 mr-1" />
                                                        <span>Save</span>
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setIsEditingName(false)
                                                }
                                                disabled={isUpdatingName}
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!isEditingName && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleNameEdit}
                                >
                                    <Edit3 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Email Section */}
                    <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                            {profile?.email}
                        </p>
                    </div>

                    {/* Member Since Section */}
                    <div>
                        <p className="text-sm font-medium">Member since</p>
                        <p className="text-sm text-muted-foreground">
                            {user?.created_at
                                ? new Date(user.created_at).toLocaleDateString(
                                      "en-US",
                                      {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                      }
                                  )
                                : "Unknown"}
                        </p>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-4 h-4 mr-1" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
