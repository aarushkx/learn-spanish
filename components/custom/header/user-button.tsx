import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, LayoutDashboard, ShieldPlus } from "lucide-react";
import { toast } from "sonner";
import useAuth from "@/hooks/useAuth";
import client from "@/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@/types";

const UserButton = () => {
    const { user } = useAuth();
    const router = useRouter();

    const fetchProfile = async (): Promise<UserProfile> => {
        if (!user?.id) throw new Error("User ID not found");

        const { data, error } = await client
            .from("users")
            .select("id, name, email, avatar, role")
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

    const handleSignOut = async () => {
        try {
            const { error } = await client.auth.signOut();
            if (error) {
                toast.error("Failed to sign out");
            } else {
                toast.success("Signed out successfully");
                router.push("/sign-in");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        }
    };

    const getAvatarSrc = () => {
        if (profile?.avatar) {
            return client.storage
                .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
                .getPublicUrl(profile.avatar).data.publicUrl;
        }
        return null;
    };

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-8 w-8 rounded-full"
                    >
                        <Avatar className="h-8 w-8">
                            {getAvatarSrc() ? (
                                <Image
                                    src={getAvatarSrc() ?? ""}
                                    alt="Avatar"
                                    fill
                                    className="object-cover rounded-full"
                                    sizes="32px"
                                />
                            ) : (
                                <AvatarFallback>
                                    {profile?.name ? (
                                        profile.name.charAt(0).toUpperCase()
                                    ) : (
                                        <User className="h-4 w-4" />
                                    )}
                                </AvatarFallback>
                            )}
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {profile?.name}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {profile?.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                        <LayoutDashboard className="mr-1 h-4 w-4" />
                        <span>Dashboard</span>
                    </DropdownMenuItem>
                    {profile?.role === "admin" && (
                        <DropdownMenuItem
                            onClick={() => router.push("/admin/lessons/add")}
                        >
                            <ShieldPlus className="mr-1 h-4 w-4" />
                            <span>Admin</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                        <User className="mr-1 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-destructive hover:text-accent"
                    >
                        <LogOut className="mr-1 h-4 w-4" />
                        <span>Sign out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default UserButton;
