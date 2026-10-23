"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedInSession } from "@/app/components/booking/LoginDrawer";

export function useRequireAuth() {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        function check() {
            if (isLoggedInSession()) {
                setReady(true);
            } else {
                router.replace("/");
            }
        }
        check();
        window.addEventListener("flyomint:logout", check);
        return () => window.removeEventListener("flyomint:logout", check);
    }, [router]);

    return ready;
}