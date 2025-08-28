"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { Lesson } from "@/types/index";

interface LessonCardProps {
    lesson: Lesson;
    onLessonClick: (lesson: Lesson) => void;
    getImageSrc: (imagePath?: string) => string | null;
}

const LessonCard = ({
    lesson,
    onLessonClick,
    getImageSrc,
}: LessonCardProps) => {
    const imageSrc = getImageSrc(lesson.image);

    return (
        <div
            className="group border rounded-lg overflow-hidden bg-card hover:shadow-xs transition-all duration-200 cursor-pointer"
            onClick={() => onLessonClick(lesson)}
        >
            {/* Lesson Image */}
            <div className="aspect-video bg-muted relative overflow-hidden">
                {imageSrc ? (
                    <Image
                        src={imageSrc}
                        alt={lesson.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        <BookOpen className="w-12 h-12 text-muted-foreground" />
                    </div>
                )}

                {/* Lesson Number */}
                <div className="absolute top-3 left-3">
                    <Badge variant="secondary">
                        Lesson {lesson.order_index}
                    </Badge>
                </div>
            </div>

            {/* Lesson Content */}
            <div className="p-6 space-y-3">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {lesson.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                        {lesson.description}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LessonCard;
