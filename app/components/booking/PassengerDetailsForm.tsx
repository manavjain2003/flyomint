"use client";

import { useEffect, useState } from "react";
import { HiOutlineUser } from "react-icons/hi2";
import { getCountryDetails } from "@/app/lib/flightsapi";

export type TravellerCheckList = {
    AdultDOBMandate?: boolean;
    ChildDOBMandate?: boolean;
    InfantDOBMandate?: boolean;
    GST_Accepted?: boolean;
    GSTMandate?: boolean;
    PassportNo?: boolean;
    PDOE?: boolean; // Passport Date Of Expiry
    PIC?: boolean; // Passport Issuing Country
    Nationality?: boolean;
    FNMaxLen?: number;
    LNMaxLen?: number;
    FNMinLen?: number;
    LNMinLen?: number;
    AdultTitleMandate?: boolean;
    ChildTitleMandate?: boolean;
    InfantTitleMandate?: boolean;
    DocumentMandate?: boolean;
    AdultDOBStartRange?: string;
    AdultDOBEndRange?: string;
    ChildDOBStartRange?: string;
    ChildDOBEndRange?: string;
    InfantDOBStartRange?: string;
    InfantDOBEndRange?: string;
};

export type PTC = "ADT" | "CHD" | "INF";

export type PassengerDetails = {
    ptc: PTC;
    title: string;
    firstName: string;
    lastName: string;
    dob: string; // yyyy-mm-dd
    nationality: string;
    passportNo: string;
    passportExpiry: string; // yyyy-mm-dd
    passportIssuingCountry: string;
};

const TITLE_OPTIONS: Record<PTC, string[]> = {
    ADT: ["Mr", "Mrs", "Ms"],
    CHD: ["Mstr", "Miss"],
    INF: ["Mstr", "Miss"],
};

const PTC_LABEL: Record<PTC, string> = { ADT: "Adult", CHD: "Child", INF: "Infant" };

function emptyPassenger(ptc: PTC): PassengerDetails {
    return {
        ptc,
        title: "",
        firstName: "",
        lastName: "",
        dob: "",
        nationality: "",
        passportNo: "",
        passportExpiry: "",
        passportIssuingCountry: "",
    };
}

function buildInitialPassengers(
    adults: number,
    children: number,
    infants: number,
    saved: SavedByPTC = {}
): PassengerDetails[] {
    function build(ptc: PTC, count: number): PassengerDetails[] {
        const savedForPtc = saved[ptc] ?? [];
        return Array.from({ length: count }, (_, i) => {
            const base = emptyPassenger(ptc);
            const savedEntry = savedForPtc[i];
            return savedEntry ? { ...base, ...savedEntry, ptc } : base;
        });
    }
    return [...build("ADT", adults), ...build("CHD", children), ...build("INF", infants)];
}

function dobRequired(ptc: PTC, checklist: TravellerCheckList) {
    if (ptc === "ADT") return Boolean(checklist.AdultDOBMandate);
    if (ptc === "CHD") return Boolean(checklist.ChildDOBMandate);
    return Boolean(checklist.InfantDOBMandate);
}

function titleRequired(ptc: PTC, checklist: TravellerCheckList) {
    if (ptc === "ADT") return Boolean(checklist.AdultTitleMandate);
    if (ptc === "CHD") return Boolean(checklist.ChildTitleMandate);
    return Boolean(checklist.InfantTitleMandate);
}

function dobRange(ptc: PTC, checklist: TravellerCheckList): { min?: string; max?: string } {
    if (ptc === "ADT") return { min: checklist.AdultDOBStartRange, max: checklist.AdultDOBEndRange };
    if (ptc === "CHD") return { min: checklist.ChildDOBStartRange, max: checklist.ChildDOBEndRange };
    return { min: checklist.InfantDOBStartRange, max: checklist.InfantDOBEndRange };
}

const STORAGE_KEY = "flyomint:savedPassengers";

type SavedPassenger = Omit<PassengerDetails, "passportNo" | "passportExpiry">;
type SavedByPTC = Partial<Record<PTC, SavedPassenger[]>>;

function loadSavedByPTC(): SavedByPTC {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function stripSensitive(p: PassengerDetails): SavedPassenger {
    const { passportNo, passportExpiry, ...safe } = p;
    return safe;
}

function saveByPTC(passengers: PassengerDetails[]) {
    if (typeof window === "undefined") return;

    const existing = loadSavedByPTC();
    const byPtc: Record<PTC, PassengerDetails[]> = { ADT: [], CHD: [], INF: [] };
    passengers.forEach((p) => byPtc[p.ptc].push(p));

    const grouped: SavedByPTC = { ...existing };
    (Object.keys(byPtc) as PTC[]).forEach((ptc) => {
        const arr = byPtc[ptc];
        if (arr.length === 0) return;
        grouped[ptc] = arr.map((p, i) =>
            // Don't overwrite a good saved entry with a still-blank one
            p.firstName.trim() ? stripSensitive(p) : existing[ptc]?.[i] ?? stripSensitive(p)
        );
    });

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(grouped));
    } catch {
        // storage full or unavailable — safe to ignore
    }
}

function clearSavedPassengers() {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

export function passengerFormIsValid(passengers: PassengerDetails[], checklist: TravellerCheckList): boolean {
    const fnMin = checklist.FNMinLen ?? 1;
    const lnMin = checklist.LNMinLen ?? 1;

    return passengers.every((p) => {
        if (titleRequired(p.ptc, checklist) && !p.title) return false;
        if (p.firstName.trim().length < fnMin) return false;
        if (p.lastName.trim().length < lnMin) return false;
        if (dobRequired(p.ptc, checklist) && !p.dob) return false;

        //  if a DOB is present, it must fall inside the allowed range for that PTC
        if (p.dob) {
            const { min, max } = dobRange(p.ptc, checklist);
            if (min && p.dob < min) return false;
            if (max && p.dob > max) return false;
        }

        if (checklist.Nationality && !p.nationality.trim()) return false;
        if (checklist.PassportNo && checklist.DocumentMandate && !p.passportNo.trim()) return false;
        if (checklist.PDOE && checklist.DocumentMandate && !p.passportExpiry) return false;
        if (checklist.PIC && checklist.DocumentMandate && !p.passportIssuingCountry.trim()) return false;
        return true;
    });
}

//  debounced country-search combobox for Nationality
type CountryOption = { name: string; codeShort: string };

function NationalityField({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<CountryOption[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        if (!open) return;
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const handle = setTimeout(async () => {
            const res = await getCountryDetails({ searchText: trimmed });
            setLoading(false);
            setResults(res.success ? res.countries : []);
        }, 300);
        return () => clearTimeout(handle);
    }, [query, open]);

    function handleSelect(country: CountryOption) {
        onChange(country.name);
        setQuery(country.name);
        setOpen(false);
    }

    return (
        <div className="relative">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                Nationality *
            </label>
            <input
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Start typing a country"
                autoComplete="off"
                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
            />
            {open && query.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    {loading && <p className="text-xs text-gray-400 px-3 py-2">Searching...</p>}
                    {!loading && results.length === 0 && (
                        <p className="text-xs text-gray-400 px-3 py-2">No matches</p>
                    )}
                    {!loading &&
                        results.map((c) => (
                            <button
                                key={c.codeShort}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()} // keep input focused so onBlur doesn't fire first
                                onClick={() => handleSelect(c)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#e8f4fb]"
                            >
                                {c.name}
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}

export type PassengerDetailsFormProps = {
    adults: number;
    children: number;
    infants: number;
    checklist: TravellerCheckList;
    onChange: (passengers: PassengerDetails[]) => void;
};

export default function PassengerDetailsForm({
    adults,
    children,
    infants,
    checklist,
    onChange,
}: PassengerDetailsFormProps) {
    const [hasSaved, setHasSaved] = useState(false);

    const [passengers, setPassengers] = useState<PassengerDetails[]>(() => {
        const saved = loadSavedByPTC();
        setHasSaved(Object.keys(saved).length > 0);
        return buildInitialPassengers(adults, children, infants, saved);
    });

    useEffect(() => {
        setPassengers(buildInitialPassengers(adults, children, infants, loadSavedByPTC()));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adults, children, infants]);

    useEffect(() => {
        onChange(passengers);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [passengers]);

    // Persist to localStorage, debounced so we're not writing on every keystroke
    useEffect(() => {
        const handle = setTimeout(() => saveByPTC(passengers), 500);
        return () => clearTimeout(handle);
    }, [passengers]);

    function updatePassenger(index: number, patch: Partial<PassengerDetails>) {
        setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    }

    function handleClearSaved() {
        clearSavedPassengers();
        setHasSaved(false);
    }

    const fnMax = checklist.FNMaxLen ?? 50;
    const lnMax = checklist.LNMaxLen ?? 50;
    const showPassportBlock = Boolean(checklist.PassportNo || checklist.PDOE || checklist.PIC);
    const passportRequired = Boolean(checklist.DocumentMandate);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
<div className="flex items-center gap-2 mb-5 justify-between">
    <div className="flex items-center gap-2">
        <span className="grid place-items-center w-8 h-8 rounded-full bg-[#e8f4fb] text-[#1c8fc7] shrink-0">
            <HiOutlineUser className="w-4 h-4" />
        </span>
        <h3 className="text-base font-bold text-gray-900">Passenger Details</h3>
    </div>
    {hasSaved && (
        <button
            type="button"
            onClick={handleClearSaved}
            className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
        >
            Clear saved details
        </button>
    )}
</div>

            <div className="space-y-6">
                {passengers.map((p, idx) => {
                    const paxNumber =
                        passengers.slice(0, idx + 1).filter((x) => x.ptc === p.ptc).length;
                    const { min: dobMin, max: dobMax } = dobRange(p.ptc, checklist);

                    return (
                        <div key={idx} className={idx > 0 ? "pt-6 border-t border-gray-100" : ""}>
                            <p className="text-sm font-semibold text-gray-900 mb-3">
                                {PTC_LABEL[p.ptc]} {paxNumber}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                                        Title{titleRequired(p.ptc, checklist) ? " *" : ""}
                                    </label>
                                    <select
                                        value={p.title}
                                        onChange={(e) => updatePassenger(idx, { title: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-2 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                                    >
                                        <option value="">Select</option>
                                        {TITLE_OPTIONS[p.ptc].map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-1 sm:col-span-1">
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                                        First Name *
                                    </label>
                                    <input
                                        value={p.firstName}
                                        maxLength={fnMax}
                                        onChange={(e) => updatePassenger(idx, { firstName: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                                        Last Name *
                                    </label>
                                    <input
                                        value={p.lastName}
                                        maxLength={lnMax}
                                        onChange={(e) => updatePassenger(idx, { lastName: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                                        Date of Birth{dobRequired(p.ptc, checklist) ? " *" : ""}
                                    </label>
                                    <input
                                        type="date"
                                        value={p.dob}
                                        min={dobMin}
                                        max={dobMax}
                                        onChange={(e) => updatePassenger(idx, { dob: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-gray-200 px-2 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                                    />
                                </div>

                                {checklist.Nationality && (
                                    <NationalityField
                                        value={p.nationality}
                                        onChange={(v) => updatePassenger(idx, { nationality: v })}
                                    />
                                )}

                                {showPassportBlock && checklist.PassportNo && (
                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                                            Passport No{passportRequired ? " *" : ""}
                                        </label>
                                        <input
                                            value={p.passportNo}
                                            onChange={(e) => updatePassenger(idx, { passportNo: e.target.value })}
                                            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                                        />
                                    </div>
                                )}

                                {showPassportBlock && checklist.PDOE && (
                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                                            Passport Expiry{passportRequired ? " *" : ""}
                                        </label>
                                        <input
                                            type="date"
                                            value={p.passportExpiry}
                                            onChange={(e) => updatePassenger(idx, { passportExpiry: e.target.value })}
                                            className="w-full h-10 rounded-lg border border-gray-200 px-2 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                                        />
                                    </div>
                                )}

                                {showPassportBlock && checklist.PIC && (
                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                                            Passport Issuing Country{passportRequired ? " *" : ""}
                                        </label>
                                        <input
                                            value={p.passportIssuingCountry}
                                            onChange={(e) => updatePassenger(idx, { passportIssuingCountry: e.target.value })}
                                            className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-[#1c8fc7]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}