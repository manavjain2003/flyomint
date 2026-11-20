import sanitizeHtml from "sanitize-html";

const OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: [
        ...sanitizeHtml.defaults.allowedTags,
        "img", "h1", "h2", "figure", "figcaption", "u", "s", "mark", "iframe", "span", "div",
    ],
    allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["class", "style"],
        a: ["href", "name", "target", "rel"],
        img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
        iframe: ["src", "width", "height", "allowfullscreen", "title", "frameborder"],
        td: ["colspan", "rowspan"],
        th: ["colspan", "rowspan"],
    },
    allowedStyles: {
        "*": {
            "text-align": [/^(left|right|center|justify)$/],
            color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i],
        },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com", "www.google.com"],
    transformTags: {
        a: (tagName, attribs) => {
            const external = /^https?:\/\//i.test(attribs.href || "");
            return {
                tagName,
                attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
            };
        },
        img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
};

/** Cleans admin-authored rich text before it is rendered with dangerouslySetInnerHTML. */
export const cleanHtml = (html?: string | null): string => (html ? sanitizeHtml(html, OPTIONS) : "");

/** Plain-text version (for card excerpts). */
export const plainText = (html?: string | null, max = 160): string => {
    const text = sanitizeHtml(html || "", { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};
