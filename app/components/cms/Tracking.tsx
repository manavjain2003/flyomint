"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { track, type TrackPayload } from "@/app/lib/cms/browser";

/** Records a page view for the CMS reports (routes, blogs, offers). Skipped in preview mode. */
export function TrackView({ refType, refId, label, disabled }: { refType: TrackPayload["refType"]; refId: string; label?: string; disabled?: boolean }) {
    useEffect(() => {
        if (disabled) return;
        track({ type: "view", refType, refId, label });
    }, [refType, refId, label, disabled]);
    return null;
}

/** Link that records a click (banners, offers) before navigating. */
export function TrackedLink({
    href, refType, refId, label, className, children, external,
}: {
    href: string; refType: TrackPayload["refType"]; refId: string; label?: string; className?: string; children: ReactNode; external?: boolean;
}) {
    const onClick = () => track({ type: "click", refType, refId, label });
    if (external) {
        return <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>{children}</a>;
    }
    return <Link href={href} onClick={onClick} className={className}>{children}</Link>;
}
