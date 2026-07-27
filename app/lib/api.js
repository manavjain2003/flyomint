const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const SIGNATURE_CODE = process.env.NEXT_PUBLIC_SIGNATURE_CODE ;

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

function isKeyStillValid(cached) {
    if (!cached?.uniqueKey || !cached?.validity) return false;
    const expiresAt = new Date(cached.validity).getTime();
    if (Number.isNaN(expiresAt)) return false;
    return expiresAt - Date.now() > 60_000;
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
    cachedKey = { uniqueKey: UniqueKey?.trim(), validity: Validity };
    return cachedKey;
}

export async function getUniqueKey({ forceRefresh = false } = {}) {
    if (!forceRefresh && isKeyStillValid(cachedKey)) {
        return cachedKey.uniqueKey;
    }

    if (!inFlightRequest) {
        inFlightRequest = fetchSignatureKey().finally(() => {
            inFlightRequest = null;
        });
    }

    const key = await inFlightRequest;
    return key.uniqueKey;
}

async function doFetch(endpoint, { method, body, headers, authHeader }) {
    const config = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
            ...authHeader,
        },
        ...(body && { body: JSON.stringify(body) }),
    };

    let response;
    try {
        response = await fetch(`${BASE_URL}${endpoint}`, config);
    } catch {
        throw new ApiError(0, "NetworkError", null, "Network error. Please check your connection and try again.");
    }

    let data;
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    return { response, data };
}

export async function apiRequest(endpoint, options = {}) {
    const { method = "GET", body, token, headers = {}, skipAuth = false } = options;
    const needsAuth = !skipAuth && endpoint !== "/Auth/Signature";

    let authHeader = {};
    if (needsAuth) {
        const key = token || (await getUniqueKey());
        authHeader = { UniqueKey: key };
    }

    let { response, data } = await doFetch(endpoint, { method, body, headers, authHeader });

    if (needsAuth && !token && response.status === 401) {
        const freshKey = await getUniqueKey({ forceRefresh: true });
        ({ response, data } = await doFetch(endpoint, {
            method,
            body,
            headers,
            authHeader: { UniqueKey: freshKey },
        }));
    }

    if (!response.ok) {
        throw new ApiError(
            response.status,
            response.statusText,
            data,
            data?.ServiceResponse?.Message || data?.Message || data?.message || `HTTP Error: ${response.status}`
        );
    }

    return data;
}

export const API_BASE_URL = BASE_URL;

export default apiRequest;