export type UserProfile = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    created_at: any;
};

export type PracticeQuestion = {
    question: string;
    answers: string[];
    image: string;
    audio: string;
    order_index: number;
};

export type Lesson = {
    title: string;
    description: string;
    order_index: number;
    image: string;
    practices: PracticeQuestion[];
};

export type Progress = {
    id: string;
    lesson_id: string;
    user_id: string;
    is_completed: boolean;
};
