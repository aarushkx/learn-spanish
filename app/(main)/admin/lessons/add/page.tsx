"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Loader from "@/components/custom/loader";
import useAuth from "@/hooks/useAuth";
import client from "@/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@/types/index";
import {
    LessonDetailsForm,
    PracticeQuestionsSection,
    SubmitSection,
    LessonForm,
    PracticeQuestionForm,
} from "../_components";

const AddLessonPage = () => {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [lessonForm, setLessonForm] = useState<LessonForm>({
        title: "",
        description: "",
        order_index: 1,
        image: null,
        practices: [
            {
                question: "",
                answers: [""],
                image: null,
                audio: null,
                order_index: 1,
            },
        ],
    });

    const fetchProfile = async (): Promise<UserProfile> => {
        if (!user?.id) throw new Error("User ID not found");

        const { data, error } = await client
            .from("users")
            .select("id, name, email, role")
            .eq("id", user.id)
            .single();

        if (error) throw error;
        return data as UserProfile;
    };

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["userProfile", "v2", user?.id],
        queryFn: fetchProfile,
        enabled: !!user?.id,
    });

    useEffect(() => {
        if (profile && profile.role !== "admin") {
            toast.error("Access denied. Admin privileges required.");
            router.push("/dashboard");
        }
    }, [profile, router]);

    const uploadFile = async (file: File, folder: string): Promise<string> => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await client.storage
            .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
            .upload(filePath, file);

        if (error) throw error;
        return filePath;
    };

    const handleLessonChange = (
        field: keyof Omit<LessonForm, "practices">,
        value: string | number | File | null
    ) => {
        setLessonForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleLessonImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] || null;
        handleLessonChange("image", file);
    };

    const addPracticeQuestion = () => {
        setLessonForm((prev) => ({
            ...prev,
            practices: [
                ...prev.practices,
                {
                    question: "",
                    answers: [""],
                    image: null,
                    audio: null,
                    order_index: prev.practices.length + 1,
                },
            ],
        }));
    };

    const removePracticeQuestion = (index: number) => {
        if (lessonForm.practices.length === 1) {
            toast.error("At least one practice question is required");
            return;
        }

        setLessonForm((prev) => ({
            ...prev,
            practices: prev.practices.filter((_, i) => i !== index),
        }));
    };

    const handlePracticeChange = (
        practiceIndex: number,
        field: keyof PracticeQuestionForm,
        value: string | string[] | File | null | number
    ) => {
        setLessonForm((prev) => ({
            ...prev,
            practices: prev.practices.map((practice, index) =>
                index === practiceIndex
                    ? { ...practice, [field]: value }
                    : practice
            ),
        }));
    };

    const addAnswer = (practiceIndex: number) => {
        const currentAnswers = lessonForm.practices[practiceIndex].answers;
        handlePracticeChange(practiceIndex, "answers", [...currentAnswers, ""]);
    };

    const removeAnswer = (practiceIndex: number, answerIndex: number) => {
        const currentAnswers = lessonForm.practices[practiceIndex].answers;
        if (currentAnswers.length === 1) {
            toast.error("At least one answer is required");
            return;
        }

        const newAnswers = currentAnswers.filter((_, i) => i !== answerIndex);
        handlePracticeChange(practiceIndex, "answers", newAnswers);
    };

    const handleAnswerChange = (
        practiceIndex: number,
        answerIndex: number,
        value: string
    ) => {
        const currentAnswers = lessonForm.practices[practiceIndex].answers;
        const newAnswers = currentAnswers.map((answer, i) =>
            i === answerIndex ? value : answer
        );
        handlePracticeChange(practiceIndex, "answers", newAnswers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!lessonForm.title.trim()) {
            toast.error("Lesson title is required");
            return;
        }

        if (!lessonForm.description.trim()) {
            toast.error("Lesson description is required");
            return;
        }

        const hasValidPractices = lessonForm.practices.every(
            (practice) =>
                practice.question.trim() &&
                practice.answers.some((answer) => answer.trim())
        );

        if (!hasValidPractices) {
            toast.error(
                "All practice questions must have a question and at least one answer"
            );
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Upload lesson image if exists
            let lessonImagePath = "";
            if (lessonForm.image) {
                lessonImagePath = await uploadFile(lessonForm.image, "lessons");
            }

            // 2. Create lesson in database
            const { data: lessonData, error: lessonError } = await client
                .from("lessons")
                .insert({
                    title: lessonForm.title,
                    description: lessonForm.description,
                    order_index: lessonForm.order_index,
                    image: lessonImagePath,
                })
                .select()
                .single();

            if (lessonError) throw lessonError;

            // 3. Upload practice files and create practice questions
            const practicePromises = lessonForm.practices.map(
                async (practice, index) => {
                    let practiceImagePath = "";
                    let practiceAudioPath = "";

                    // Upload practice image if exists
                    if (practice.image) {
                        practiceImagePath = await uploadFile(
                            practice.image,
                            "practices/images"
                        );
                    }

                    // Upload practice audio if exists
                    if (practice.audio) {
                        practiceAudioPath = await uploadFile(
                            practice.audio,
                            "practices/audio"
                        );
                    }

                    // Create practice question in database
                    return client.from("practices").insert({
                        lesson_id: lessonData.id,
                        question: practice.question,
                        answers: practice.answers.filter((answer) =>
                            answer.trim()
                        ), // Remove empty answers
                        image: practiceImagePath,
                        audio: practiceAudioPath,
                        order_index: index + 1,
                    });
                }
            );

            // Wait for all practices to be created
            const practiceResults = await Promise.all(practicePromises);

            // Check if any practice creation failed
            const failedPractices = practiceResults.filter(
                (result) => result.error
            );
            if (failedPractices.length > 0) {
                console.error(
                    "Some practices failed to create:",
                    failedPractices
                );
                toast.error(
                    "Lesson created but some practice questions failed to save"
                );
            } else {
                toast.success(
                    "Lesson and all practice questions created successfully!"
                );
            }

            // Reset form
            setLessonForm({
                title: "",
                description: "",
                order_index: lessonForm.order_index + 1, // Auto-increment for next lesson
                image: null,
                practices: [
                    {
                        question: "",
                        answers: [""],
                        image: null,
                        audio: null,
                        order_index: 1,
                    },
                ],
            });

            // Scroll to top
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            console.error("Error creating lesson:", error);
            toast.error("Failed to create lesson");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading states
    if (authLoading || profileLoading) {
        return <Loader text="Checking permissions..." />;
    }

    if (!user) {
        router.push("/sign-in");
        return null;
    }

    if (profile?.role !== "admin") {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-semibold">Access Denied</h1>
                    <p className="text-muted-foreground">
                        This page requires admin privileges.
                    </p>
                    <Button onClick={() => router.push("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Add New Lesson
                    </h1>
                    <p className="text-muted-foreground">
                        Create a new Spanish lesson with practice questions
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <LessonDetailsForm
                        lessonForm={lessonForm}
                        onLessonChange={handleLessonChange}
                        onImageChange={handleLessonImageChange}
                    />

                    <PracticeQuestionsSection
                        practices={lessonForm.practices}
                        onAddPractice={addPracticeQuestion}
                        onPracticeChange={handlePracticeChange}
                        onRemovePractice={removePracticeQuestion}
                        onAddAnswer={addAnswer}
                        onRemoveAnswer={removeAnswer}
                        onAnswerChange={handleAnswerChange}
                    />

                    <SubmitSection
                        isSubmitting={isSubmitting}
                        onCancel={() => router.push("/dashboard")}
                    />
                </form>
            </div>
        </div>
    );
};

export default AddLessonPage;
