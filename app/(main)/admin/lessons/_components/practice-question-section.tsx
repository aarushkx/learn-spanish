import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PracticeQuestionCard from "./practice-question-card";
import { PracticeQuestionForm } from ".";

interface PracticeQuestionsSectionProps {
    practices: PracticeQuestionForm[];
    onAddPractice: () => void;
    onPracticeChange: (
        practiceIndex: number,
        field: keyof PracticeQuestionForm,
        value: string | string[] | File | null | number
    ) => void;
    onRemovePractice: (index: number) => void;
    onAddAnswer: (practiceIndex: number) => void;
    onRemoveAnswer: (practiceIndex: number, answerIndex: number) => void;
    onAnswerChange: (
        practiceIndex: number,
        answerIndex: number,
        value: string
    ) => void;
}

const PracticeQuestionsSection = ({
    practices,
    onAddPractice,
    onPracticeChange,
    onRemovePractice,
    onAddAnswer,
    onRemoveAnswer,
    onAnswerChange,
}: PracticeQuestionsSectionProps) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">
                    Practice Questions
                </h2>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddPractice}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Question
                </Button>
            </div>

            <div className="space-y-6">
                {practices.map((practice, practiceIndex) => (
                    <PracticeQuestionCard
                        key={practiceIndex}
                        practice={practice}
                        practiceIndex={practiceIndex}
                        totalPractices={practices.length}
                        onPracticeChange={onPracticeChange}
                        onRemove={onRemovePractice}
                        onAddAnswer={onAddAnswer}
                        onRemoveAnswer={onRemoveAnswer}
                        onAnswerChange={onAnswerChange}
                    />
                ))}
            </div>
        </div>
    );
};

export default PracticeQuestionsSection;
