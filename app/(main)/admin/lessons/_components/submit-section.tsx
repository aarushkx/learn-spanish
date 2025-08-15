import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface SubmitSectionProps {
    isSubmitting: boolean;
    onCancel: () => void;
}

const SubmitSection = ({ isSubmitting, onCancel }: SubmitSectionProps) => {
    return (
        <div className="flex justify-end space-x-4">
            <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
            >
                Cancel
            </Button>
            <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Creating..." : "Create Lesson"}
            </Button>
        </div>
    );
};

export default SubmitSection;
