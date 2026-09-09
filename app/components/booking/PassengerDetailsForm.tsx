"use client";

import { useEffect, useState, useRef } from "react";
import {
    HiOutlineUser,
    HiOutlineIdentification,
    HiOutlineMagnifyingGlass,
    HiOutlineXMark
} from "react-icons/hi2";
import { getCountryDetails, getTravelers } from "@/app/lib/flightsapi";

export type TravellerCheckList = {
    AdultDOBMandate?: boolean;
    ChildDOBMandate?: boolean;
    InfantDOBMandate?: boolean;
    GST_Accepted?: boolean;
    GSTMandate?: boolean;
    PassportNo?: boolean;
    PDOE?: boolean;
    PIC?: boolean;
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
    FnuMessage?: string;
    LnuMessage?: string;
};

export type PTC = "ADT" | "CHD" | "INF";

export type PassengerDetails = {
    ptc: PTC;
    title: string;
    firstName: string;
    lastName: string;
    dob: string;
    nationality: string;
    passportNo: string;
    passportExpiry: string;
    passportIssuingCountry: string;
    documentNo: string;
};

type SavedTraveler = {
    travelerId: number;
    title: string;
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    documentId: string;
    nationalityCode: string;
    passportNo: string;
    pic: string;
    pdoi: string;
    pdoe: string;
    ffNo: string;
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
        documentNo: "",
    };
}

function buildInitialPassengers(
    adults: number,
    children: number,
    infants: number
): PassengerDetails[] {
    function build(ptc: PTC, count: number): PassengerDetails[] {
        return Array.from({ length: count }, () => emptyPassenger(ptc));
    }
    return [...build("ADT", adults), ...build("CHD", children), ...build("INF", infants)];
}

function dobRequired(ptc: PTC, checklist: TravellerCheckList) {
    if (ptc === "ADT") return Boolean(checklist.AdultDOBMandate);
    if (ptc === "CHD") return Boolean(checklist.ChildDOBMandate);
    return Boolean(checklist.InfantDOBMandate);
}

function firstNameRequired(checklist: TravellerCheckList) {
    return (checklist.FnuMessage ?? "required").toLowerCase() === "required";
}

function lastNameRequired(checklist: TravellerCheckList) {
    return (checklist.LnuMessage ?? "required").toLowerCase() === "required";
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

function classifyPTC(dob: string, checklist: TravellerCheckList): PTC | null {
    if (!dob) return null;
    const ranges: [PTC, string | undefined, string | undefined][] = [
        ["INF", checklist.InfantDOBStartRange, checklist.InfantDOBEndRange],
        ["CHD", checklist.ChildDOBStartRange, checklist.ChildDOBEndRange],
        ["ADT", checklist.AdultDOBStartRange, checklist.AdultDOBEndRange],
    ];
    for (const [ptc, min, max] of ranges) {
        if (!min && !max) continue;
        if (min && dob < min) continue;
        if (max && dob > max) continue;
        return ptc;
    }
    return null;
}

function normalizeTitleForPTC(title: string, ptc: PTC): string {
    const match = TITLE_OPTIONS[ptc].find(
        (o) => o.toLowerCase() === (title || "").toLowerCase()
    );
    return match ?? "";
}


function determineTitle(gender: string, ptc: PTC, savedTitle?: string): string {
    const g = (gender || "").trim().toUpperCase();

    if (ptc === "CHD" || ptc === "INF") {
        if (g === "MALE") return "Mstr";
        if (g === "FEMALE") return "Miss";
        return normalizeTitleForPTC(savedTitle || "", ptc);
    }

    if (g === "MALE") return "Mr";
    if (g === "FEMALE") {
        const saved = normalizeTitleForPTC(savedTitle || "", ptc);
        return saved === "Mrs" || saved === "Ms" ? saved : "Ms";
    }
    return normalizeTitleForPTC(savedTitle || "", ptc);
}

function isPlaceholderDate(d?: string) {
    return !d || d === "0001-01-01";
}

function formatSavedDOB(dob?: string) {
    if (isPlaceholderDate(dob)) return "";
    const d = new Date(dob!);
    if (isNaN(d.getTime())) return dob || "";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function titleCase(s?: string) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function travelerInitials(firstName?: string, lastName?: string) {
    const a = (firstName || "").trim().charAt(0);
    const b = (lastName || "").trim().charAt(0);
    return (a + b).toUpperCase() || "?";
}

export function passengerFormIsValid(passengers: PassengerDetails[], checklist: TravellerCheckList): boolean {
    const fnMin = checklist.FNMinLen ?? 1;
    const lnMin = checklist.LNMinLen ?? 1;
    const fnRequired = firstNameRequired(checklist);
    const lnRequired = lastNameRequired(checklist);

    return passengers.every((p) => {
        if (titleRequired(p.ptc, checklist) && !p.title) return false;

        const firstName = p.firstName.trim();
        const lastName = p.lastName.trim();

        if (fnRequired && firstName.length < fnMin) return false;
        if (!fnRequired && firstName.length > 0 && firstName.length < fnMin) return false;

        if (lnRequired && lastName.length < lnMin) return false;
        if (!lnRequired && lastName.length > 0 && lastName.length < lnMin) return false;

        if (dobRequired(p.ptc, checklist) && !p.dob) return false;

        if (p.dob) {
            const { min, max } = dobRange(p.ptc, checklist);
            if (min && p.dob < min) return false;
            if (max && p.dob > max) return false;
        }

        if (checklist.Nationality && !p.nationality.trim()) return false;
        if (checklist.PassportNo && checklist.DocumentMandate && !p.passportNo.trim()) return false;
        if (checklist.PDOE && checklist.DocumentMandate && !p.passportExpiry) return false;
        if (checklist.PIC && checklist.DocumentMandate && !p.passportIssuingCountry.trim()) return false;
        if (checklist.DocumentMandate && !p.documentNo.trim()) return false;
        return true;
    });
}

type CountryOption = { name: string; codeShort: string };

/**
 * Searchable country picker backed by getCountryDetails. Used for both the
 * Nationality field and the Passport Issuing Country field — both store a
 * 2-letter country code (codeShort) but display the resolved full country
 * name, exactly the same way, so the lookup/resolve/search logic lives here
 * once and each caller just supplies its own label/placeholder.
 */
function CountryField({
    label,
    value,
    onChange,
    required,
    placeholder = "Start typing a country",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
    placeholder?: string;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<CountryOption[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Tracks the code whose name is already correctly reflected in `query`,
    // so we don't refetch after the user's own click-to-select.
    const resolvedCodeRef = useRef<string | null>(null);

    useEffect(() => {
        if (!value) {
            resolvedCodeRef.current = null;
            setQuery("");
            return;
        }

        // Already resolved locally (e.g. user just picked it from the dropdown)
        if (resolvedCodeRef.current === value) return;

        let cancelled = false;
        (async () => {
            const res = await getCountryDetails({ searchText: value });
            if (cancelled) return;
            if (res.success) {
                const match = res.countries.find(
                    (c: CountryOption) => c.codeShort.toLowerCase() === value.toLowerCase()
                );
                if (match) {
                    resolvedCodeRef.current = value;
                    setQuery(match.name);
                    return;
                }
            }
            // fallback if lookup fails — at least don't leave it blank
            resolvedCodeRef.current = value;
            setQuery(value);
        })();

        return () => {
            cancelled = true;
        };
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
        resolvedCodeRef.current = country.codeShort;
        onChange(country.codeShort);
        setQuery(country.name);
        setOpen(false);
    }

    return (
        <div className="relative">
            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                {label}{required ? " *" : ""}
            </label>
            <input
                value={query}
                onChange={(e) => {
                    resolvedCodeRef.current = null;
                    setQuery(e.target.value);
                    onChange("");
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
            />
            {open && query.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    {loading && <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">Searching...</p>}
                    {!loading && results.length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">No matches</p>
                    )}
                    {!loading &&
                        results.map((c) => (
                            <button
                                key={c.codeShort}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelect(c)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#e8f4fb]"
                            >
                                {c.name}
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}

function CustomSelect({
    label,
    value,
    options,
    onSelect,
    isOpen,
    onToggle,
    displayValue,
}: {
    label: string;
    value: string;
    options: string[];
    onSelect: (v: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    displayValue?: (v: string) => string;
}) {
    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className={`w-full h-10 rounded-lg border px-3 text-sm text-left flex items-center justify-between outline-none transition-colors
                        ${isOpen ? "border-[#1c8fc7] ring-1 ring-[#1c8fc7]" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}
                        bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
            >
                <span className={value ? "" : "text-gray-400 dark:text-gray-500"}>
                    {value ? (displayValue ? displayValue(value) : value) : label}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto overscroll-contain filter-scrollbar">
                        {options.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => onSelect(opt)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors
        ${value === opt
                                        ? "bg-[#e8f4fb] text-[#1c8fc7] font-medium"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                            >
                                {displayValue ? displayValue(opt) : opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function DOBField({
    value,
    onChange,
    min,
    max,
    required,
}: {
    value: string;
    onChange: (v: string) => void;
    min?: string;
    max?: string;
    required?: boolean;
}) {
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [openDropdown, setOpenDropdown] = useState<"day" | "month" | "year" | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    useEffect(() => {
        if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [y, m, d] = value.split("-");
            setYear(y);
            setMonth(m);
            setDay(d);
        } else {
            setYear("");
            setMonth("");
            setDay("");
        }
    }, [value]);

    function parseParts(s?: string) {
        if (!s) return null;
        const [y, m, d] = s.split("-").map(Number);
        if (!y || !m || !d) return null;
        return { year: y, month: m, day: d };
    }

    const minParts = parseParts(min);
    const maxParts = parseParts(max);
    const currentYear = new Date().getFullYear();
    const minYear = minParts?.year ?? currentYear - 100;
    const maxYear = maxParts?.year ?? currentYear;

    const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

    const yearOptions = Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => String(maxYear - i)
    );

    const monthOptions = Array.from({ length: 12 }, (_, i) =>
        String(i + 1).padStart(2, "0")
    ).filter((m) => {
        if (!year) return true;
        const mNum = parseInt(m);
        const yNum = parseInt(year);
        if (minParts && yNum === minParts.year && mNum < minParts.month) return false;
        if (maxParts && yNum === maxParts.year && mNum > maxParts.month) return false;
        return true;
    });

    const dayOptions = (() => {
        if (!year || !month)
            return Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
        const dim = daysInMonth(parseInt(year), parseInt(month));
        return Array.from({ length: dim }, (_, i) => String(i + 1).padStart(2, "0")).filter((d) => {
            const dNum = parseInt(d);
            const yNum = parseInt(year);
            const mNum = parseInt(month);
            if (minParts && yNum === minParts.year && mNum === minParts.month && dNum < minParts.day) return false;
            if (maxParts && yNum === maxParts.year && mNum === maxParts.month && dNum > maxParts.day) return false;
            return true;
        });
    })();

    function handleChange(newDay: string, newMonth: string, newYear: string) {
        if (newDay && newMonth && newYear) {
            onChange(`${newYear}-${newMonth}-${newDay}`);
        } else {
            onChange("");
        }
    }

    useEffect(() => {
        if (!year) return;
        const yNum = parseInt(year);
        let newMonth = month;
        let changed = false;
        if (minParts && yNum === minParts.year && month && parseInt(month) < minParts.month) {
            newMonth = "";
            changed = true;
        }
        if (maxParts && yNum === maxParts.year && month && parseInt(month) > maxParts.month) {
            newMonth = "";
            changed = true;
        }
        if (changed) {
            setMonth(newMonth);
            setDay("");
            handleChange("", newMonth, year);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year]);

    useEffect(() => {
        if (!year || !month) return;
        const dim = daysInMonth(parseInt(year), parseInt(month));
        let newDay = day;
        let changed = false;
        if (day && parseInt(day) > dim) {
            newDay = "";
            changed = true;
        }
        const yNum = parseInt(year);
        const mNum = parseInt(month);
        if (minParts && yNum === minParts.year && mNum === minParts.month && day && parseInt(day) < minParts.day) {
            newDay = "";
            changed = true;
        }
        if (maxParts && yNum === maxParts.year && mNum === maxParts.month && day && parseInt(day) > maxParts.day) {
            newDay = "";
            changed = true;
        }
        if (changed) {
            setDay(newDay);
            handleChange(newDay, month, year);
        }
    }, [month]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div ref={containerRef}>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                Date of Birth{required ? " *" : ""}
            </label>
            <div className="grid grid-cols-3 gap-2">
                <CustomSelect
                    label="Date"
                    value={day}
                    options={dayOptions}
                    onSelect={(d) => {
                        setDay(d);
                        handleChange(d, month, year);
                        setOpenDropdown(null);
                    }}
                    isOpen={openDropdown === "day"}
                    onToggle={() => setOpenDropdown(openDropdown === "day" ? null : "day")}
                />
                <CustomSelect
                    label="Month"
                    value={month}
                    options={monthOptions}
                    onSelect={(m) => {
                        setMonth(m);
                        handleChange(day, m, year);
                        setOpenDropdown(null);
                    }}
                    isOpen={openDropdown === "month"}
                    onToggle={() => setOpenDropdown(openDropdown === "month" ? null : "month")}
                    displayValue={(m) => monthNames[parseInt(m) - 1]}
                />
                <CustomSelect
                    label="Year"
                    value={year}
                    options={yearOptions}
                    onSelect={(y) => {
                        setYear(y);
                        handleChange(day, month, y);
                        setOpenDropdown(null);
                    }}
                    isOpen={openDropdown === "year"}
                    onToggle={() => setOpenDropdown(openDropdown === "year" ? null : "year")}
                />
            </div>
        </div>
    );
}


function SavedTravelerPicker({
    travelers,
    onSelect,
    onClose,
}: {
    travelers: SavedTraveler[];
    onSelect: (t: SavedTraveler) => void;
    onClose: () => void;
}) {
    const [search, setSearch] = useState("");

    const filtered = travelers.filter((t) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return `${t.firstName} ${t.lastName}`.toLowerCase().includes(q);
    });

    return (
        <div className="absolute z-20 right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Saved Travellers</p>
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Close"
                >
                    <HiOutlineXMark className="w-4 h-4" />
                </button>
            </div>

            {travelers.length > 4 && (
                <div className="px-3 pt-3">
                    <div className="relative">
                     <HiOutlineMagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search travellers"
                            className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 pl-9 pr-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
                        />
                    </div>
                </div>
            )}

            <div className="max-h-64 overflow-y-auto py-1.5 mt-1">
                {filtered.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 px-4 py-3">No matching travellers</p>
                )}
                {filtered.map((t) => {
                    const name = [t.title, t.firstName, t.lastName].filter(Boolean).join(" ") || "Unnamed traveler";
                    const meta = [formatSavedDOB(t.dob), titleCase(t.gender), t.nationalityCode]
                        .filter(Boolean)
                        .join(" • ");
                    return (
                        <button
                            key={t.travelerId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => onSelect(t)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#e8f4fb] dark:hover:bg-gray-800 transition-colors"
                        >
                            <span className="w-9 h-9 rounded-full bg-[#e8f4fb] dark:bg-gray-800 text-[#1c8fc7] flex items-center justify-center text-xs font-bold shrink-0">
                                {travelerInitials(t.firstName, t.lastName)}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</p>
                                {meta && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{meta}</p>}
                            </div>
                        </button>
                    );
                })}
            </div>
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
    const [passengers, setPassengers] = useState<PassengerDetails[]>(() =>
        buildInitialPassengers(adults, children, infants)
    );
    const [savedTravelers, setSavedTravelers] = useState<SavedTraveler[]>([]);
    const [travelerPickerOpen, setTravelerPickerOpen] = useState<number | null>(null);
    const hasFetchedTravelers = useRef(false);

    useEffect(() => {
        setPassengers(buildInitialPassengers(adults, children, infants));
    }, [adults, children, infants]);

    useEffect(() => {
        onChange(passengers);
    }, [passengers]);

    useEffect(() => {
        if (hasFetchedTravelers.current) return;
        hasFetchedTravelers.current = true;

        async function load() {
            const res = await getTravelers();
            if (res.success) setSavedTravelers(res.travelers);
        }
        load();
    }, []);

    function updatePassenger(index: number, patch: Partial<PassengerDetails>) {
        setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    }

    function applySavedTraveler(index: number, traveler: SavedTraveler, ptc: PTC) {
        updatePassenger(index, {
            title: determineTitle(traveler.gender, ptc, traveler.title),
            firstName: traveler.firstName || "",
            lastName: traveler.lastName || "",
            dob: traveler.dob || "",
            nationality: traveler.nationalityCode || "",
            passportNo: traveler.passportNo || "",
            passportExpiry: isPlaceholderDate(traveler.pdoe) ? "" : traveler.pdoe,
            passportIssuingCountry: isPlaceholderDate(traveler.pic) ? "" : traveler.pic,
            documentNo: traveler.documentId || "",
        });
        setTravelerPickerOpen(null);
    }

    const fnMax = checklist.FNMaxLen ?? 50;
    const lnMax = checklist.LNMaxLen ?? 50;
    const showPassportBlock = Boolean(checklist.PassportNo || checklist.PDOE || checklist.PIC);
    const passportRequired = Boolean(checklist.DocumentMandate);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="grid place-items-center w-8 h-8 rounded-full bg-[#e8f4fb] text-[#1c8fc7] shrink-0">
                    <HiOutlineUser className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Passenger Details</h3>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-4 py-3 mb-5">
                <HiOutlineIdentification className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    <span className="font-semibold">Please ensure that your name matches your govt. ID</span>
                </p>
            </div>

            <div className="space-y-6">
                {passengers.map((p, idx) => {
                    const paxNumber =
                        passengers.slice(0, idx + 1).filter((x) => x.ptc === p.ptc).length;
                    const { min: dobMin, max: dobMax } = dobRange(p.ptc, checklist);
                    const matchingTravelers = savedTravelers.filter(
                        (t) => classifyPTC(t.dob, checklist) === p.ptc
                    );

                    return (
                        <div key={idx} className={idx > 0 ? "pt-6 border-t border-gray-100 dark:border-gray-800" : ""}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {PTC_LABEL[p.ptc]} {paxNumber}
                                </p>
                                {matchingTravelers.length > 0 && (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setTravelerPickerOpen(travelerPickerOpen === idx ? null : idx)
                                            }
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1c8fc7] hover:underline"
                                        >
                                            <HiOutlineUser className="w-3.5 h-3.5" />
                                            Use saved traveler
                                        </button>
                                        {travelerPickerOpen === idx && (
                                            <SavedTravelerPicker
                                                travelers={matchingTravelers}
                                                onSelect={(t) => applySavedTraveler(idx, t, p.ptc)}
                                                onClose={() => setTravelerPickerOpen(null)}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                                        Title{titleRequired(p.ptc, checklist) ? " *" : ""}
                                    </label>
                                    <select
                                        value={p.title}
                                        onChange={(e) => updatePassenger(idx, { title: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7] dark:[&>option]:bg-gray-900 dark:[&>option]:text-gray-100 [&>option]:bg-white [&>option]:text-gray-900"
                                    >
                                        <option value="">Select</option>
                                        {TITLE_OPTIONS[p.ptc].map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-1 sm:col-span-1">
                                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                                        First Name{firstNameRequired(checklist) ? " *" : ""}
                                    </label>
                                    <input
                                        value={p.firstName}
                                        maxLength={fnMax}
                                        onChange={(e) => updatePassenger(idx, { firstName: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                                        Last Name{lastNameRequired(checklist) ? " *" : ""}
                                    </label>
                                    <input
                                        value={p.lastName}
                                        maxLength={lnMax}
                                        onChange={(e) => updatePassenger(idx, { lastName: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
                                    />
                                </div>

                                <DOBField
                                    value={p.dob}
                                    onChange={(v) => updatePassenger(idx, { dob: v })}
                                    min={dobMin}
                                    max={dobMax}
                                    required={dobRequired(p.ptc, checklist)}
                                />

                                {checklist.Nationality && (
                                    <CountryField
                                        label="Nationality"
                                        required
                                        value={p.nationality}
                                        onChange={(v) => updatePassenger(idx, { nationality: v })}
                                    />
                                )}

                                {showPassportBlock && checklist.PassportNo && (
                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                                            Passport No{passportRequired ? " *" : ""}
                                        </label>
                                        <input
                                            value={p.passportNo}
                                            onChange={(e) => updatePassenger(idx, { passportNo: e.target.value })}
                                            className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
                                        />
                                    </div>
                                )}

                                {showPassportBlock && checklist.PDOE && (
                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                                            Passport Expiry{passportRequired ? " *" : ""}
                                        </label>
                                        <input
                                            type="date"
                                            value={p.passportExpiry}
                                            onChange={(e) => updatePassenger(idx, { passportExpiry: e.target.value })}
                                            className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
                                        />
                                    </div>
                                )}

                                {showPassportBlock && checklist.PIC && (
                                    <CountryField
                                        label="Passport Issuing Country"
                                        required={passportRequired}
                                        placeholder="Start typing a country"
                                        value={p.passportIssuingCountry}
                                        onChange={(v) => updatePassenger(idx, { passportIssuingCountry: v })}
                                    />
                                )}

                                {checklist.DocumentMandate && (
                                    <div>
                                        <label className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">
                                            Document No *
                                        </label>
                                        <input
                                            value={p.documentNo}
                                            onChange={(e) => updatePassenger(idx, { documentNo: e.target.value })}
                                            className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-[#1c8fc7]"
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