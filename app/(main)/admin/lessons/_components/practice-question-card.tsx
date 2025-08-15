import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { PracticeQuestionForm } from ".";

interface PracticeQuestionCardProps {
    practice: PracticeQuestionForm;
    practiceIndex: number;
    totalPractices: number;
    onPracticeChange: (
        practiceIndex: number,
        field: keyof PracticeQuestionForm,
        value: string | string[] | File | null | number
    ) => void;
    onRemove: (index: number) => void;
    onAddAnswer: (practiceIndex: number) => void;
    onRemoveAnswer: (practiceIndex: number, answerIndex: number) => void;
    onAnswerChange: (
        practiceIndex: number,
        answerIndex: number,
        value: string
    ) => void;
}

const PracticeQuestionCard = ({
    practice,
    practiceIndex,
    totalPractices,
    onPracticeChange,
    onRemove,
    onAddAnswer,
    onRemoveAnswer,
    onAnswerChange,
}: PracticeQuestionCardProps) => {
    return (
        <div className="border rounded-lg p-6 space-y-4 bg-background">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                    Question {practiceIndex + 1}
                </h3>
                {totalPractices > 1 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(practiceIndex)}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor={`question-${practiceIndex}`}>Question *</Label>
                <Textarea
                    id={`question-${practiceIndex}`}
                    value={practice.question}
                    onChange={(e) =>
                        onPracticeChange(
                            practiceIndex,
                            "question",
                            e.target.value
                        )
                    }
                    placeholder="e.g., What is the Spanish word for 'hello'?"
                    rows={2}
                    required
                />
            </div>

            {/* Answers Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Correct Answers *</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddAnswer(practiceIndex)}
                        className="text-sm"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Answer
                    </Button>
                </div>
                {practice.answers.map((answer, answerIndex) => (
                    <div key={answerIndex} className="flex gap-2">
                        <Input
                            value={answer}
                            onChange={(e) =>
                                onAnswerChange(
                                    practiceIndex,
                                    answerIndex,
                                    e.target.value
                                )
                            }
                            placeholder={`Answer ${
                                answerIndex + 1
                            } (e.g., hola)`}
                            required
                        />
                        {practice.answers.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    onRemoveAnswer(practiceIndex, answerIndex)
                                }
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            {/* Media uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`practice-image-${practiceIndex}`}>
                        Question Image
                    </Label>
                    <Input
                        id={`practice-image-${practiceIndex}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            onPracticeChange(
                                practiceIndex,
                                "image",
                                e.target.files?.[0] || null
                            )
                        }
                        className="file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                    />
                    {practice.image && (
                        <p className="text-xs text-muted-foreground">
                            Selected: {practice.image.name}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`practice-audio-${practiceIndex}`}>
                        Question Audio
                    </Label>
                    <Input
                        id={`practice-audio-${practiceIndex}`}
                        type="file"
                        accept="audio/*"
                        onChange={(e) =>
                            onPracticeChange(
                                practiceIndex,
                                "audio",
                                e.target.files?.[0] || null
                            )
                        }
                        className="file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                    />
                    {practice.audio && (
                        <p className="text-xs text-muted-foreground">
                            Selected: {practice.audio.name}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PracticeQuestionCard;
