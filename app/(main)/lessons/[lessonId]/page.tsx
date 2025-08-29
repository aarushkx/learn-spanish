"use client";

import { useState, useEffect, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    ArrowRight,
    CheckCircle,
    RotateCcw,
    Home,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/custom/loader";
import PracticeQuestion from "./_components/practice-question";
import useAuth from "@/hooks/useAuth";
import client from "@/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Lesson,
    PracticeQuestion as PracticeQuestionType,
} from "@/types/index";

interface LessonPageProps {
    params: Promise<{
        lessonId: string;
    }>;
}

interface QuestionResult {
    question: string;
    userAnswer: string;
    correctAnswers: string[];
    isCorrect: boolean;
}

const LessonPage = ({ params }: LessonPageProps) => {
    const { lessonId } = use(params);

    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>(
        {}
    );
    const [showResults, setShowResults] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentIsCorrect, setCurrentIsCorrect] = useState(false);
    const [results, setResults] = useState<(boolean | null)[]>([]);

    const fetchLesson = useCallback(async (): Promise<Lesson> => {
        const { data, error } = await client
            .from("lessons")
            .select("*")
            .eq("id", lessonId)
            .single();

        if (error) throw error;
        if (!data) throw new Error("Lesson not found");

        return data;
    }, [lessonId]);

    const fetchPracticeQuestions = useCallback(async (): Promise<
        PracticeQuestionType[]
    > => {
        const { data, error } = await client
            .from("practices")
            .select("*")
            .eq("lesson_id", lessonId)
            .order("order_index", { ascending: true });

        if (error) throw error;
        return data || [];
    }, [lessonId]);

    const {
        data: lesson,
        isLoading: lessonLoading,
        error: lessonError,
    } = useQuery({
        queryKey: ["lesson", lessonId],
        queryFn: fetchLesson,
        enabled: !!lessonId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    const {
        data: practiceQuestions,
        isLoading: questionsLoading,
        error: questionsError,
    } = useQuery({
        queryKey: ["practiceQuestions", lessonId],
        queryFn: fetchPracticeQuestions,
        enabled: !!lessonId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    useEffect(() => {
        if (practiceQuestions) {
            setResults(Array(practiceQuestions.length).fill(null));
        }
    }, [practiceQuestions]);

    useEffect(() => {
        setShowFeedback(false);
    }, [currentQuestionIndex]);

    useEffect(() => {
        if (!authLoading && !user) {
            toast.error("Please sign in to access lessons");
            router.push("/sign-in");
        }
    }, [user, authLoading, router]);

    const currentQuestion = useMemo(
        () => practiceQuestions?.[currentQuestionIndex],
        [practiceQuestions, currentQuestionIndex]
    );

    const progressPercentage = useMemo(
        () =>
            practiceQuestions
                ? ((currentQuestionIndex + 1) / practiceQuestions.length) * 100
                : 0,
        [currentQuestionIndex, practiceQuestions]
    );

    const isAnswerCorrect = useCallback(
        (userAnswer: string, validAnswers: string[]): boolean => {
            const normalize = (str: string): string => {
                // Convert to lowercase
                let normalized = str.toLowerCase();

                // Strip specified punctuation
                const punctuation = /[.,;¡!¿? -]/g;
                normalized = normalized.replace(punctuation, "");

                return normalized;
            };

            const removeAccents = (str: string): string => {
                return (
                    str
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        // Specific replacements if needed (e.g., ñ to n, ü to u)
                        .replace(/ñ/g, "n")
                        .replace(/ü/g, "u")
                );
            };

            const userNormalized = normalize(userAnswer);
            const deaccentedUser = removeAccents(userNormalized);

            return validAnswers.some((validAnswer) => {
                const correctNormalized = normalize(validAnswer);
                const deaccentedCorrect = removeAccents(correctNormalized);

                // First, check if deaccented versions match
                if (deaccentedUser !== deaccentedCorrect) {
                    return false;
                }

                // Now, check for one-way accent ignore:
                // Allow user to omit accents (user plain matches correct accented),
                // but disallow user adding accents (user accented where correct is plain)
                for (let i = 0; i < userNormalized.length; i++) {
                    const userChar = userNormalized[i];
                    const correctChar = correctNormalized[i];

                    // If user has an accent but correct does not, it's incorrect
                    if (
                        removeAccents(userChar) === userChar &&
                        removeAccents(correctChar) !== correctChar
                    ) {
                        // Correct has accent, user has plain: allowed
                        continue;
                    } else if (
                        removeAccents(userChar) !== userChar &&
                        removeAccents(correctChar) === correctChar
                    ) {
                        // User has accent, correct has plain: disallowed
                        return false;
                    }
                }

                return true;
            });
        },
        []
    );

    const score = useMemo(() => {
        if (!practiceQuestions) return 0;

        let correct = 0;
        practiceQuestions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            if (userAnswer && isAnswerCorrect(userAnswer, question.answers)) {
                correct++;
            }
        });
        return correct;
    }, [practiceQuestions, userAnswers, isAnswerCorrect]);

    const detailedResults = useMemo((): QuestionResult[] => {
        if (!practiceQuestions) return [];

        return practiceQuestions.map((question, index) => {
            const userAnswer = userAnswers[index] || "";
            const isCorrect =
                userAnswer && isAnswerCorrect(userAnswer, question.answers);
            return {
                question: question.question,
                userAnswer,
                correctAnswers: question.answers,
                isCorrect: !!isCorrect,
            };
        });
    }, [practiceQuestions, userAnswers, isAnswerCorrect]);

    const handleAnswerInput = useCallback(
        (answer: string) => {
            setUserAnswers((prev) => ({
                ...prev,
                [currentQuestionIndex]: answer,
            }));
        },
        [currentQuestionIndex]
    );

    const handleAction = useCallback(() => {
        if (!practiceQuestions || !currentQuestion) return;

        const userAnswer = userAnswers[currentQuestionIndex] || "";
        if (!showFeedback) {
            const correct = isAnswerCorrect(
                userAnswer,
                currentQuestion.answers
            );
            setCurrentIsCorrect(correct);
            setShowFeedback(true);
            setResults((prev) => {
                const newResults = [...prev];
                newResults[currentQuestionIndex] = correct;
                return newResults;
            });
        } else {
            if (currentQuestionIndex < practiceQuestions.length - 1) {
                setCurrentQuestionIndex((prev) => prev + 1);
            } else {
                setShowResults(true);
            }
        }
    }, [
        showFeedback,
        currentQuestionIndex,
        practiceQuestions,
        currentQuestion,
        userAnswers,
        isAnswerCorrect,
    ]);

    const handleRestartQuiz = useCallback(() => {
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setShowResults(false);
        setShowFeedback(false);
        setResults(Array(practiceQuestions?.length || 0).fill(null));
    }, [practiceQuestions]);

    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (showResults) return;

            if (
                event.key === "Enter" &&
                userAnswers[currentQuestionIndex]?.trim()
            ) {
                handleAction();
            }
        },
        [showResults, currentQuestionIndex, userAnswers, handleAction]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyPress);
        return () => document.removeEventListener("keydown", handleKeyPress);
    }, [handleKeyPress]);

    if (authLoading || lessonLoading || questionsLoading) {
        return <Loader text="Loading lesson..." />;
    }

    if (lessonError || questionsError) {
        const errorMessage =
            lessonError?.message ||
            questionsError?.message ||
            "Unknown error occurred";
        const isNetworkError =
            errorMessage.includes("network") || errorMessage.includes("fetch");

        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-semibold">
                        {isNetworkError
                            ? "Connection Error"
                            : "Lesson Not Found"}
                    </h1>
                    <p className="text-muted-foreground max-w-md">
                        {isNetworkError
                            ? "Unable to connect to the server. Please check your internet connection and try again."
                            : "The lesson you're looking for doesn't exist or has been removed."}
                    </p>
                    <div className="flex gap-2 justify-center">
                        {isNetworkError && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    queryClient.invalidateQueries({
                                        queryKey: ["lesson", lessonId],
                                    })
                                }
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        )}
                        <Button onClick={() => router.push("/dashboard")}>
                            <Home className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-semibold">Lesson Not Found</h1>
                    <p className="text-muted-foreground">
                        The lesson you're looking for doesn't exist.
                    </p>
                    <Button onClick={() => router.push("/dashboard")}>
                        <Home className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (!practiceQuestions || practiceQuestions.length === 0) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-semibold">
                        No Practice Questions
                    </h1>
                    <p className="text-muted-foreground">
                        This lesson doesn't have any practice questions yet.
                    </p>
                    <Button onClick={() => router.push("/dashboard")}>
                        <Home className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (showResults) {
        const percentage = Math.round((score / practiceQuestions.length) * 100);
        const getScoreEmoji = (percentage: number) => {
            if (percentage >= 90) return "🎉";
            if (percentage >= 80) return "⭐";
            if (percentage >= 70) return "👍";
            if (percentage >= 50) return "📚";
            return "💪";
        };

        const getScoreMessage = (percentage: number) => {
            if (percentage >= 90) return "Excellent work!";
            if (percentage >= 80) return "Great job!";
            if (percentage >= 70) return "Well done!";
            if (percentage >= 50) return "Good effort!";
            return "Keep practicing!";
        };

        return (
            <div className="min-h-screen bg-background py-8 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-center space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold">
                                Lesson Completed!
                            </h1>
                            <p className="text-muted-foreground">
                                You've finished all questions for "
                                {lesson.title}"
                            </p>
                        </div>

                        <div className="bg-card p-8 rounded-lg space-y-4 border">
                            <div className="text-6xl">
                                {getScoreEmoji(percentage)}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-semibold">
                                    Your Score: {score}/
                                    {practiceQuestions.length}
                                </h2>
                                <p className="text-xl text-muted-foreground">
                                    {percentage}% Correct
                                </p>
                                <p className="text-lg font-medium text-primary">
                                    {getScoreMessage(percentage)}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                                <Button
                                    onClick={handleRestartQuiz}
                                    variant="outline"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Retake Lesson
                                </Button>
                                <Button
                                    onClick={() => router.push("/dashboard")}
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Back to Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Review */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-center">
                            Review Your Answers
                        </h3>
                        <div className="space-y-3">
                            {detailedResults.map((result, index) => (
                                <div
                                    key={index}
                                    className={`bg-card p-4 rounded-lg border-l-4 transition-colors ${
                                        result.isCorrect
                                            ? "border-l-green-500 hover:bg-green-50/50"
                                            : "border-l-red-500 hover:bg-red-50/50"
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <span className="text-sm font-medium text-muted-foreground min-w-fit">
                                                Q{index + 1}:
                                            </span>
                                            <p className="font-medium">
                                                {result.question}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pl-8">
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">
                                                    Your answer:
                                                </span>
                                                <div
                                                    className={`font-medium ${
                                                        result.isCorrect
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {result.userAnswer ||
                                                        "No answer provided"}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">
                                                    Valid answers:
                                                </span>
                                                <div className="text-green-600 font-medium">
                                                    {result.correctAnswers.join(
                                                        ", "
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentUserAnswer = userAnswers[currentQuestionIndex] || "";
    const isAnswerProvided = currentUserAnswer.trim().length > 0;

    return (
        <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-end text-sm text-muted-foreground">
                        <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-1" />
                </div>

                {/* Practice Question */}
                <div className="py-6">
                    {currentQuestion && (
                        <PracticeQuestion
                            question={currentQuestion}
                            userInput={currentUserAnswer}
                            onAnswerInput={handleAnswerInput}
                            showFeedback={showFeedback}
                            isCorrect={currentIsCorrect}
                        />
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-end items-center">
                    <Button
                        onClick={handleAction}
                        disabled={!isAnswerProvided}
                        className="flex items-center gap-2"
                    >
                        {showFeedback ? (
                            currentQuestionIndex ===
                            practiceQuestions.length - 1 ? (
                                <>
                                    Finish
                                    <CheckCircle className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )
                        ) : (
                            <>
                                Check
                                <CheckCircle className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center space-x-2">
                    {practiceQuestions.map((_, index) => {
                        let bgColor = "bg-muted";
                        if (index < currentQuestionIndex) {
                            bgColor = results[index]
                                ? "bg-green-500"
                                : "bg-red-500";
                        } else if (index === currentQuestionIndex) {
                            bgColor = showFeedback
                                ? currentIsCorrect
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                : "bg-primary";
                        }
                        return (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${bgColor}`}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LessonPage;
