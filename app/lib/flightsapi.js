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

/**
 * @param {string} tokenId
 * @param {{
 *   onUpdate?: (trips: any[], tokenId?: string) => void,
 *   intervalMs?: number,
 *   maxDurationMs?: number
 * }} [options]
 */
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
//
//   Oneway (Domestic or International)
//     SearchType: "ON"
//
//   Roundtrip International
//     Called TWICE — once per leg, each with SearchType: "RS" and its own Index
//
//   Roundtrip Domestic
//     Called TWICE — once per leg, each with its own SearchType/Index:
//     SearchType: "ON"
//     SearchType: "RT"
export async function getAirlinePricing({ tokenId, bookingId = "", index, searchType }) {
    try {
        const res = await apiRequest("/Flights/AirlinePricing", {
            method: "POST",
            body: {
                TokenID: tokenId,
                BookingID: bookingId,
                Index: Array.isArray(index) ? index : [index],
                SearchType: searchType,
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

/**
 * Pricing for a two-index trip (Roundtrip Domestic or Roundtrip International).
 *
 *   Roundtrip Domestic:      legs = [{ index: onwardIndex, searchType: "ON" }, { index: returnIndex, searchType: "RT" }]
 *   Roundtrip International: legs = [{ index: leg1Index,  searchType: "RS" }, { index: leg2Index,  searchType: "RS" }]
 *
 * Each call reuses the TokenID/BookingID returned by the previous call, since the
 * gateway may rotate them between requests.
 */
export async function getRoundtripPricing({ tokenId, bookingId = "", legs }) {
    const results = [];
    let currentTokenId = tokenId;
    let currentBookingId = bookingId;

    for (const leg of legs) {
        const result = await getAirlinePricing({
            tokenId: currentTokenId,
            bookingId: currentBookingId,
            index: leg.index,
            searchType: leg.searchType,
        });

        if (!result.success) {
            return { success: false, message: result.message, results };
        }

        results.push(result.pricing);
        currentTokenId = result.pricing.tokenId || currentTokenId;
        currentBookingId = result.pricing.bookingId || currentBookingId;
    }

    return { success: true, message: null, results };
}

export async function getAirlineFareRule({ tokenId, index, searchType }) {
    try {
        const res = await apiRequest("/Flights/AirlineFareRule", {
            method: "POST",
            body: {
                TokenID: tokenId,
                Index: Array.isArray(index) ? index : [index],
                SearchType: searchType,
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


export async function getAirlineSSR({ tokenId, bookingId }) {
    try {
        const res = await apiRequest("/Flights/AirlineSSR", {
            method: "POST",
            body: { TokenID: tokenId, BookingID: bookingId },
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not fetch add-ons", tokenId, legs: [] };
        }

        const mapSSR = (s) => ({
            code: s.SSRCode,
            desc: s.SSRDesc,
            charge: s.SSRCharge,
            paxType: s.SSRPaxType,
            type: s.SSRType,
        });

        const legs = (payload.Journey || []).map((journey) => {
                      const segments = (journey.Segments || []).map((seg) => {
                const ssrList = seg.SSRList || [];
                return {
                    sid: seg.SID,
                    flightNo: seg.FlightNo,
                    airlineCode: seg.AirlineCode,
                    airlineName: seg.AirlineName,
                    vacLogo: seg.VACLogo,
                    macLogo: seg.MACLogo,
                    oacLogo: seg.OACLogo,
                    from: seg.DepartureAirportCode,
                    to: seg.ArrivalAirportCode,
                    fromCity: seg.DepartureCityName,
                    toCity: seg.ArrivalCityName,
                    departureTime: seg.DepartureTime,
                    arrivalTime: seg.ArrivalTime,
                    mealOptions: ssrList.filter((s) => s.SSRType === "1").map(mapSSR),
                    baggageOptions: ssrList.filter((s) => s.SSRType === "2").map(mapSSR),
                };
            });

            return {
                from: journey.From,
                to: journey.To,
                fromName: journey.FromName,
                toName: journey.ToName,
                duration: journey.Duration,
                baggageOptions: segments[0]?.baggageOptions || [],
                segments,
            };
        });

        return {
            success: true,
            message: payload.Message || null,
            tokenId: payload.TokenID || tokenId,
            from: payload.From,
            to: payload.To,
            adt: payload.ADT,
            chd: payload.CHD,
            inf: payload.INF,
            legs,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, tokenId, legs: [] };
        }
        return { success: false, message: "Network error. Please try again.", tokenId, legs: [] };
    }
}


export async function getAirlineTrvlItinerary({
  tokenId,
  bookingId,
  contactInfo,
  billInfo,
  travelers,
  ssrl,
}) {
  try {
    const res = await apiRequest("/Flights/AirlineTravelItinerary", {
      method: "POST",
      body: {
        TokenID: tokenId,
        BookingID: bookingId,
        ContactInfo: {
          Mobile: contactInfo.mobile,
          Email: contactInfo.email,
          GSTCompanyName: contactInfo.gstCompanyName || "",
          GSTTIN: contactInfo.gstTin || "",
          GSTMobile: contactInfo.gstMobile || "",
          GSTEmail: contactInfo.gstEmail || "",
          GSTAddress: contactInfo.gstAddress || "",
        },
        BillInfo: {
          ProfileUpdate: billInfo?.profileUpdate ?? false,
          PINCode: billInfo?.pinCode || "",
          Address: billInfo?.address || "",
          City: billInfo?.city || "",
          State: billInfo?.state || "",
        },
        Travelers: travelers.map((t, i) => ({
          PaxID: t.paxId ?? i + 1,
          Title: t.title,
          FirstName: t.firstName,
          LastName: t.lastName,
          DOB: t.dob,
          Nationality: t.nationality,
          PassportNo: t.passportNo || "",
          PIC: t.pic || "",
          PDOI: t.pdoi || "",
          PDOE: t.pdoe || "",
          DocumentNo: t.documentNo || "",
          FFNo: t.ffNo || "",
          PaxType: t.paxType,
        })),
        SSRL:
          ssrl?.map((s) => ({
            SID: s.sid,
            PaxID: s.paxId,
            SSRCode: s.ssrCode,
            SSRType: s.ssrType,
          })) ?? [],
        BookingType: "NM",
      },
    });

    const payload = res?.ServiceResponse ?? {};

    if (payload.ErrorCode) {
      return {
        success: false,
        message: payload.Message || "Could not create itinerary",
      };
    }

    return {
      success: true,
      message: payload.Message || null,
      tokenId: payload.TokenID,
      transactionId: payload.TransactionID,
      bookingId: payload.BookingID,
      fareInfo: (payload.FareInfo || [])
        .filter((f) => f != null) 
        .map((f) => ({
          pgDetails: {
            pgId: f.PGDetails?.PGID,
            pgCode: f.PGDetails?.PGCode,
            pgName: f.PGDetails?.PGName,
            pgDescription: f.PGDetails?.PGDescription,
          },
          baseFare: f.BaseFare,
          tax: f.Tax,
          convenienceFee: f.ConvenienceFee,
          discount: f.Discount,
          instantOff: f.InstantOff,
          markUp: f.MarkUp,
          addOns: f.AddOns,
          addOnDetails: f.AddOnDetails || [],
          wallet: f.Wallet,
          amountToBePaid: f.AmountToBePaid,
          ptcFares: (f.PTCFares || []).map((p) => ({
            ptc: p.PTC,
            fare: p.Fare,
            tax: p.Tax,
          })),
        })),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, message: error.message };
    }
    return {
      success: false,
      message: "Network error. Please try again.",
    };
  }
}

export async function getAirlinePaymentUrl({ tokenId, transactionId, pgId, pgCode, amountToBePaid }) {
    try {
        const res = await apiRequest("/Payment/PaymentURL", {
            method: "POST",
            body: {
                TokenID: tokenId,
                TransactionID: transactionId,
                PGID: pgId,
                PGCode: pgCode,
                AmountToBePaid: amountToBePaid,
            },
        });

        const payload = res?.ServiceResponse ?? res ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not fetch payment URL", paymentUrl: null };
        }

        return {
            success: true,
            message: payload.Message || null,
            transactionId: payload.TransactionID ?? transactionId,
            paymentUrl: payload.PaymentUrl,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, paymentUrl: null };
        }
        return { success: false, message: "Network error. Please try again.", paymentUrl: null };
    }
}




function normalizeServicePayload(res) {
  const raw = res?.ServiceResponse ?? res ?? {};
  // API sometimes returns a plain string error in ServiceResponse
  if (typeof raw === "string") {
    return {
      ErrorCode: "AUTH_OR_API_ERROR",
      Message: raw,
      Status: "failed",
    };
  }
  return raw && typeof raw === "object" ? raw : {};
}

export async function getPaymentStatus(transactionId, { signal } = {}) {
  try {
    const res = await apiRequest(`/Payment/PaymentStatus/${transactionId}`, {
      method: "GET",
      signal,
    });

    const payload = normalizeServicePayload(res);
    const status = String(payload.Status || "").toLowerCase();
    const message =
      payload.Message ||
      (typeof res?.ServiceResponse === "string" ? res.ServiceResponse : null) ||
      null;

    // Explicit error from gateway (login, session, etc.)
    if (payload.ErrorCode || status === "failed" || /not a valid login|unauthorized|session/i.test(message || "")) {
      return {
        success: false,
        status: "failed",
        message: message || "Payment status check failed",
      };
    }

    return {
      success: true,
      status: status === "success" ? "success" : status === "pending" ? "pending" : "failed",
      message,
    };
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    if (error instanceof ApiError) {
      return { success: false, status: "failed", message: error.message };
    }
    return { success: false, status: "failed", message: "Network error. Please try again." };
  }
}

export async function getBookingStatus(transactionId, { signal } = {}) {
  try {
    const res = await apiRequest(`/Utility/BookingStatus/${transactionId}`, {
      method: "GET",
      signal,
    });

    const payload = normalizeServicePayload(res);
    const status = String(payload.Status || "").toLowerCase();
    const message =
      payload.Message ||
      (typeof res?.ServiceResponse === "string" ? res.ServiceResponse : null) ||
      null;

    if (payload.ErrorCode || status === "failed" || /not a valid login|unauthorized|session/i.test(message || "")) {
      return {
        success: false,
        status: "failed",
        message: message || "Booking could not be confirmed",
      };
    }

    return {
      success: true,
      status: status === "success" ? "success" : status === "pending" ? "pending" : "failed",
      message,
    };
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    if (error instanceof ApiError) {
      return { success: false, status: "failed", message: error.message };
    }
    return { success: false, status: "failed", message: "Network error. Please try again." };
  }
}

export async function pollBookingConfirmation(transactionId, { signal } = {}) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const pay = await getPaymentStatus(transactionId, { signal });

    if (!pay.success || pay.status === "failed") {
        return { stage: "payment", status: "failed", message: pay.message };
    }
    if (pay.status === "pending") {
        return { stage: "payment", status: "pending", message: pay.message };
    }

    // Payment succeeded — do one lightweight booking-status check.
    // (The caller still does a fuller AirlineBookingRetrieve afterwards;
    // this is just an early signal, so it should not loop either.)
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const booking = await getBookingStatus(transactionId, { signal });

    if (!booking.success || booking.status === "failed") {
        return { stage: "booking", status: "failed", message: booking.message };
    }
    if (booking.status === "pending") {
        return { stage: "booking", status: "pending", message: booking.message };
    }
    return { stage: "booking", status: "success", message: booking.message };
}
 

function pick(obj, keys) {
    if (!obj) return undefined;
    const objKeys = Object.keys(obj);
    for (const k of keys) {
        const found = objKeys.find((ok) => ok.toLowerCase() === k.toLowerCase());
        if (found !== undefined && obj[found] !== undefined && obj[found] !== null) {
            return obj[found];
        }
    }
    return undefined;
}
 
export async function getAirlineBookingRetrieve({ transactionId, pnr = "", referenceNo = "", signal }) {
    try {
        const res = await apiRequest("/Utility/AirlineBookingRetrieve", {
            method: "POST",
            body: {
                TransactionID: Number(transactionId),  
                PNR: pnr,
                ReferenceNo: referenceNo,
            },
            signal,
        });

        const payload = res?.ServiceResponse ?? res ?? {};

        if (payload.ErrorCode) {
            return {
                success: false,
                message: payload.Message || "Could not retrieve booking details",
                pnr: null,
                referenceNo: null,
                raw: payload,
            };
        }

        return {
            success: true,
            message: pick(payload, ["Message"]) || null,
            transactionId: pick(payload, ["TransactionID"]) ?? transactionId,
            pnr: pick(payload, ["PNR"]) || null,
            referenceNo: pick(payload, ["ReferenceNo"]) || null,
            bookingId: pick(payload, ["BookingID"]) || null,
            raw: payload,
        };
    } catch (error) {
        if (error?.name === "AbortError") throw error;
        if (error instanceof ApiError) {
            return { success: false, message: error.message, pnr: null, referenceNo: null };
        }
        return { success: false, message: "Network error. Please try again.", pnr: null, referenceNo: null };
    }
}
 


export async function getTravelers({ signal } = {}) {
    try {
        const res = await apiRequest("/Utility/GetTravelers", {
            method: "GET",
            signal,
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not fetch saved travelers", travelers: [] };
        }

        return {
            success: true,
            message: payload.Message || null,
            travelers: (payload.TravelerDetails || []).map((t) => ({
                travelerId: t.TravelerId,
                title: t.Title,
                firstName: t.FirstName,
                lastName: t.LastName,
                gender: t.Gender,
                dob: t.DOB,
                documentId: t.DocumentId,
                nationalityCode: t.NationalityCode,
                passportNo: t.PassportNo,
                pic: t.PIC,
                pdoe: t.PDOE,
                pdoi: t.PDOI,
                ffNo: t.FFNO,
            })),
        };
    } catch (error) {
        if (error?.name === "AbortError") throw error;
        if (error instanceof ApiError) {
            return { success: false, message: error.message, travelers: [] };
        }
        return { success: false, message: "Network error. Please try again.", travelers: [] };
    }
}



export async function getAirlineInvoice({ transactionId, pnr = "", referenceNo = "", type = "P" }) {
    try {
        const body = {
            TransactionID: String(transactionId),  
            PNR: pnr,
            ReferenceNo: referenceNo,
            Type: type,
        };

        const res = await apiRequest("/Utility/AirlineInvoice", { method: "POST", body });

        if (res?.__blob) {
            return { success: true, message: null, data: { blob: res.__blob, contentType: res.__contentType } };
        }

        const payload = res?.ServiceResponse ?? res ?? {};

        if (payload.ErrorCode || (Array.isArray(payload) && payload[0]?.includes?.("Object reference"))) {
            return {
                success: false,
                message: Array.isArray(payload) ? payload[0] : (payload.Message || "Could not download invoice"),
                data: null,
            };
        }

        return { success: true, message: payload.Message || null, data: payload };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, data: null };
        }
        return { success: false, message: "Network error. Please try again.", data: null };
    }
}

export async function getETicketCopy({ transactionId, pnr = "", referenceNo = "", type = "P" }) {
    try {
        const body = {
            TransactionID: String(transactionId),
            PNR: pnr,
            ReferenceNo: referenceNo,
            Type: type,
        };

        const res = await apiRequest("/Utility/ETicketCopy", { method: "POST", body });

        if (res?.__blob) {
            return { success: true, message: null, data: { blob: res.__blob, contentType: res.__contentType } };
        }

        const payload = res?.ServiceResponse ?? res ?? {};
        if (payload.ErrorCode || (Array.isArray(payload) && payload[0]?.includes?.("Object reference"))) {
            return {
                success: false,
                message: Array.isArray(payload) ? payload[0] : (payload.Message || "Could not download e-ticket"),
                data: null,
            };
        }

        return { success: true, message: payload.Message || null, data: payload };
    } catch (error) {
        if (error instanceof ApiError) return { success: false, message: error.message, data: null };
        return { success: false, message: "Network error. Please try again.", data: null };
    }
}


export async function updateTravelerDetail({
    travelerId,
    firstName,
    lastName,
    gender,
    dob,
    documentId = "",
    nationalityCode,
    passportNo = "",
    pic = "",
    pdoe = "",
    pdoi = "",
    ffNo = "",
}) {
    try {
        const res = await apiRequest("/Utility/UpdateTravelerDetail", {
            method: "POST",
            body: {
                TravelerId: travelerId,
                FirstName: firstName,
                LastName: lastName,
                Gender: gender,
                DOB: dob,
                DocumentId: documentId,
                NationalityCode: nationalityCode,
                PassportNo: passportNo,
                PIC: pic,
                PDOE: pdoe,
                PDOI: pdoi,
                FFNO: ffNo,
            },
        });
 
        const payload = res?.ServiceResponse ?? {};
 
        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not update traveler." };
        }
 
        return { success: true, message: payload.Message || "Traveler updated successfully." };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "Network error. Please try again." };
    }
}
 

export async function insertTravelerDetail({
    firstName,
    lastName,
    gender,
    dob,
    documentId = "",
    nationalityCode,
    passportNo = "",
    pic = "",
    pdoe = "",
    pdoi = "",
    ffNo = "",
}) {
    try {
        const res = await apiRequest("/Utility/InsertTravelerDetail", {
            method: "POST",
            body: {
                FirstName: firstName,
                LastName: lastName,
                Gender: gender,
                DOB: dob,
                DocumentId: documentId,
                NationalityCode: nationalityCode,
                PassportNo: passportNo,
                PIC: pic,
                PDOE: pdoe,
                PDOI: pdoi,
                FFNO: ffNo,
            },
        });
 
        const payload = res?.ServiceResponse ?? {};
 
        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not add traveler.", travelerId: null };
        }
 
        return {
            success: true,
            message: payload.Message || "Traveler added successfully.",
            travelerId: payload.TravelerId ?? payload.TravelerID ?? null,
        };
    } catch (error) {
        if (error instanceof ApiError) {
            return { success: false, message: error.message, travelerId: null };
        }
        return { success: false, message: "Network error. Please try again.", travelerId: null };
    }
}
 

/**
 * @param {{ tabId?: number, pageNumber?: number, pageSize?: number, signal?: AbortSignal }} [options]
 */
export async function getTransactionHistory({ tabId = 1, pageNumber = 1, pageSize = 30, signal } = {}) {
    try {
        const res = await apiRequest("/Reports/TransactionHistory", {
            method: "POST",
            body: {
                TabId: tabId,
                PageNumber: pageNumber,
                PageSize: pageSize,
            },
            signal,
        });
 
        const payload = res?.ServiceResponse ?? {};
 
        if (payload.ErrorCode) {
            return { success: false, message: payload.Message || "Could not fetch bookings.", bookings: [], hasMore: false };
        }
 
        const rows = payload.History || [];
 
        const grouped = new Map();
 
        for (const h of rows) {
            const ref = h.ReferenceNo || String(h.TransactionId);
 
            if (!grouped.has(ref)) {
                grouped.set(ref, {
                    referenceNo: h.ReferenceNo || "",
                    transactionId: h.TransactionId,
                    crsPnr: h.CRSPNR || "",
                    airlinePnr: h.AirlinePNR || "",
                    createdDate: h.CreatedDate || "",
                    bookingStatus: h.BookingStatus || "",
                    currentStatus: h.CurrentStatus || "",
                    travelerName: h.FirstTravelerName || "",
                    totalPax: h.TotalPax ?? null,
                    adt: h.Adt ?? 0,
                    chd: h.Chd ?? 0,
                    inf: h.Inf ?? 0,
                    cabin: h.Cabin || "",
                    legs: [],
                });
            }
 
            grouped.get(ref).legs.push({
                searchType: h.SearchType || "",
                sector: h.Sector || "",
                date: h.Date || "",
            });
        }
 
const legOrder = { ON: 0, RT: 1 };


function deriveSearchType(legs) {
    const types = new Set(legs.map((l) => l.searchType));
    if (types.has("RS")) return "RS";
    if (types.has("RT")) return "RT";
    if (types.has("ON")) return "ON";
    return legs[0]?.searchType || "";
}

const bookings = Array.from(grouped.values()).map((b) => ({
    ...b,
    searchType: deriveSearchType(b.legs),
    legs: b.legs.sort((a, c) => (legOrder[a.searchType] ?? 9) - (legOrder[c.searchType] ?? 9)),
}));
 
        // Most recently created first.
        bookings.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
 
        return {
            success: true,
            message: payload.Message || null,
            bookings,
            hasMore: rows.length >= pageSize,
            pageNumber,
            pageSize,
        };
    } catch (error) {
        if (error?.name === "AbortError") throw error;
        if (error instanceof ApiError) {
            return { success: false, message: error.message, bookings: [], hasMore: false };
        }
        return { success: false, message: "Network error. Please try again.", bookings: [], hasMore: false };
    }
}
 
export async function pollTransactionHistoryPage({ tabId = 1, pageNumber, pageSize = 30 }) {
    return getTransactionHistory({ tabId, pageNumber, pageSize });
}


export async function getPinCodeDetails(pinCode, { signal } = {}) {
    try {
        const res = await apiRequest(`/Utility/PinCodeDetails/${pinCode}`, {
            method: "GET",
            signal,
        });

        const payload = res?.ServiceResponse ?? {};

        if (payload.ErrorCode || !payload.PinCodeDetails?.length) {
            return {
                success: false,
                message: payload.Message || "Invalid PIN code",
                stateCode: null,
                stateName: null,
            };
        }

        const detail = payload.PinCodeDetails[0];

        return {
            success: true,
            message: payload.Message || null,
            stateCode: detail.StateCode,
            stateName: detail.StateName,
        };
    } catch (error) {
        if (error?.name === "AbortError") throw error;
        if (error instanceof ApiError) {
            return { success: false, message: error.message, stateCode: null, stateName: null };
        }
        return { success: false, message: "Network error. Please try again.", stateCode: null, stateName: null };
    }
}