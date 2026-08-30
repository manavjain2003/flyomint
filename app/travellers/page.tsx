"use client";

import { useEffect, useState } from "react";
import {
  HiOutlineUserGroup,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineXMark,
  HiOutlineIdentification,
  HiOutlineCalendar,
  HiOutlineGlobeAlt,
} from "react-icons/hi2";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import AccountSidebar from "@/app/components/booking/AccountSidebar";
import {
  getTravelers,
  updateTravelerDetail,
  insertTravelerDetail,
  getCountryDetails,
} from "@/app/lib/flightsapi";
import { useRequireAuth } from "@/app/lib/useRequireAuth";

const GENDERS = ["MALE", "FEMALE", "OTHER"];

const emptyForm = {
  travelerId: null as number | null,
  firstName: "",
  lastName: "",
  gender: "MALE",
  dob: "",
  documentId: "",
  nationalityCode: "",
  passportNo: "",
  pic: "",
  pdoe: "",
  pdoi: "",
  ffNo: "",
};

type CountryOption = { name: string; codeShort: string };

function formatDob(dob?: string) {
  if (!dob || dob.startsWith("0001")) return "—";
  try {
    return new Date(dob).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dob;
  }
}

function calcAge(dob?: string) {
  if (!dob || dob.startsWith("0001")) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function genderLabel(g?: string) {
  if (!g) return "—";
  return g.charAt(0) + g.slice(1).toLowerCase();
}

function initials(first?: string, last?: string) {
  const a = (first || "").trim().charAt(0);
  const b = (last || "").trim().charAt(0);
  return (a + b).toUpperCase() || "—";
}

function CountryCodeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CountryOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!value) {
      setQuery("");
      return;
    }
    if (!query || query === value) {
      setQuery(value);
    }
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
    onChange(country.codeShort);
    setQuery(country.name);
    setOpen(false);
  }

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Start typing a country"
        autoComplete="off"
        className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/25 focus:border-[#0284c7]"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {loading && (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">
              Searching…
            </p>
          )}
          {!loading && results.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">
              No matches
            </p>
          )}
          {!loading &&
            results.map((c) => (
              <button
                key={c.codeShort}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(c)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-sky-50 dark:hover:bg-gray-800"
              >
                {c.name}{" "}
                <span className="text-gray-400 text-xs">({c.codeShort})</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default function MyTravelersPage() {
  const ready = useRequireAuth();

  const [travelers, setTravelers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadTravelers() {
    setLoading(true);
    setLoadError("");
    const res = await getTravelers();
    setLoading(false);

    if (!res.success) {
      setLoadError(res.message || "Could not load your travelers.");
      return;
    }
    setTravelers(res.travelers || []);
  }

  useEffect(() => {
    loadTravelers();
  }, []);

  function openAddForm() {
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(t: any) {
    setForm({
      travelerId: t.travelerId,
      firstName: t.firstName || "",
      lastName: t.lastName || "",
      gender: t.gender || "MALE",
      dob: t.dob && !String(t.dob).startsWith("0001") ? t.dob : "",
      documentId: t.documentId || "",
      nationalityCode: t.nationalityCode || "",
      passportNo: t.passportNo || "",
      pic: t.pic || "",
      pdoe: t.pdoe && !String(t.pdoe).startsWith("0001") ? t.pdoe : "",
      pdoi: t.pdoi && !String(t.pdoi).startsWith("0001") ? t.pdoi : "",
      ffNo: t.ffNo || "",
    });
    setFormError("");
    setShowForm(true);
  }

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setFormError("");

    if (!form.firstName || !form.lastName || !form.dob) {
      setFormError("First name, last name and date of birth are required.");
      return;
    }

    setSaving(true);
    const isEdit = Boolean(form.travelerId);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      gender: form.gender,
      dob: form.dob,
      documentId: form.documentId || "",
      nationalityCode: (form.nationalityCode || "").toUpperCase().slice(0, 2),
      passportNo: form.passportNo || "",
      pic: (form.pic || "").toUpperCase().slice(0, 2),
      pdoe: form.pdoe && !form.pdoe.startsWith("0001") ? form.pdoe : "",
      pdoi: form.pdoi && !form.pdoi.startsWith("0001") ? form.pdoi : "",
      ffNo: form.ffNo || "",
    };

    const res = isEdit
      ? await updateTravelerDetail({ travelerId: form.travelerId, ...payload })
      : await insertTravelerDetail(payload);

    setSaving(false);

    if (!res.success) {
      setFormError(res.message || "Could not save traveler.");
      return;
    }

    setShowForm(false);
    await loadTravelers();
  }

  if (!ready) return null;

  return (
    <div className="flex-1 bg-[#f5f8fb] dark:bg-gray-950 min-h-screen">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-3">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-[#FF7626]/10 shrink-0">
            <HiOutlineUserGroup className="w-5 h-5 text-[#FF7626]" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 tracking-tight">
              My travelers
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Save traveler details for faster bookings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64 shrink-0">
            <AccountSidebar />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    Saved travelers
                  </h2>
                  {!loading && !loadError && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {travelers.length === 0
                        ? "No travelers saved"
                        : `${travelers.length} traveler${travelers.length === 1 ? "" : "s"}`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openAddForm}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#0284c7] text-white text-sm font-medium hover:bg-[#0369a1] transition-colors"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  Add traveler
                </button>
              </div>

              <div>
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-gray-400 dark:text-gray-500">
                    <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading travelers…</span>
                  </div>
                ) : loadError ? (
                  <div className="py-12 px-5 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {loadError}
                    </p>
                    <button
                      type="button"
                      onClick={loadTravelers}
                      className="mt-4 h-9 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : travelers.length === 0 ? (
                  <div className="py-16 px-5 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 grid place-items-center mb-3">
                      <HiOutlineUserGroup className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      No saved travelers
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-[240px]">
                      Add a traveler to speed up your next booking.
                    </p>
                    <button
                      type="button"
                      onClick={openAddForm}
                      className="mt-5 h-9 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-[#0284c7] hover:text-[#0284c7] transition-colors"
                    >
                      Add traveler
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="hidden md:grid grid-cols-[minmax(200px,1.4fr)_100px_130px_90px_minmax(120px,1fr)_40px] gap-4 px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Traveler
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Gender
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Date of birth
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Nationality
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Passport
                      </span>
                      <span className="sr-only">Actions</span>
                    </div>

                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                      {travelers.map((t: any) => {
                        const age = calcAge(t.dob);
                        const dobLabel = formatDob(t.dob);
                        const hasPassport = Boolean(t.passportNo?.trim());
                        const nationality = t.nationalityCode || "—";

                        return (
                          <li
                            key={t.travelerId}
                            className="group grid grid-cols-1 md:grid-cols-[minmax(200px,1.4fr)_100px_130px_90px_minmax(120px,1fr)_40px] gap-x-4 gap-y-2 items-center px-5 py-3.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="shrink-0 w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 grid place-items-center text-xs font-semibold text-gray-600 dark:text-gray-300 tracking-wide">
                                {initials(t.firstName, t.lastName)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                                  {t.firstName} {t.lastName}
                                </p>
                                <p className="md:hidden text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {genderLabel(t.gender)}
                                  {age !== null && ` · ${age} yrs`}
                                </p>
                              </div>
                            </div>

                            <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300">
                              {genderLabel(t.gender)}
                              {age !== null && (
                                <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
                                  · {age} yrs
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                              <HiOutlineCalendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0 md:hidden" />
                              <span className="md:hidden text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mr-1">
                                DOB
                              </span>
                              {dobLabel}
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                              <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0 md:hidden" />
                              <span className="md:hidden text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mr-1">
                                Nat.
                              </span>
                              {nationality}
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 min-w-0">
                              <HiOutlineIdentification className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0 md:hidden" />
                              <span className="md:hidden text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mr-1">
                                Passport
                              </span>
                              <span
                                className={`truncate ${
                                  hasPassport
                                    ? "font-mono tracking-wide"
                                    : "text-gray-400 dark:text-gray-500 italic"
                                }`}
                              >
                                {hasPassport ? t.passportNo : "Not added"}
                              </span>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => openEditForm(t)}
                                className="h-8 w-8 grid place-items-center rounded-lg text-gray-400 hover:text-[#0284c7] hover:bg-sky-50 dark:hover:bg-sky-950/30 opacity-70 group-hover:opacity-100 transition-all"
                                aria-label="Edit traveler"
                              >
                                <HiOutlinePencil className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg max-h-[100vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {form.travelerId ? "Edit traveler" : "Add traveler"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-8 w-8 grid place-items-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  First name
                </label>
                <input
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/25 focus:border-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Last name
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/25 focus:border-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/25 focus:border-[#0284c7]"
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => updateField("dob", e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/25 focus:border-[#0284c7]"
                />
              </div>

              <CountryCodeField
                label="Nationality"
                value={form.nationalityCode}
                onChange={(code) => updateField("nationalityCode", code)}
              />

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Passport no.
                </label>
                <input
                  value={form.passportNo}
                  onChange={(e) => updateField("passportNo", e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/25 focus:border-[#0284c7]"
                />
              </div>

              <CountryCodeField
                label="Passport issue country (PIC)"
                value={form.pic}
                onChange={(code) => updateField("pic", code)}
              />

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Passport issue date (PDOI)
                </label>
                <input
                  type="date"
                  value={form.pdoi}
                  onChange={(e) => updateField("pdoi", e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/25 focus:border-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Passport expiry date (PDOE)
                </label>
                <input
                  type="date"
                  value={form.pdoe}
                  onChange={(e) => updateField("pdoe", e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/25 focus:border-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Frequent flyer no.
                </label>
                <input
                  value={form.ffNo}
                  onChange={(e) => updateField("ffNo", e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700 px-3 text-sm dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/25 focus:border-[#0284c7]"
                />
              </div>
            </div>

            {formError && (
              <p className="mx-5 mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg">
                {formError}
              </p>
            )}

            <div className="px-5 pb-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-9 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="h-9 px-4 rounded-lg bg-[#0284c7] text-white text-sm font-medium hover:bg-[#0369a1] disabled:opacity-60 flex items-center gap-2 transition-colors"
              >
                {saving && (
                  <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                )}
                {form.travelerId ? "Save changes" : "Add traveler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}