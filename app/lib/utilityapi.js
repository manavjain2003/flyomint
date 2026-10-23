import apiRequest, { ApiError } from "./api";


export async function searchAirports(searchText, sourceAirport = "") {
    try {
        const res = await apiRequest("/Utility/Airports", {
            method: "POST",
            body: {
                SearchText: searchText,
                SourceAirport: sourceAirport,
            },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not fetch airports", airports: [] };
        }

        return {
            success: true,
            message: payload.Message || "Airports fetched successfully.",
            airports: payload.Airports || [],
        };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, airports: [] };
        }
        return { success: false, message: "Network error. Please try again.", airports: [] };
    }
}