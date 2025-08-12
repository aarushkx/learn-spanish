import Link from "next/link";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-center mt-24">
                Landing Page
            </h1>

            <div className="flex justify-center gap-4 mt-4">
                <Button asChild>
                    <Link href="/sign-up">Sign up</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/sign-in">Sign in</Link>
                </Button>
            </div>
        </div>
    );
};

export default LandingPage;
