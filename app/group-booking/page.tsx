"use client";

import React, { useState } from "react";
import { submitGroupBooking } from "@/app/lib/flightsapi";

type TripType = "one-way" | "round-trip";

interface BookingFormData {
  origin: string;
  destination: string;
  departure: string;
  returnDate: string;
  passengers: string;
  email: string;
  phone: string;
  notes: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FormFieldProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  borderLeft?: boolean;
}

const GBP_STYLES = `
  .gbp-page-hero {
    position: relative;
    overflow: hidden;
    padding: 56px 5% 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 40px;
    min-height: 520px;
  }
  .gbp-dot-grid {
    position: absolute;
    inset: 0;
    opacity: 0.4;
    pointer-events: none;
    background-image: radial-gradient(circle at 1px 1px, #d1d5db 1px, transparent 0);
    background-size: 28px 28px;
  }
  .dark .gbp-dot-grid {
    background-image: radial-gradient(circle at 1px 1px, #374151 1px, transparent 0);
    opacity: 0.5;
  }
  .gbp-glow-blob {
    position: absolute;
    bottom: -40px;
    left: 8%;
    width: 420px;
    height: 260px;
    pointer-events: none;
    background: radial-gradient(ellipse, rgba(255,140,0,0.06) 0%, transparent 70%);
  }
  .dark .gbp-glow-blob {
    background: radial-gradient(ellipse, rgba(255,140,0,0.04) 0%, transparent 70%);
  }
  .gbp-hero-copy {
    position: relative;
    z-index: 10;
    flex-shrink: 0;
    max-width: 480px;
    width: 100%;
  }
  .gbp-hero-badge::before {
    content: "•";
    color: #ff8c00;
    font-size: 18px;
    line-height: 1;
  }
  .gbp-field-row {
    display: grid;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .gbp-field-row--2col {
    grid-template-columns: 1fr 1fr;
  }
  .gbp-field-row--1col {
    grid-template-columns: 1fr;
  }
  @keyframes gbp-slide-up {
    from { opacity: 0; transform: translateX(-50%) translateY(16px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  .gbp-toast {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    padding: 14px 28px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 50;
    animation: gbp-slide-up 0.3s ease;
    background: #22c55e;
    color: #ffffff;
  }
  @media (min-width: 1024px) {
    .gbp-page-hero {
      flex-direction: row;
      min-height: 0;
    }
  }
  @media (min-width: 768px) {
    .gbp-features-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @media (max-width: 519px) {
    .gbp-field-row--2col {
      grid-template-columns: 1fr;
    }
    .gbp-field--border-left {
      border-left: none !important;
      border-top-width: 1.5px;
    }
  }
`;

const PlaneDepart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1 0-1.5.5-3.5 2.5L7 8 5.8 5.8a.7.7 0 0 0-1 0L3 8l3 3-3 3 1.8 2.2a.7.7 0 0 0 1 0L8 17l8.2 1.2c1.7.2 2.7-1 2-2.5z" />
  </svg>
);

const PlaneLand = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 19h19M6.3 14 4 6.5l3.5 2L12 4l8.2 4.8c1.5.9 2 2.8 1 4.2L19 16l-3.5-2-8.2 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PersonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const BookingIcon = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
    <rect width="80" height="80" rx="16" fill="#EEF0FF" />
    <rect x="16" y="24" width="36" height="32" rx="4" fill="#B0B8FF" />
    <rect x="20" y="28" width="28" height="4" rx="2" fill="#6B7BFF" />
    <rect x="20" y="35" width="20" height="3" rx="1.5" fill="#9BA8FF" />
    <rect x="20" y="41" width="14" height="3" rx="1.5" fill="#9BA8FF" />
    <circle cx="56" cy="52" r="14" fill="#6B7BFF" />
    <path d="M50 52 l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M38 20 Q48 10 54 18" stroke="#6B7BFF" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="54" cy="18" r="3" fill="#FF8C00" />
  </svg>
);

const PaymentIcon = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
    <rect width="80" height="80" rx="16" fill="#EEF0FF" />
    <rect x="14" y="26" width="40" height="28" rx="4" fill="#B0B8FF" />
    <rect x="14" y="33" width="40" height="8" fill="#6B7BFF" />
    <rect x="18" y="42" width="10" height="4" rx="2" fill="white" />
    <rect x="32" y="42" width="10" height="4" rx="2" fill="white" />
    <circle cx="56" cy="52" r="14" fill="#4CAF50" />
    <path d="M50 52 l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="60" cy="26" r="8" fill="#FF8C00" />
    <path d="M57 26 h6 M60 23 v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SupportIcon = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="72" height="72">
    <rect width="80" height="80" rx="16" fill="#EEF0FF" />
    <circle cx="40" cy="34" r="16" fill="#B0B8FF" />
    <circle cx="40" cy="30" r="8" fill="#6B7BFF" />
    <path d="M28 46 Q40 54 52 46" stroke="#6B7BFF" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="58" cy="22" r="10" fill="#6B7BFF" />
    <rect x="55" y="18" width="6" height="4" rx="2" fill="white" />
    <rect x="55" y="24" width="6" height="4" rx="2" fill="white" />
    <circle cx="55" cy="30" r="2" fill="white" />
    <circle cx="61" cy="30" r="2" fill="white" />
  </svg>
);

const GbpFeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="
    gbp-features-grid-item
    bg-white dark:bg-gray-900
    rounded-2xl p-8 text-left
    shadow-[0_2px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]
    border border-transparent dark:border-gray-800
    hover:shadow-[0_6px_28px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_6px_28px_rgba(0,0,0,0.4)]
    transition-shadow duration-200
  ">
    <div className="mb-5">{icon}</div>
    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
    <p className="text-[13.5px] text-gray-400 dark:text-gray-500 leading-relaxed">{description}</p>
  </div>
);

const GbpFormField: React.FC<FormFieldProps> = ({ icon, children, borderLeft = false }) => (
  <div className={`
    flex items-center gap-2.5 px-4 py-3
    bg-gray-50 dark:bg-gray-800
    ${borderLeft ? "gbp-field--border-left border-l border-gray-200 dark:border-gray-700" : ""}
  `}>
    <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 flex items-center">
      {icon}
    </span>
    {children}
  </div>
);

const GroupBookingPage: React.FC = () => {
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [formData, setFormData] = useState<BookingFormData>({
    origin: "",
    destination: "",
    departure: "",
    returnDate: "",
    passengers: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const result = await submitGroupBooking({
      origin: formData.origin,
      destination: formData.destination,
      onwardDate: formData.departure,
      returnDate: tripType === "round-trip" ? formData.returnDate : "",
      totalPax: Number(formData.passengers) || 0,
      email: formData.email,
      mobile: formData.phone,
      remark: formData.notes,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.message || "Something went wrong. Please try again.");
      return;
    }

    setReferenceId(result.referenceId);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const inputCls = `
    border-none outline-none text-[13.5px] font-medium
    text-gray-900 dark:text-gray-100
    bg-transparent w-full font-[inherit]
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  `;

  const fieldRowBorder = "border border-gray-200 dark:border-gray-700";

  return (
    <>
      <style>{GBP_STYLES}</style>

      <section className="gbp-page-hero bg-white dark:bg-gray-950">
        <div className="gbp-dot-grid" />
        <div className="gbp-glow-blob" />

        <div className="gbp-hero-copy">
          <h1 className="text-[clamp(28px,3vw,40px)] font-extrabold leading-tight text-gray-900 dark:text-gray-100 mb-4">
            Got flight{" "}
            <span className="text-[#ff8c00]">Group Travel</span>
            <br />
            plan? We&apos;re here to help!
          </h1>

          <div className="flex flex-wrap gap-6 mb-5">
            {["Discount for Group Bookings", "All Airlines Supported"].map((label) => (
              <span
                key={label}
                className="gbp-hero-badge text-[13px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5"
              >
                {label}
              </span>
            ))}
          </div>

          <p className="text-[14.5px] text-gray-500 dark:text-gray-400 leading-[1.65] max-w-[400px]">
            Please fill in the details based on your travel preferences and our
            customer service representative will get in touch with you within 1 hour.
          </p>
        </div>

        <div className="
          relative z-10
          bg-white dark:bg-gray-900
          rounded-[20px]
          shadow-[0_4px_32px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.05)]
          dark:shadow-[0_4px_32px_rgba(0,0,0,0.4),0_1px_4px_rgba(0,0,0,0.2)]
          border border-transparent dark:border-gray-800
          p-7 w-full max-w-[480px] flex-shrink-0
        ">
          <div className="flex items-center gap-2 mb-6 bg-gray-100 dark:bg-gray-800 rounded-full p-1 w-fit">
            {(["one-way", "round-trip"] as TripType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTripType(type)}
                className={`
                  px-5 py-2 rounded-full text-[13.5px] font-semibold border-none cursor-pointer
                  transition-all duration-200 font-[inherit]
                  ${tripType === type
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }
                `}
              >
                {type === "one-way" ? "One Way" : "Round Trip"}
              </button>
            ))}
          </div>

          <div className={`gbp-field-row gbp-field-row--2col ${fieldRowBorder}`}>
            <GbpFormField icon={<PlaneDepart />}>
              <input className={inputCls} name="origin" value={formData.origin} onChange={handleChange} placeholder="Enter origin" />
            </GbpFormField>
            <GbpFormField icon={<PlaneLand />} borderLeft>
              <input className={inputCls} name="destination" value={formData.destination} onChange={handleChange} placeholder="Enter destination" />
            </GbpFormField>
          </div>

          <div className={`gbp-field-row gbp-field-row--1col ${fieldRowBorder}`}>
            <GbpFormField icon={<CalendarIcon />}>
              <input
                className={inputCls}
                name="departure"
                value={formData.departure}
                onChange={handleChange}
                placeholder="Departure"
                type="text"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
              />
            </GbpFormField>
          </div>

          {tripType === "round-trip" && (
            <div className={`gbp-field-row gbp-field-row--1col ${fieldRowBorder}`}>
              <GbpFormField icon={<CalendarIcon />}>
                <input
                  className={inputCls}
                  name="returnDate"
                  value={formData.returnDate}
                  onChange={handleChange}
                  placeholder="Return date"
                  type="text"
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => { if (!e.target.value) e.target.type = "text"; }}
                />
              </GbpFormField>
            </div>
          )}

          <div className={`gbp-field-row gbp-field-row--1col ${fieldRowBorder}`}>
            <GbpFormField icon={<PersonIcon />}>
              <input
                className={inputCls}
                name="passengers"
                value={formData.passengers}
                onChange={handleChange}
                placeholder="Number of passengers"
                type="number"
                min={1}
              />
            </GbpFormField>
          </div>

          <div className={`gbp-field-row gbp-field-row--2col ${fieldRowBorder}`}>
            <GbpFormField icon={<MailIcon />}>
              <input className={inputCls} name="email" value={formData.email} onChange={handleChange} placeholder="Email address" type="email" />
            </GbpFormField>
            <GbpFormField icon={<PhoneIcon />} borderLeft>
              <input className={inputCls} name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 Phone number" type="tel" />
            </GbpFormField>
          </div>

          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional details or special requirements about your trip."
            className="
              w-full min-h-[80px] resize-y
              border border-gray-200 dark:border-gray-700
              rounded-xl px-4 py-3
              text-[13.5px] font-medium font-[inherit]
              text-gray-900 dark:text-gray-100
              bg-gray-50 dark:bg-gray-800
              outline-none leading-relaxed
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              focus:border-[#ff8c00] dark:focus:border-[#ff8c00]
              transition-colors duration-200
              mb-4
            "
          />

          {error && (
            <p className="text-[13px] text-red-500 dark:text-red-400 mb-3 font-medium">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || submitted}
            className={`
              w-full py-4 text-[15px] font-bold text-white
              rounded-xl border-none
              transition-colors duration-200 tracking-wide font-[inherit]
              active:scale-[0.99]
              ${loading || submitted ? "cursor-not-allowed opacity-90" : "cursor-pointer"}
              ${submitted
                ? "bg-green-500"
                : loading
                  ? "bg-[#ffaa44]"
                  : "bg-[#ff8c00] hover:bg-[#e67e00]"
              }
            `}
          >
            {submitted ? "✓ Request Submitted!" : loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-950 px-[5%] py-[72px] text-center">
        <h2 className="text-[clamp(22px,2.5vw,32px)] font-extrabold text-gray-900 dark:text-gray-100 mb-2.5">
          Why book with ixigo?
        </h2>
        <p className="text-[15px] text-gray-400 dark:text-gray-500 mb-12">
          Booking support for all airline carriers, at lowest possible fares.
        </p>

        <div className="gbp-features-grid grid grid-cols-1 gap-6 max-w-[960px] mx-auto">
          <GbpFeatureCard
            icon={<BookingIcon />}
            title="Customised Booking Options"
            description="We customise and curate your trip as per your travel preferences. Just let us know!"
          />
          <GbpFeatureCard
            icon={<PaymentIcon />}
            title="Cashless Payments"
            description="We provide 100% online payment support, so you don't have to worry about paying in cash."
          />
          <GbpFeatureCard
            icon={<SupportIcon />}
            title="24/7 Premium Support"
            description="Leave all your travel worries to us, as we are here to help you around the clock."
          />
        </div>
      </section>

      {submitted && (
        <div className="gbp-toast">
          ✓ We&apos;ll reach out within 1 hour!
          {referenceId && (
            <span className="block text-[12px] font-normal opacity-90 mt-0.5">
              Ref: {referenceId}
            </span>
          )}
        </div>
      )}
    </>
  );
};

export default GroupBookingPage;