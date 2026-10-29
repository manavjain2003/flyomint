export type Airport = {
    AirportCode: string;
    AirportName: string;
    CityCode: string;
    CityName: string;
    CountryCode: string;
    CountryName: string;
    StateName?: string;
    OrderBy: number;
};

export type PTCFareEntry = {
    PTC: string;
    Fare: number;
    Tax: number;
    GrossFare: number;
    NetFare: number;
    FareMessage?: string;
};

export type FareInfo = {
    FareType: string;
    GrossFare: number;
    NetFare: number;
    Refundable: "Y" | "N" | "P";
    Seats: number;
    ConId: string;
    Index: string;
    FareDisplayType?: "P" | "S" | "G" | "N";
    PTCFare?: PTCFareEntry[];
    Baggage?: { PTC?: string; CabinBag?: string; CheckinBaggage?: string }[];
};

export type Segment = {
    SID: string;
    FlightNo: string;
    AirlineCode: string;
    AirlineName: string;
    DepartureTime: string;
    ArrivalTime: string;
    DepartureAirportCode: string;
    ArrivalAirportCode: string;
    DepartureAirportName?: string;
    ArrivalAirportName?: string;
    DepartureTerminal?: string;
    ArrivalTerminal?: string;
    DepartureNearBy?: string;
    ArrivalNearBy?: string;
    VACLogo?: string;
    MACLogo?: string;
    OACLogo?: string;
    Cabin: string;
    Duration?: string;
    Layover?: string;
};

export type Journey = {
    Stops: number;
    From: string;
    To: string;
    FromCity: string;
    ToCity: string;
    FareInfo: FareInfo[] | null;
    Segments: Segment[];
    Duration: string;
    DepartureDateTime: string;
    ArrivalDateTime: string;
    GroupId: string;
      DepartureNearBy?: string;
  ArrivalNearBy?: string;
    ReturnIdentifier?: number;
};

export type Trip = {
    Journey: Journey[];
};

export type JourneyPair = {
    onward: Journey;
    onwardFare: FareInfo;
    ret: Journey;
    retFare: FareInfo;
};

export type CabinClass = "economy" | "premium" | "business" | "first";
export type TripType = "oneway" | "roundtrip";
export type SpecialFare = "regular" | "student" | "senior" | "armed";
export type FlightType = "all" | "direct" | "connecting";

export type TravelerCounts = { adults: number; children: number; infants: number };

export type TimeSlot = "early" | "morning" | "afternoon" | "evening";

export type Filters = {
    maxPrice: number | null;
    stops: Set<number>;
    airlines: Set<string>;
    timeSlots: Set<TimeSlot>;
};

export type SearchCriteria = {
    from: string;
    to: string;
    fromCity: string;
    toCity: string;
    fromAirport?: Airport | null;
    toAirport?: Airport | null;
    tripType: TripType;
    adults: number;
    children: number;
    infants: number;
    cabinClass: CabinClass;
    directOnly: boolean;
    specialFare: SpecialFare;
};

export type DetailTab = "FLIGHT" | "BAGGAGE" | "FARE" | "RULES";