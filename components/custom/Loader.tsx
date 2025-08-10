import { Loader2 } from "lucide-react";

const Loader = () => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="text-primary w-16 h-16 animate-spin" />
        </div>
    );
};

export default Loader;
