"use client";

import React, { useState } from "react";

export default function ContactPage() {
  const [message, setMessage] = useState("");

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <p className="text-sm font-medium text-sky-500 mb-2">Contact</p>
          <h1 className="text-4xl font-bold text-slate-900">Contact us</h1>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8">
            <p className="text-sm text-slate-500">
              We answer every message. Here&apos;s the fastest way to reach us.
            </p>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                For existing bookings
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Open{" "}
                <a href="#" className="text-sky-500 hover:underline font-medium">
                  My Trips
                </a>{" "}
                and use the &quot;Help with this booking&quot; button. Tickets raised
                this way reach the right agent instantly with your PNR already
                attached.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                General support
              </h2>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-800 font-medium">Email:</span>
                  <a
                    href="mailto:hello@flyomint.com"
                    className="text-sky-500 hover:underline font-medium"
                  >
                    hello@flyomint.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-800 font-medium">
                    Phone (India, 24x7):
                  </span>
                  <span>+91-80-4000-0000</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-800 font-medium">WhatsApp:</span>
                  <span>+91-98100-00000</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                Business & partnerships
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                For airline, corporate, or group-travel partnerships, email{" "}
                <a
                  href="mailto:partners@flyomint.com"
                  className="text-sky-500 hover:underline font-medium"
                >
                  partners@flyomint.com
                </a>{" "}
                with a one-line intent and we&apos;ll route you to the right person
                within a business day.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">Office</h2>
              <address className="not-italic text-sm text-slate-600 leading-relaxed">
                Flyomint Technologies Pvt. Ltd.
                <br />
                4th Floor, Prestige Atlanta, 80 Feet Road, Koramangala,
                <br />
                Bengaluru 560034, Karnataka, India.
              </address>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Send us a message
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              We&apos;ll reply to your registered email.
            </p>

            <form className="space-y-5">
              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1.5">
                    Full name
                    <span className="text-red-500">*</span>
                    <span className="inline-flex items-center gap-1 ml-1 text-[11px] text-slate-400 font-normal">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      from your account
                    </span>
                  </label>
                  <input
                    type="text"
                    defaultValue="Manav"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1.5">
                    Email
                    <span className="text-red-500">*</span>
                    <span className="inline-flex items-center gap-1 ml-1 text-[11px] text-slate-400 font-normal">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      from your account
                    </span>
                  </label>
                  <input
                    type="email"
                    defaultValue="manav@gmail.com"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Phone & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Phone <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98100 00000"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Subject <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Refund, booking issue, etc."
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={5}
                    maxLength={4000}
                    placeholder="Tell us what's going on. If it's about a booking, include your FF reference."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-y"
                  />
                  <div className="text-right text-xs text-slate-400 mt-1">
                    {message.length} / 4000
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <p className="text-[11px] text-slate-400">
                  We reply to every message. Average response time &lt; 2 hours.
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-full transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Send message
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}