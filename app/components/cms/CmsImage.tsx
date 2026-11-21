import type { CmsImage as CmsImageType } from "@/app/lib/cms/types";

type Props = {
    image: CmsImageType;
    fallbackAlt?: string;
    className?: string;
    eager?: boolean;
};


export default function CmsImage({ image, fallbackAlt = "", className, eager }: Props) {
    if (!image?.url) return null;
    return (
        <img src={image.url} alt={image.alt || fallbackAlt} className={className} loading={eager ? "eager" : "lazy"} decoding="async" />
    );
}
