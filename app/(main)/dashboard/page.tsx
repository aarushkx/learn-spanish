"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import Loader from "@/components/custom/loader";
import LessonCard from "./_components/lesson-card";
import useAuth from "@/hooks/useAuth";
import client from "@/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Lesson } from "@/types/index";

const DashboardPage = () => {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const fetchLessons = async (): Promise<Lesson[]> => {
        const { data, error } = await client
            .from("lessons")
            .select("*")
            .order("order_index", { ascending: true });

        if (error) throw error;
        return data || [];
    };

    const {
        data: lessons,
        isLoading: lessonsLoading,
        error,
    } = useQuery({
        queryKey: ["lessons"],
        queryFn: fetchLessons,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const getImageSrc = (imagePath?: string) => {
        if (!imagePath) return null;
        return client.storage
            .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
            .getPublicUrl(imagePath).data.publicUrl;
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/sign-in");
        }
    }, [authLoading, user, router]);

    if (authLoading || lessonsLoading) {
        return <Loader text="Loading lessons..." />;
    }

    if (!user) return null;

    if (error) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-semibold">
                        Error Loading Lessons
                    </h1>
                    <p className="text-muted-foreground">
                        Failed to load lessons. Please try again later.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background py-8 px-4">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Lessons Grid */}
                {lessons && lessons.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Available Lessons
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <BookOpen className="w-4 h-4" />
                                {lessons.length} lesson
                                {lessons.length !== 1 ? "s" : ""} available
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lessons.map((lesson) => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    onLessonClick={() =>
                                        router.push(`/lessons/${lesson.id}`)
                                    }
                                    getImageSrc={getImageSrc}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-4">
                        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
                        <h3 className="text-xl font-semibold">
                            No Lessons Available
                        </h3>
                        <p className="text-muted-foreground">
                            Lessons are being prepared. Check back soon!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
