This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## CMS integration (flyomint-cms)

All marketing/content on this site is managed in [flyomint-cms](https://github.com/manavjain2003/flyomint-cms) and read through its public API
(`/api/public`). The booking flow (search, booking, payment, login) still uses the booking backend and is unchanged.

### Setup

1. Run the CMS server (`flyomint-cms/server`, default port 5000) and seed it (`npm run seed`).
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_CMS_API_URL` (e.g. `http://localhost:5000/api/public`) and `NEXT_PUBLIC_SITE_URL`.
3. `npm run dev`.

Content is cached for 60 seconds (same as the CMS), so admin changes appear within a minute. If the CMS is unreachable the home page falls back to the search box only and content pages show an error page rather than a broken one.

### What is driven by the CMS

| Area | Where |
| --- | --- |
| Logo, favicon, site name, header phone, sticky header, sign-in button, main menu | `Navbar`, `app/layout.tsx` |
| Top offer strip, announcement bar, popups, cookie banner, WhatsApp/call buttons, maintenance mode | `app/layout.tsx`, `components/cms/*` |
| Footer (contact, social, menus, popular links, payment logos, app links, SEO text, copyright) | `components/layout/Footer.tsx` |
| Home sections (order, headings, enabled flags) | `app/page.tsx` |
| Search box rules (trip types, passenger limits, cabins, special fares, defaults, popular cities, placeholders, errors) | `components/home/Home.tsx` |
| Blog, guides, offers, airlines, destinations, domestic/international routes | `app/blog`, `app/guides`, `app/offers`, `app/airlines`, `app/destinations`, `app/*-flights` |
| About, privacy, terms, disclaimer, refund, special-fare pages | `app/[slug]` (see `app/lib/cms/pages.ts`) |
| Help center, contact page + enquiry form, FAQs, newsletter (+ confirm/unsubscribe) | `app/help-center`, `app/contact-us`, `app/faqs`, `app/newsletter` |
| SEO (titles, canonical, Open Graph, JSON-LD), sitemap.xml, robots.txt, 301/302 redirects, GA/GTM/Pixel + custom scripts | `app/lib/cms/seo.ts`, `app/sitemap.xml`, `app/robots.txt`, `proxy.ts`, `components/cms/Analytics.tsx` |
| Draft preview (`?preview=<token>` links from the CMS) | detail pages |
| View/click analytics sent to the CMS (`/track`) | `components/cms/Tracking.tsx` |

URL structure follows the CMS (`/blog`, `/help-center`, `/contact-us`, `/about-us`, ...). Old URLs (`/blogs`, `/support`, `/contact`, ...) redirect permanently.
