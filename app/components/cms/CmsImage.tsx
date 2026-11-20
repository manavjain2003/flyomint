import type { CmsImage as CmsImageType } from "@/app/lib/cms/types";

type Props = {
    image: CmsImageType;
    fallbackAlt?: string;
    className?: string;
    eager?: boolean;
};

/**
 * Renders a CMS (Cloudinary) image. A plain <img> is used on purpose: admins can paste URLs from any host,
 * which next/image would reject unless every host was whitelisted. Renders nothing when there is no image.
 */
export default function CmsImage({ image, fallbackAlt = "", className, eager }: Props) {
    if (!image?.url) return null;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={image.alt || fallbackAlt} className={className} loading={eager ? "eager" : "lazy"} decoding="async" />
    );
}
