import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

const Logo = () => {
    return (
        <div className="flex items-center cursor-pointer">
            <Link href={"/"} className="text-lg text-primary font-semibold">
                {APP_NAME}
            </Link>
        </div>
    );
};

export default Logo;
