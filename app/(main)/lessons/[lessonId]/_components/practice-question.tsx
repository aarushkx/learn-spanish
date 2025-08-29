"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Volume2,
    VolumeX,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { PracticeQuestion as PracticeQuestionType } from "@/types/index";
import client from "@/supabase/client";

interface PracticeQuestionProps {
    question: PracticeQuestionType;
    userInput: string;
    onAnswerInput: (answer: string) => void;
    showHints?: boolean;
    showFeedback: boolean;
    isCorrect: boolean;
}

const PracticeQuestion = ({
    question,
    userInput,
    onAnswerInput,
    showHints = false,
    showFeedback,
    isCorrect,
}: PracticeQuestionProps) => {
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [showAnswerHints, setShowAnswerHints] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!showFeedback && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showFeedback]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const getMediaSrc = (mediaPath?: string) => {
        if (!mediaPath) return null;
        return client.storage
            .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
            .getPublicUrl(mediaPath).data.publicUrl;
    };

    const playAudio = async () => {
        const audioSrc = getMediaSrc(question.audio);
        if (!audioSrc) return;

        try {
            if (audioRef.current) {
                audioRef.current.pause();
            }

            audioRef.current = new Audio(audioSrc);
            setIsAudioPlaying(true);
            setAudioError(false);

            audioRef.current.onended = () => {
                setIsAudioPlaying(false);
            };

            audioRef.current.onerror = () => {
                setAudioError(true);
                setIsAudioPlaying(false);
            };

            await audioRef.current.play();
        } catch (error) {
            console.error("Audio playback failed:", error);
            setAudioError(true);
            setIsAudioPlaying(false);
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsAudioPlaying(false);
        }
    };

    const handleInputChange = (value: string) => {
        onAnswerInput(value);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.ctrlKey && question.audio) {
            playAudio();
        }
    };

    useEffect(() => {
        if (question.audio) playAudio();
    }, [question.audio]);

    const imageSrc = getMediaSrc(question.image);

    return (
        <div className="space-y-6">
            {/* Question */}
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-semibold leading-relaxed flex-1">
                        {question.question}
                    </h2>

                    {/* Audio Controls */}
                    {question.audio && (
                        <div className="flex items-center gap-2">
                            {!isAudioPlaying ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={playAudio}
                                    disabled={audioError}
                                    className="flex items-center gap-2"
                                    title="Play audio (Ctrl+Enter)"
                                >
                                    <Volume2 className="w-4 h-4" />
                                    {audioError ? "Error" : "Play"}
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={stopAudio}
                                    className="flex items-center gap-2"
                                >
                                    <VolumeX className="w-4 h-4" />
                                    Stop
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Question Image */}
                {imageSrc && (
                    <div className="relative w-full max-w-lg mx-auto">
                        <div className="aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src={imageSrc}
                                alt="Question illustration"
                                width={640}
                                height={360}
                                className="object-cover w-full h-full"
                                priority
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Answer Input */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label
                        htmlFor="answer-input"
                        className="text-lg font-medium block"
                    >
                        Your answer:
                    </label>

                    <div className="relative">
                        {userInput.length <= 100 ? (
                            <Input
                                id="answer-input"
                                ref={inputRef}
                                value={userInput}
                                onChange={(e) =>
                                    handleInputChange(e.target.value)
                                }
                                onKeyDown={handleKeyPress}
                                placeholder="Type your answer here..."
                                disabled={showFeedback}
                                className={`text-lg p-4 ${
                                    showFeedback
                                        ? isCorrect
                                            ? "border-green-500 bg-green-50/50"
                                            : "border-red-500 bg-red-50/50"
                                        : ""
                                }`}
                            />
                        ) : (
                            <Textarea
                                id="answer-input"
                                value={userInput}
                                onChange={(e) =>
                                    handleInputChange(e.target.value)
                                }
                                onKeyDown={handleKeyPress}
                                placeholder="Type your answer here..."
                                disabled={showFeedback}
                                rows={3}
                                className={`text-lg p-4 resize-none ${
                                    showFeedback
                                        ? isCorrect
                                            ? "border-green-500 bg-green-50/50"
                                            : "border-red-500 bg-red-50/50"
                                        : ""
                                }`}
                            />
                        )}

                        {/* Feedback Icons */}
                        {showFeedback && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {isCorrect ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Character count for longer answers */}
                    {userInput.length > 50 && (
                        <div className="text-xs text-muted-foreground text-right">
                            {userInput.length} characters
                        </div>
                    )}
                </div>

                {/* Immediate Feedback */}
                {showFeedback && (
                    <div
                        className={`p-3 rounded-md text-sm font-medium ${
                            isCorrect
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }`}
                    >
                        {isCorrect
                            ? "Your answer is correct!"
                            : `Incorrect. Correct answer is: ${
                                  question.answers[0] || "N/A"
                              }`}
                    </div>
                )}

                {/* Hints Section */}
                {showHints && question.answers.length > 1 && !showFeedback && (
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAnswerHints(!showAnswerHints)}
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        >
                            {showAnswerHints ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                            {showAnswerHints ? "Hide" : "Show"} answer
                            variations
                        </Button>

                        {showAnswerHints && (
                            <Card className="p-4 bg-muted/50">
                                <p className="text-sm text-muted-foreground mb-2">
                                    Acceptable answer formats:
                                </p>
                                <ul className="text-sm space-y-1">
                                    {question.answers.map((answer, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                            <span className="font-mono bg-background px-2 py-0.5 rounded text-xs">
                                                {answer}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </div>
                )}

                {/* Keyboard shortcuts hint */}
                {question.audio && !showFeedback && (
                    <div className="text-xs text-muted-foreground">
                        💡 Tip: Press Ctrl+Enter to replay audio
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeQuestion;
