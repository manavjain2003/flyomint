import apiRequest, { ApiError } from "./api";

export async function getAirlineToken({
    searchType,
    adt,
    chd = 0,
    inf = 0,
    cabin,
    trips,
    directFlight = false,
    student = false,
    srCitizen = false,
    armForce = false,
}) {
    try {
        const res = await apiRequest("/Flights/AirlineToken", {
            method: "POST",
            body: {
                SearchType: searchType,
                ADT: adt,
                CHD: chd,
                INF: inf,
                Cabin: cabin,
                Trips: trips.map((trip) => ({
                    From: trip.from,
                    To: trip.to,
                    OnwardDate: trip.onwardDate,
                    ReturnDate: trip.returnDate || "",
                })),
                DirectFlight: directFlight,
                Student: student,
                SrCitizen: srCitizen,
                ArmForce: armForce,
            },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not fetch AirlineToken", tokenId: null, bookingId: null };
        }

        return {
            success: true,
            message: payload.Message || "TokenID generated successfully.",
            tokenId: payload.TokenID,
            bookingId: payload.BookingID || "",
            msg: payload.MSG || [],
        };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, tokenId: null, bookingId: null };
        }
        return { success: false, message: "Network error. Please try again.", tokenId: null, bookingId: null };
    }
}


export async function collectAvailability(tokenId) {
    try {
        const res = await apiRequest("/Flights/CollectAvailability", {
            method: "POST",
            body: { TokenID: tokenId },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return {
                success: false,
                message: payload.Message || "Could not fetch availability",
                completed: true,
                trips: [],
                tokenId,
            };
        }

        return {
            success: true,
            message: payload.Message || null,
            completed: Boolean(payload.Completed),
            trips: payload.Trips || [],
            msg: payload.MSG || [],
            tokenId: payload.TokenID || tokenId,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, completed: true, trips: [], tokenId };
        }
        return { success: false, message: "Network error. Please try again.", completed: true, trips: [], tokenId };
    }
}

export async function pollAvailability(
    tokenId,
    { onUpdate, intervalMs = 1500, maxDurationMs = 60000 } = {}
) {
    let mergedTrips = [];
    let latestTokenId = tokenId;
    const startedAt = Date.now();

    const mergeJourneys = (existing, incoming) => {
        const seen = new Set(existing.map((j) => j?.Segments?.[0]?.SID + j?.GroupId));
        const fresh = incoming.filter((j) => !seen.has(j?.Segments?.[0]?.SID + j?.GroupId));
        return [...existing, ...fresh];
    };

    while (Date.now() - startedAt < maxDurationMs) {
        const result = await collectAvailability(latestTokenId);

        if (result.tokenId) latestTokenId = result.tokenId;

        if (!result.success) {
            return { success: false, message: result.message, trips: mergedTrips, timedOut: false, tokenId: latestTokenId };
        }

        mergedTrips = result.trips.map((trip, i) => {
            const existing = mergedTrips[i] || { Journey: [] };
            return {
                ...trip,
                Journey: mergeJourneys(existing.Journey || [], trip.Journey || []),
            };
        });

        onUpdate?.(mergedTrips, latestTokenId);

        if (result.completed) {
            return { success: true, message: result.message, trips: mergedTrips, timedOut: false, tokenId: latestTokenId };
        }

        if (Date.now() - startedAt < maxDurationMs) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }

    return {
        success: true,
        message: "This search is taking longer than usual.",
        trips: mergedTrips,
        timedOut: true,
        tokenId: latestTokenId,
    };
}

// Index values come from the FareInfo.Index field of the chosen fare in the
// CollectAvailability response:
//   ON search - pass the single onward Index
//   RS search - pass the single combined-fare Index
//   RT search - pass BOTH the onward and return Index values
export async function getAirlinePricing({ tokenId, bookingId = "", index }) {
    try {
        const res = await apiRequest("/Flights/AirlinePricing", {
            method: "POST",
            body: {
                TokenID: tokenId,
                BookingID: bookingId,
                Index: Array.isArray(index) ? index : [index],
            },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not fetch pricing", pricing: null };
        }

        return {
            success: true,
            message: payload.Message || null,
            pricing: {
                tokenId: payload.TokenID,
                bookingId: payload.BookingID,
                bookingExpiryTime: payload.BookingExpiryTime,
                from: payload.From,
                to: payload.To,
                fromName: payload.FromName,
                toName: payload.ToName,
                onwardDate: payload.OnwardDate,
                returnDate: payload.ReturnDate,
                adt: payload.ADT,
                chd: payload.CHD,
                inf: payload.INF,
                journeys: payload.Journey || [],
                rules: payload.Rules || null,
                fnuLnuSettings: payload.FnuLnuSettings || null,
            },
        };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, pricing: null };
        }
        return { success: false, message: "Network error. Please try again.", pricing: null };
    }
}



export async function getAirlineFareRule({ tokenId, index }) {
    try {
        const res = await apiRequest("/Flights/AirlineFareRule", {
            method: "POST",
            body: {
                TokenID: tokenId,
                Index: Array.isArray(index) ? index : [index],
            },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not fetch fare rules", rules: [] };
        }

        const trips = payload.Trips || [];

        const rules = trips.flatMap((trip) => {
            const additionalCharge = trip.AdditionalCharge || null;

            return (trip.Journey || []).flatMap((journey) =>
                (journey.Segments || []).flatMap((segment) =>
                    (segment.Rules || []).map((r) => ({
                        originDestination: r.OrginDestination || "",
                        fareRuleText: r.FareRuleText || "",
                        additionalCharge,
                        sections: (r.Rule || []).map((rule) => ({
                            head: rule.Head || "Fare Rule",
                            tiers: (rule.Info || []).map((info) => ({
                                description: info.Description || "",
                                adultAmount: info.AdultAmount || "",
                                childAmount: info.ChildAmount || "",
                                infantAmount: info.InfantAmount || "",
                                currencyCode: info.CurrencyCode || "",
                            })),
                        })),
                    }))
                )
            );
        });

        return { success: true, message: payload.Message || null, rules };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, rules: [] };
        }
        return { success: false, message: "Network error. Please try again.", rules: [] };
    }
}


export async function getCountryDetails({ searchText }) {
    try {
        const res = await apiRequest("/Utility/CountryDetails", {
            method: "POST",
            body: { SearchText: searchText },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not fetch countries", countries: [] };
        }

        return {
            success: true,
            message: payload.Message || null,
            countries: (payload.CountryDetails || []).map((c) => ({
                name: c.CountryName,
                codeShort: c.CountryCodeShort,
                codeLong: c.CountryCodeLong,
                currency: c.Currency,
                areaCode: c.CountryAreaCode,
            })),
        };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, countries: [] };
        }
        return { success: false, message: "Network error. Please try again.", countries: [] };
    }
}