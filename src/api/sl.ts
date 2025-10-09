// SL API Client for Trafiklab

const API_KEY = import.meta.env.VITE_TRAFIKLAB_KEY;
const TYPEAHEAD_URL = "https://api.sl.se/api2/typeahead.json";
const JOURNEY_PLANNER_URL = "https://api.sl.se/api2/TravelplannerV3_1/trip.json";

// Cache för Fruängen SiteId
let fruangenSiteIdCache: string | null = null;

export interface TypeaheadResponse {
  StatusCode: number;
  Message: string | null;
  ExecutionTime: number;
  ResponseData: Array<{
    Name: string;
    SiteId: string;
    Type: string;
    X: string;
    Y: string;
  }>;
}

export interface JourneyLeg {
  Origin: {
    name: string;
    time: string;
    date: string;
  };
  Destination: {
    name: string;
    time: string;
    date: string;
  };
  Product?: {
    name: string;
    num: string;
    catCode: string;
    catOutL: string;
  };
  type: string;
  dist?: string;
}

export interface Trip {
  LegList: {
    Leg: JourneyLeg[];
  };
  dur: string;
}

export interface JourneyPlannerResponse {
  Trip?: Trip[];
  Message?: string;
  StatusCode?: number;
}

/**
 * Hämta SiteId för Fruängen från SL Typeahead API
 * Cachas efter första anropet
 */
export async function getFruangenSiteId(): Promise<string> {
  if (fruangenSiteIdCache) {
    return fruangenSiteIdCache;
  }

  const params = new URLSearchParams({
    key: API_KEY || "",
    searchstring: "Fruängen",
    stationsonly: "true",
    maxresults: "1",
  });

  const response = await fetch(`${TYPEAHEAD_URL}?${params}`);
  
  if (!response.ok) {
    throw new Error(`Fel vid uppslag av Fruängen: ${response.status}`);
  }

  const data: TypeaheadResponse = await response.json();

  if (data.StatusCode !== 0 || !data.ResponseData || data.ResponseData.length === 0) {
    throw new Error("Kunde inte hitta hållplatsen Fruängen just nu");
  }

  fruangenSiteIdCache = data.ResponseData[0].SiteId;
  return fruangenSiteIdCache;
}

/**
 * Hämta reseförslag från användarens koordinater till Fruängen
 */
export async function getTripsFromCoordsToDest(
  lat: number,
  lon: number,
  destId: string
): Promise<Trip[]> {
  const params = new URLSearchParams({
    key: API_KEY || "",
    originCoordLat: lat.toString(),
    originCoordLong: lon.toString(),
    destId: destId,
    numTrips: "3",
  });

  const response = await fetch(`${JOURNEY_PLANNER_URL}?${params}`);
  
  if (!response.ok) {
    throw new Error(`Fel vid hämtning av resor: ${response.status}`);
  }

  const data: JourneyPlannerResponse = await response.json();

  if (data.StatusCode && data.StatusCode !== 0) {
    throw new Error(data.Message || "Kunde inte hämta resor. Försök igen.");
  }

  if (!data.Trip || data.Trip.length === 0) {
    throw new Error("Inga resor hittades");
  }

  return data.Trip;
}
