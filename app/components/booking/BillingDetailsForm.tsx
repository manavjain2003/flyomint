"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineHome } from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getUserProfile } from "@/app/lib/authApi";
import { getPinCodeDetails } from "@/app/lib/flightsapi";

export type BillingAddress = {
    pinCode: string;
    address: string;
    city: string;
    state: string;
    stateCode: string;
    profileUpdate: boolean;
};

export type BillingAddressFormProps = {
    mandatory?: boolean;
    initial?: Partial<BillingAddress>;
    skipProfileFetch?: boolean;
    onChange: (details: BillingAddress) => void;
};

function emptyBilling(initial?: Partial<BillingAddress>): BillingAddress {
    return {
        pinCode: initial?.pinCode ?? "",
        address: initial?.address ?? "",
        city: initial?.city ?? "",
        state: initial?.state ?? "",
        stateCode: initial?.stateCode ?? "",
        profileUpdate: initial?.profileUpdate ?? true,
    };
}

function hasAnyValue(b: BillingAddress) {
    return Boolean(b.pinCode || b.address || b.city || b.state);
}

export function billingFormIsValid(details: BillingAddress | null, mandatory: boolean): boolean {
    if (!mandatory) return true;
    if (!details) return false;
    return Boolean(
        details.address.trim() &&
        details.city.trim() &&
        details.state.trim() &&
        /^\d{6}$/.test(details.pinCode.trim())
    );
}

export default function BillingAddressForm({
    mandatory = false,
    initial,
    skipProfileFetch = false,
    onChange,
}: BillingAddressFormProps) {
    const [billing, setBilling] = useState<BillingAddress>(() => emptyBilling(initial));
    const [loading, setLoading] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    const [pinError, setPinError] = useState("");
    const lastLookedUpPin = useRef<string>("");

    useEffect(() => {
        if (skipProfileFetch || hasAnyValue(emptyBilling(initial))) return;

        let cancelled = false;
        setLoading(true);

        getUserProfile()
            .then((result) => {
                if (cancelled || !result.success || !result.billing) return;
                setBilling((prev) =>
                    hasAnyValue(prev)
                        ? prev
                        : {
                              ...result.billing,
                              stateCode: (result.billing as any).stateCode ?? prev.stateCode,
                              profileUpdate: prev.profileUpdate,
                          }
                );
                if (result.billing.pinCode) {
                    lastLookedUpPin.current = result.billing.pinCode;
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const pin = billing.pinCode.trim();

        if (pin.length !== 6) {
            setPinError("");
            return;
        }
        if (pin === lastLookedUpPin.current) return;

        let cancelled = false;
        const timer = setTimeout(async () => {
            setPinLoading(true);
            setPinError("");

            const result = await getPinCodeDetails(pin);

            if (cancelled) return;
            setPinLoading(false);

            if (!result.success) {
                setPinError(result.message || "Invalid PIN code");
                setBilling((prev) => ({ ...prev, state: "", stateCode: "" }));
                return;
            }

            lastLookedUpPin.current = pin;
            setBilling((prev) => ({
                ...prev,
                state: result.stateName,
                stateCode: result.stateCode,
            }));
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [billing.pinCode]);

    useEffect(() => {
        onChange(billing);
    }, [billing]);

    function update(patch: Partial<BillingAddress>) {
        setBilling((prev) => ({ ...prev, ...patch }));
    }

    const label = (text: string) => (
        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
            {text}{mandatory ? " *" : ""}
        </label>
    );

    const inputClass =
        "w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7] bg-white dark:bg-gray-900 transition-colors";

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="grid place-items-center w-8 h-8 rounded-full bg-[#e8f4fb] text-[#1c8fc7] shrink-0">
                    <HiOutlineHome className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Billing Address
                </h3>
                {loading && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                        Loading saved address…
                    </span>
                )}
            </div>

            {/* 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">

                {/* Row 1 — PIN Code | State */}
                <div>
                    {label("PIN Code")}
                    <div className="relative">
                        <input
                            value={billing.pinCode}
                            maxLength={6}
                            inputMode="numeric"
                            onChange={(e) => update({ pinCode: e.target.value.replace(/\D/g, "") })}
                            className={`${inputClass} pr-8`}
                        />
                        {pinLoading && (
                            <AiOutlineLoading3Quarters className="w-4 h-4 text-gray-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                        )}
                    </div>
                    {pinError && (
                        <p className="text-[11px] text-red-500 mt-1">{pinError}</p>
                    )}
                </div>

                <div>
                    {label("State")}
                    <input
                        value={billing.state}
                        readOnly
                        placeholder="Auto-filled from PIN"
                        className={`${inputClass} bg-gray-50 dark:bg-gray-800 cursor-not-allowed`}
                    />
                </div>

                {/* Row 2 — City | Address */}
                <div>
                    {label("City")}
                    <input
                        value={billing.city}
                        onChange={(e) => update({ city: e.target.value })}
                        className={inputClass}
                    />
                </div>

                <div>
                    {label("Address")}
                    <input
                        value={billing.address}
                        onChange={(e) => update({ address: e.target.value })}
                        placeholder="House / flat no., street, area"
                        className={inputClass}
                    />
                </div>

            </div>

            {/* Save to profile checkbox */}
            <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={billing.profileUpdate}
                    onChange={(e) => update({ profileUpdate: e.target.checked })}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#1c8fc7] focus:ring-[#1c8fc7] cursor-pointer"
                />
                <span className="text-[13px] text-gray-600 dark:text-gray-300 leading-[1.4]">
                    Save billing details to your profile
                </span>
            </label>
        </div>
    );
}