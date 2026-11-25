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
    // Only alignment survives. Inline colours pasted into the CMS editor (e.g. black text) would be
    // unreadable in the opposite theme, so text colour is always controlled by the site's own CSS.
    allowedStyles: {
        "*": {
            "text-align": [/^(left|right|center|justify)$/],
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
export const cleanHtml = (html?: string | null): string => (html ? wrapTables(sanitizeHtml(html, OPTIONS)) : "");

/** Wraps tables so wide ones scroll inside a bordered box while columns keep their natural alignment. */
const wrapTables = (html: string): string =>
    html.replace(/<table(\s|>)/gi, '<div class="cms-table"><table$1').replace(/<\/table>/gi, "</table></div>");

/** Plain-text version (for card excerpts). */
export const plainText = (html?: string | null, max = 160): string => {
    const text = sanitizeHtml(html || "", { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};
