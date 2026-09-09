const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const SIGNATURE_CODE = process.env.NEXT_PUBLIC_SIGNATURE_CODE;

const UNIQUE_KEY_STORAGE = "uniqueKey";
const VALIDITY_STORAGE = "loginValidity";

export class ApiError extends Error {
    constructor(status, statusText, data, message) {
        super(message || `API Error: ${status} ${statusText}`);
        this.name = "ApiError";
        this.status = status;
        this.statusText = statusText;
        this.data = data;
    }
}

let cachedKey = null;      
let inFlightRequest = null;
let refreshTimer = null;

function isKeyStillValid(cached) {
    if (!cached?.uniqueKey || !cached?.validity) return false;
    const expiresAt = new Date(cached.validity).getTime();
    if (Number.isNaN(expiresAt)) return false;
    return expiresAt - Date.now() > 60_000;
}

function persistLoginKey(uniqueKey, validity) {
    if (typeof window === "undefined") return;
    localStorage.setItem(UNIQUE_KEY_STORAGE, uniqueKey || "");
    if (validity) localStorage.setItem(VALIDITY_STORAGE, validity);
}

function clearPersistedLoginKey() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(UNIQUE_KEY_STORAGE);
    localStorage.removeItem(VALIDITY_STORAGE);
}


async function fetchSignatureKey() {
    const response = await fetch(`${BASE_URL}/Auth/Signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Code: SIGNATURE_CODE }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.ServiceResponse?.ErrorCode) {
        throw new ApiError(
            response.status,
            response.statusText,
            data,
            data?.ServiceResponse?.Message || "Failed to generate UniqueKey"
        );
    }

    const { UniqueKey, Validity } = data.ServiceResponse;
    cachedKey = { uniqueKey: UniqueKey?.trim(), validity: Validity, isLoginKey: false };
    clearScheduledRefresh();
    return cachedKey;
}


async function fetchResetToken(uniqueKey) {
    const response = await fetch(`${BASE_URL}/Auth/ResetToken`, {
        method: "GET",
        headers: { "Content-Type": "application/json", UniqueKey: uniqueKey },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.ServiceResponse?.ErrorCode) {
        throw new ApiError(
            response.status,
            response.statusText,
            data,
            data?.ServiceResponse?.Message || "Failed to reset token"
        );
    }

    const { UniqueKey, Validity } = data.ServiceResponse;
    cachedKey = { uniqueKey: UniqueKey?.trim(), validity: Validity, isLoginKey: true };
    persistLoginKey(cachedKey.uniqueKey, cachedKey.validity);
    return cachedKey;
}


function clearScheduledRefresh() {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
}

function scheduleRefresh() {
    clearScheduledRefresh();
    if (!cachedKey?.validity || !cachedKey?.isLoginKey) return;

    const expiresAt = new Date(cachedKey.validity).getTime();
    if (Number.isNaN(expiresAt)) return;

    const fireAt = expiresAt - Date.now() - 60_000;

    if (fireAt <= 0) {

        refreshTimer = setTimeout(handleExpiry, 0);
        return;
    }

    refreshTimer = setTimeout(handleExpiry, fireAt);
}

function forceLogout() {
    cachedKey = null;
    clearScheduledRefresh();
    clearPersistedLoginKey();
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("flyomint:sessionExpired"));
    }
}

async function handleExpiry() {
    const isVisible = typeof document !== "undefined" && document.visibilityState === "visible";

    if (isVisible && cachedKey?.isLoginKey) {
        try {

            await getUniqueKey({ forceRefresh: true });
            scheduleRefresh(); 
            return;
        } catch (e) {
            console.error("ResetToken failed:", e);
        }
    } else if (!isVisible) {
        return;
    }

    forceLogout();
}

if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && cachedKey?.isLoginKey) {
            if (!isKeyStillValid(cachedKey)) {
                handleExpiry();
            }
        }
    });
}


if (typeof window !== "undefined") {
    const storedKey = localStorage.getItem(UNIQUE_KEY_STORAGE);
    const storedValidity = localStorage.getItem(VALIDITY_STORAGE);
    if (storedKey) {
        cachedKey = { uniqueKey: storedKey.trim(), validity: storedValidity, isLoginKey: true };

        scheduleRefresh();
    }
}


export function setUniqueKey(uniqueKey, validity, isLoginKey = true) {
    cachedKey = { uniqueKey: uniqueKey?.trim(), validity, isLoginKey };
    if (isLoginKey) persistLoginKey(cachedKey.uniqueKey, cachedKey.validity);
    scheduleRefresh();
}

export async function getUniqueKey({ forceRefresh = false } = {}) {
    if (!forceRefresh && isKeyStillValid(cachedKey)) {
        return cachedKey.uniqueKey;
    }

    if (!inFlightRequest) {
        if (cachedKey?.isLoginKey && cachedKey?.uniqueKey) {
            inFlightRequest = fetchResetToken(cachedKey.uniqueKey)
                .catch((e) => {
                    forceLogout();
                    throw e;
                })
                .finally(() => {
                    inFlightRequest = null;
                });
        } else {
            inFlightRequest = fetchSignatureKey().finally(() => {
                inFlightRequest = null;
            });
        }
    }

    const key = await inFlightRequest;
    scheduleRefresh();
    return key.uniqueKey;
}

async function doFetch(endpoint, { method, body, headers, authHeader, signal }) {
    const config = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
            ...authHeader,
        },
        ...(body && { body: JSON.stringify(body) }),
        ...(signal && { signal }),
    };

    let response;
    try {
        response = await fetch(`${BASE_URL}${endpoint}`, config);
    } catch (err) {
        if (err?.name === "AbortError") {
            throw err;
        }
        throw new ApiError(0, "NetworkError", null, "Network error. Please check your connection and try again.");
    }

    const contentType = response.headers.get("content-type") || "";


    if (contentType.includes("application/pdf") || contentType.includes("application/octet-stream")) {
        const blob = await response.blob();
        return { response, data: { __blob: blob, __contentType: contentType } };
    }

    const rawText = await response.text();
    let data;
    try {
        data = JSON.parse(rawText);
    } catch {
        data = { __raw: rawText }; 
    }

    return { response, data };
}

export async function apiRequest(endpoint, options = {}) {
    const { method = "GET", body, token, headers = {}, skipAuth = false, signal } = options;
    const needsAuth = !skipAuth && endpoint !== "/Auth/Signature";

    if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
    }

    let authHeader = {};
    if (needsAuth) {
        const key = token || (await getUniqueKey());
        authHeader = { UniqueKey: key };
    }

    let { response, data } = await doFetch(endpoint, { method, body, headers, authHeader, signal });

    if (needsAuth && response.status === 401) {
        const freshKey = await getUniqueKey({ forceRefresh: true });
        ({ response, data } = await doFetch(endpoint, {
            method,
            body,
            headers,
            authHeader: { UniqueKey: freshKey },
            signal,
        }));
    }

   if (!response.ok) {
    const serviceMsg = Array.isArray(data?.ServiceResponse)
        ? data.ServiceResponse[0]
        : data?.ServiceResponse?.Message;

    throw new ApiError(
        response.status,
        response.statusText,
        data,
        serviceMsg || data?.Message || data?.message || `HTTP Error: ${response.status}`
    );
}

    return data;
}

export const API_BASE_URL = BASE_URL;

export default apiRequest;