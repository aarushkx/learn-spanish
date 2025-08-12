import { Loader2 } from "lucide-react";

const Loader = ({ text }: { text?: string }) => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            {text && <span className="ml-2">{text}</span>}
        </div>
    );
};

export default Loader;
