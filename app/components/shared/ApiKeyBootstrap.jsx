"use client";

import { useEffect } from "react";
import { getUniqueKey } from "@/app/lib/api";

export default function ApiKeyBootstrap() {
    useEffect(() => {
        getUniqueKey().catch((err) => {
            console.error("Failed to initialize API signature key:", err);
        });
    }, []);

    return null;
}