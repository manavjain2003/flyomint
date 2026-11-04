"use client";

import { startTransition, useCallback, useRef, useState } from "react";


export function useProgressiveList<T>(
    items: T[],
    { initial = 10, step = 10, rootMargin = "1600px 0px" } = {}
) {
    const [count, setCount] = useState(initial);
    const [prevItems, setPrevItems] = useState(items);
    if (prevItems !== items) {
        setPrevItems(items);
        setCount(initial);
    }

    const total = items.length;
    const hasMore = count < total;
    const observerRef = useRef<IntersectionObserver | null>(null);

    const sentinelRef = useCallback(
        (node: HTMLDivElement | null) => {
            observerRef.current?.disconnect();
            observerRef.current = null;
            if (!node || count >= total) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((e) => e.isIntersecting)) {
                        startTransition(() => setCount((c) => Math.min(c + step, total)));
                    }
                },
                { rootMargin }
            );
            observer.observe(node);
            observerRef.current = observer;
        },
        [count, total, step, rootMargin]
    );

    return { visible: items.slice(0, count), hasMore, sentinelRef };
}

/** Lets the browser skip layout/paint for cards that are far off-screen. */
export const OFFSCREEN_SKIP_STYLE = {
    contentVisibility: "auto",
    containIntrinsicSize: "auto 190px",
} as const;