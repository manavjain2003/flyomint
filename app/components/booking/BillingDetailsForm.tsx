"use client";

import { useEffect, useState } from "react";
import { HiOutlineHome } from "react-icons/hi2";
import { getUserProfile , updateProfile } from "@/app/lib/authApi"; 

export type BillingAddress = {
    pinCode: string;
    address: string;
    city: string;
    state: string;
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
        profileUpdate: initial?.profileUpdate ?? false,
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
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (skipProfileFetch || hasAnyValue(emptyBilling(initial))) return;

        let cancelled = false;
        setLoadingProfile(true);

        getUserProfile()
            .then((result) => {
                if (cancelled || !result.success || !result.billing) return;
                setBilling((prev) =>
                    hasAnyValue(prev)
                        ? prev
                        : {
                              ...result.billing,
                              profileUpdate: prev.profileUpdate,
                          }
                );
            })
            .finally(() => {
                if (!cancelled) setLoadingProfile(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        onChange(billing);
    }, [billing]);

    function update(patch: Partial<BillingAddress>) {
        setBilling((prev) => ({ ...prev, ...patch }));
    }

    async function handleProfileUpdateToggle(checked: boolean) {
        setSaveError(null);
        setSaveSuccess(false);
        update({ profileUpdate: checked });

        if (!checked) return; 

        const pin = billing.pinCode.trim();
        const address = billing.address.trim();
        const city = billing.city.trim();
        const state = billing.state.trim();

        if (!address || !city || !state || !/^\d{6}$/.test(pin)) {
            setSaveError("Please fill address, city, state and a valid 6-digit PIN code before saving to profile.");
            update({ profileUpdate: false });
            return;
        }

        setSavingProfile(true);
        try {
       const res = await updateProfile({
    address,
    city,
    state,
    pinCode: pin,
});

            if (!res.success) {
                setSaveError(res.message || "Could not save billing details to profile.");
                update({ profileUpdate: false });
                return;
            }

            setSaveSuccess(true);
        } catch {
            setSaveError("Network error. Could not save to profile.");
            update({ profileUpdate: false });
        } finally {
            setSavingProfile(false);
        }
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="grid place-items-center w-8 h-8 rounded-full bg-[#e8f4fb] text-[#1c8fc7] shrink-0">
                    <HiOutlineHome className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Billing Address
                </h3>
                {loadingProfile && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">Loading saved address…</span>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-4">
                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                        Address{mandatory ? " *" : ""}
                    </label>
                    <input
                        value={billing.address}
                        onChange={(e) => update({ address: e.target.value })}
                        placeholder="House / flat no., street, area"
                        className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
                    />
                </div>

                <div className="col-span-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                        City{mandatory ? " *" : ""}
                    </label>
                    <input
                        value={billing.city}
                        onChange={(e) => update({ city: e.target.value })}
                        className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
                    />
                </div>

                <div>
                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                        State{mandatory ? " *" : ""}
                    </label>
                    <input
                        value={billing.state}
                        onChange={(e) => update({ state: e.target.value })}
                        className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
                    />
                </div>

                <div>
                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                        PIN Code{mandatory ? " *" : ""}
                    </label>
                    <input
                        value={billing.pinCode}
                        maxLength={6}
                        inputMode="numeric"
                        onChange={(e) => update({ pinCode: e.target.value.replace(/\D/g, "") })}
                        className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
                    />
                </div>
            </div>

            {/* Confirm & save to profile */}
            <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={billing.profileUpdate}
                    disabled={savingProfile}
                    onChange={(e) => handleProfileUpdateToggle(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[#1c8fc7] focus:ring-[#1c8fc7] cursor-pointer disabled:opacity-50"
                />
                <span className="text-[13px] text-gray-600 dark:text-gray-300 leading-[1.4]">
                    Confirm and save billing details to your profile
                    {savingProfile && (
                        <span className="ml-1.5 text-xs text-gray-400">Saving…</span>
                    )}
                </span>
            </label>

            {saveError && (
                <p className="mt-2 text-[12px] text-red-600 dark:text-red-400 leading-[1.4]">{saveError}</p>
            )}
            {saveSuccess && !saveError && (
                <p className="mt-2 text-[12px] text-emerald-600 dark:text-emerald-400 leading-[1.4]">
                    Billing details saved to your profile.
                </p>
            )}
        </div>
    );
}