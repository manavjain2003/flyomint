"use client";

import { HiOutlineArrowRight } from "react-icons/hi";

type Post = {
    category: string;
    title: string;
};

const POSTS: Post[] = [
    {
        category: "Flyomint Travel Desk",
        title: "Cabin vs Check-in: Baggage Rules Explained",
    },
    {
        category: "Flyomint Editorial",
        title: "The 10-Point Traveler Checklist Before You Fly",
    },
    {
        category: "Flyomint Travel Desk",
        title: "How to Save on International Flights",
    },
    {
        category: "Flyomint Editorial",
        title: "Top Budget Airlines in India (2026 Guide)",
    },
];

export default function BlogSection() {
    return (
        <section className="bg-[#f5f8fb] py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-end justify-between mb-8 gap-4">
                    <div>
                        <span className="inline-block text-[#1c8fc7] text-xs font-medium mb-3">
                            Travel journal
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Reads for the runway.
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-colors shrink-0"
                    >
                        All posts
                        <HiOutlineArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {POSTS.map((post) => (
                        <PostCard key={post.title} {...post} />
                    ))}
                </div>

                <button
                    type="button"
                    className="sm:hidden mt-6 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                    All posts
                    <HiOutlineArrowRight className="w-4 h-4" />
                </button>
            </div>
        </section>
    );
}

function PostCard({ category, title }: Post) {
    return (
        <a
            href="#"
            className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-shadow"
        >
            <div
                className="aspect-[4/3] w-full"
                style={{
                    background: "linear-gradient(135deg, #eaf6fd 0%, #7cc9f0 100%)",
                }}
                aria-hidden
            />

            <div className="p-5">
                <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-2">
                    {category}
                </p>
                <h3 className="text-[15px] font-semibold text-gray-900 leading-snug group-hover:text-[#1c8fc7] transition-colors">
                    {title}
                </h3>
            </div>
        </a>
    );
}