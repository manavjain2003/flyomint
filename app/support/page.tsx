import Link from "next/link";

export const metadata = {
    title: "Help center",
};

export default function HelpCenterPage() {
    return (
        <main className="min-h-screen bg-[#f7f8fa]">
            <div className="max-w-3xl mx-auto px-6 sm:px-0 pt-20 pb-24">
                {/* Header */}
                <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">
                    Help center
                </h1>
                <p className="text-sm text-gray-400 mb-10">Last updated 7 Jun 2026</p>

                {/* Intro */}
                <p className="text-[15px] text-gray-600 leading-relaxed mb-10">
                    Most questions are already answered on the{" "}
                    <Link href="/faqs" className="text-[#1c8fc7] underline underline-offset-2">
                        FAQs page
                    </Link>
                    . If you need a human:
                </p>

                {/* Urgent */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">
                        Urgent (travel within 24 hours)
                    </h2>
                    <p className="text-[15px] text-gray-600 leading-relaxed">
                        Call <span className="font-semibold text-gray-900">+91-80-4000-0000</span>{" "}
                        — we route urgent calls to senior agents first.
                    </p>
                </section>

                {/* Regular */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Regular</h2>
                    <p className="text-[15px] text-gray-600 leading-relaxed">
                        Email{" "}
                        <a
                            href="mailto:hello@flyomint.com"
                            className="text-[#1c8fc7] underline underline-offset-2"
                        >
                            hello@flyomint.com
                        </a>
                        . Average response time: under 2 hours during business hours, 12 hours
                        overnight.
                    </p>
                </section>

                {/* Refund status */}
                <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Refund status</h2>
                    <p className="text-[15px] text-gray-600 leading-relaxed">
                        Check your refund timeline in{" "}
                        <Link href="/my-trips" className="text-[#1c8fc7] underline underline-offset-2">
                            My Trips
                        </Link>{" "}
                        → Booking → Refund status. Bank settlement can take up to 7 working days
                        beyond our initiation.
                    </p>
                </section>
            </div>
        </main>
    );
}