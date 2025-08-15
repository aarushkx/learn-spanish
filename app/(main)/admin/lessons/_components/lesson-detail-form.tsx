import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LessonForm } from ".";

interface LessonDetailsFormProps {
    lessonForm: LessonForm;
    onLessonChange: (
        field: keyof Omit<LessonForm, "practices">,
        value: string | number | File | null
    ) => void;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const LessonDetailsForm = ({
    lessonForm,
    onLessonChange,
    onImageChange,
}: LessonDetailsFormProps) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-4">
                    Lesson Details
                </h2>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Lesson Title *</Label>
                        <Input
                            id="title"
                            value={lessonForm.title}
                            onChange={(e) =>
                                onLessonChange("title", e.target.value)
                            }
                            placeholder="e.g., Basic Greetings"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order_index">Order Index *</Label>
                        <Input
                            id="order_index"
                            type="number"
                            min="1"
                            value={lessonForm.order_index}
                            onChange={(e) =>
                                onLessonChange(
                                    "order_index",
                                    parseInt(e.target.value) || 1
                                )
                            }
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                        id="description"
                        value={lessonForm.description}
                        onChange={(e) =>
                            onLessonChange("description", e.target.value)
                        }
                        placeholder="Describe what students will learn in this lesson"
                        rows={3}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="lesson-image">Lesson Image</Label>
                    <Input
                        id="lesson-image"
                        type="file"
                        accept="image/*"
                        onChange={onImageChange}
                        className="file:mr-4 file:px-4 pr-8 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {lessonForm.image && (
                        <p className="text-xs text-muted-foreground">
                            Selected: {lessonForm.image.name}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LessonDetailsForm;
