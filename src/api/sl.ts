// SL API Client - Using new SL Journey-planner v2 API (no API key required)
// Always uses proxy to avoid CORS issues

// Always use proxy to avoid CORS issues
const JOURNEY_PLANNER_V2_URL = "/api/sl";

// Export the URL for use in other components
export { JOURNEY_PLANNER_V2_URL };

// Cache for stops
const siteIdCache: { [key: string]: string } = {};

export interface StopFinderResponse {
  locations: Array<{
    isGlobalId: boolean;
    id: string;
    name: string;
    disassembledName: string;
    type: string;
    coord: number[];
    niveau: number;
    parent?: {
      isGlobalId: boolean;
      id: string;
      name: string;
      disassembledName: string;
      type: string;
      coord: number[];
      niveau: number;
    };
  }>;
}

export interface Trip {
  tripDuration: number;
  tripRtDuration: number;
  rating: number;
  isAdditional: boolean;
  interchanges: number;
  legs: Array<{
    origin: {
      name: string;
      disassembledName: string;
      type: string;
      coord: number[];
      departureTimePlanned?: string;
      departureTimeEstimated?: string;
    };
    destination: {
      name: string;
      disassembledName: string;
      type: string;
      coord: number[];
      arrivalTimePlanned?: string;
      arrivalTimeEstimated?: string;
    };
    transportation: {
      name?: string;
      direction?: string;
      type?: string;
      operator?: {
        name: string;
        type: string;
      };
      product?: {
        class: number;
        name: string;
        iconId: number;
      };
      properties?: {
        lineDisplay?: string;
      };
    };
    distance: number;
    duration: number;
    coords: number[][];
  }>;
}

/**
 * Get SiteId for a stop from SL Journey-planner v2 API
 * Cached after first call
 */
export async function getSiteId(destination: string): Promise<string> {
  if (siteIdCache[destination]) {
    return siteIdCache[destination];
  }

  try {
    const params = new URLSearchParams({
      name_sf: destination,
      any_obj_filter_sf: "2", // stops only
      type_sf: "any"
    });

    const response = await fetch(`${JOURNEY_PLANNER_V2_URL}/stop-finder?${params}`);
    if (!response.ok) {
      throw new Error(`Fel vid uppslag av ${destination}: ${response.status}`);
    }

    const data: StopFinderResponse = await response.json();

    if (!data.locations || data.locations.length === 0) {
      throw new Error(`Kunde inte hitta hållplatsen ${destination} just nu`);
    }

    // Find the destination in the results
    const location = data.locations.find(loc => 
      loc.name.toLowerCase().includes(destination.toLowerCase())
    );

    if (!location) {
      throw new Error(`Kunde inte hitta hållplatsen ${destination} just nu`);
    }

    siteIdCache[destination] = location.id;
    return location.id;
  } catch (error) {
    console.error(`Error fetching ${destination} site:`, error);
    throw new Error(`Kunde inte hämta hållplatsinformation för ${destination}. Kontrollera din internetanslutning.`);
  }
}

/**
 * Get nearby stops based on coordinates
 * Uses SL Journey-planner v2 API
 */
export async function getNearbyStops(
  lat: number,
  lon: number,
  radius: number = 1000
): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      type_sf: "coord",
      name_sf: `${lon}:${lat}:WGS84[dd.ddddd]`,
      any_obj_filter_sf: "2", // stops only
      max_no: "10",
      radius_sf: radius.toString()
    });

    const response = await fetch(`${JOURNEY_PLANNER_V2_URL}/stop-finder?${params}`);
    if (!response.ok) {
      throw new Error(`Fel vid hämtning av närliggande hållplatser: ${response.status}`);
    }

    const data: StopFinderResponse = await response.json();

    if (!data.locations || data.locations.length === 0) {
      throw new Error("Inga närliggande hållplatser hittades");
    }

    return data.locations;
  } catch (error) {
    console.error("Error fetching nearby stops:", error);
    throw new Error("Kunde inte hämta närliggande hållplatser. Kontrollera din internetanslutning.");
  }
}

/**
 * Get trip suggestions from user's coordinates to a destination
 * Uses SL Journey-planner v2 API
 */
export async function getTripsFromCoordsToDest(
  lat: number,
  lon: number,
  destId: string
): Promise<Trip[]> {
  try {
    // Convert coordinates to format expected by the API
    const originCoord = `${lon}:${lat}:WGS84[dd.ddddd]`;
    
    const params = new URLSearchParams({
      type_origin: "coord",
      type_destination: "any",
      name_origin: originCoord,
      name_destination: destId,
      calc_number_of_trips: "3"
    });

    const response = await fetch(`${JOURNEY_PLANNER_V2_URL}/trips?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Fel vid hämtning av resor: ${response.status}`);
    }

    const data = await response.json();

    if (!data.journeys || data.journeys.length === 0) {
      return [];
    }

    return data.journeys;
  } catch (error) {
    console.error("Error fetching trips:", error);
    throw new Error("Kunde inte hämta reseförslag. Kontrollera din internetanslutning.");
  }
}
