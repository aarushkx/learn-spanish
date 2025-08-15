import LessonDetailsForm from "./lesson-detail-form";
import PracticeQuestionCard from "./practice-question-card";
import PracticeQuestionsSection from "./practice-question-section";
import SubmitSection from "./submit-section";

type PracticeQuestionForm = {
    question: string;
    answers: string[];
    image: File | null;
    audio: File | null;
    order_index: number;
};

type LessonForm = {
    title: string;
    description: string;
    order_index: number;
    image: File | null;
    practices: PracticeQuestionForm[];
};

export type { LessonForm, PracticeQuestionForm };

export {
    LessonDetailsForm,
    PracticeQuestionCard,
    PracticeQuestionsSection,
    SubmitSection,
};
