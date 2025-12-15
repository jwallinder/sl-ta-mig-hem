import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSiteId, getTripsFromCoordsToDest, getNearbyStops, Trip, Location, Locations, JOURNEY_PLANNER_V2_URL } from "@/api/sl";
import TripCard from "@/components/TripCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { toast } from "sonner";
import { MapPin, Search, Train, Bus, Zap, Ship, Car } from "lucide-react";

// Mapping of SL API productClasses to icons and colors
const getTransportModeInfoFromProductClass = (productClass: number) => {
  switch (productClass) {
    case 0: // train
      return { icon: Train, color: 'text-purple-600', label: 'Pendeltåg' };
    case 2: // metro
      return { icon: Train, color: 'text-green-600', label: 'Tunnelbana' };
    case 4: // train/tram
      return { icon: Zap, color: 'text-orange-600', label: 'Lokaltåg/Spårvagn' };
    case 5: // bus
      return { icon: Bus, color: 'text-blue-600', label: 'Buss' };
    case 9: // ship and ferry
      return { icon: Ship, color: 'text-cyan-600', label: 'Färja' };
    case 10: // transit on demand area service
      return { icon: Car, color: 'text-yellow-600', label: 'Anropsstyrd trafik' };
    case 14: // long distance/express train
      return { icon: Train, color: 'text-red-600', label: 'Express tåg' };
    default:
      return { icon: MapPin, color: 'text-gray-600', label: 'Okänd trafikslag' };
  }
};

// Fallback mapping based on type (for backward compatibility)
const getTransportModeInfoFromType = (type: string) => {
  const typeLower = type.toLowerCase();
  
  if (typeLower.includes('metro') || typeLower.includes('tunnelbana') || typeLower.includes('subway')) {
    return { icon: Train, color: 'text-green-600', label: 'Tunnelbana' };
  }
  if (typeLower.includes('bus') || typeLower.includes('buss')) {
    return { icon: Bus, color: 'text-blue-600', label: 'Buss' };
  }
  if (typeLower.includes('train') || typeLower.includes('tåg') || typeLower.includes('rail') || typeLower.includes('pendeltåg')) {
    return { icon: Train, color: 'text-purple-600', label: 'Tåg' };
  }
  if (typeLower.includes('tram') || typeLower.includes('spårvagn') || typeLower.includes('lightrail')) {
    return { icon: Zap, color: 'text-orange-600', label: 'Spårvagn' };
  }
  if (typeLower.includes('ferry') || typeLower.includes('färja') || typeLower.includes('boat')) {
    return { icon: Ship, color: 'text-cyan-600', label: 'Färja' };
  }
  if (typeLower.includes('taxi') || typeLower.includes('car')) {
    return { icon: Car, color: 'text-yellow-600', label: 'Taxi' };
  }
  
  // Default fallback
  return { icon: MapPin, color: 'text-gray-600', label: 'Hållplats' };
};

// Get all transport modes for a station based on productClasses
const getStationTransportModes = (station: Location) => {
  const productClasses = new Set<number>();
  
  // Add main station's productClasses
  if (station.productClasses && station.productClasses.length > 0) {
    station.productClasses.forEach((pc: number) => productClasses.add(pc));
  }
  
  // Add parent station's productClasses if it exists
  if (station.parent?.productClasses && station.parent.productClasses.length > 0) {
    station.parent.productClasses.forEach((pc: number) => productClasses.add(pc));
  }
  
  return Array.from(productClasses);
};

// Create icons for all transport modes
const getStationIcons = (station: Location) => {
  const productClasses = getStationTransportModes(station);
  
  if (productClasses.length === 0) {
    // Fallback to type-based guess
    if (station.type) {
      return [getTransportModeInfoFromType(station.type)];
    }
    
    // Fallback till namn-baserad gissning
    const name = station.name.toLowerCase();
    if (name.includes('t-centralen') || name.includes('slussen')) {
      return [{ icon: Train, color: 'text-green-600', label: 'Tunnelbana' }];
    }
    return [{ icon: MapPin, color: 'text-gray-600', label: 'Hållplats' }];
  }
  
  return productClasses.map(pc => getTransportModeInfoFromProductClass(pc));
};

// Create a summary of transport modes
const getStationTypeSummary = (station: Location) => {
  const productClasses = getStationTransportModes(station);
  
  if (productClasses.length === 0) {
    // Fallback till typ-baserad gissning
    if (station.type) {
      return getTransportModeInfoFromType(station.type).label;
    }
    return 'Hållplats';
  }
  
  const modeInfo = productClasses.map(pc => getTransportModeInfoFromProductClass(pc));
  const labels = modeInfo.map(info => info.label);
  
  if (labels.length === 1) {
    return labels[0];
  } else if (labels.length <= 3) {
    return labels.join(', ');
  } else {
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} fler`;
  }
};

// Function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Locations>([]);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{lat: number, lon: number} | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setLoadingMessage("Söker efter hållplatser...");
    setError(null);
    setSearchResults([]);

    try {
      // First try to find stops directly
      const response = await fetch(`${JOURNEY_PLANNER_V2_URL}/stop-finder?name_sf=${encodeURIComponent(searchQuery)}&any_obj_filter_sf=46&type_sf=any`);
      
      if (!response.ok) {
        throw new Error(`Sökfel: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.locations && data.locations.length > 0) {
        // If we found stops directly, show them
        setSearchResults(data.locations.slice(0, 5));
        toast.success(`Hittade ${data.locations.length} hållplatser`);
      } else {
        // If no stops found directly, try to geocode the address
        setLoadingMessage("Inga hållplatser hittades direkt. Geokodar adress...");
        
        // Use Nominatim for geocoding (OpenStreetMap) with Stockholm as priority
        let geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + " Stockholm")}&countrycodes=se&limit=1`);
        
        if (!geocodeResponse.ok) {
          throw new Error("Kunde inte geokoda adressen");
        }
        
        let geocodeData = await geocodeResponse.json();
        
        // If no result with Stockholm, try without
        if (!geocodeData || geocodeData.length === 0) {
          geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=se&limit=1`);
          
          if (!geocodeResponse.ok) {
            throw new Error("Kunde inte geokoda adressen");
          }
          
          geocodeData = await geocodeResponse.json();
        }
        
        if (!geocodeData || geocodeData.length === 0) {
          // If geocoding fails, try text-based search as last resort
          setLoadingMessage("Försöker hitta hållplatser med textbaserad sökning...");
          
          const textSearchResponse = await fetch(`${JOURNEY_PLANNER_V2_URL}/stop-finder?name_sf=${encodeURIComponent(searchQuery)}&any_obj_filter_sf=2&type_sf=any`);
          
          if (textSearchResponse.ok) {
            const textSearchData = await textSearchResponse.json();
            if (textSearchData.locations && textSearchData.locations.length > 0) {
              setSearchResults(textSearchData.locations.slice(0, 5));
              toast.success(`Hittade ${textSearchData.locations.length} hållplatser`);
              return;
            }
          }
          
          // Provide suggestions for alternative search terms based on area
          const suggestions = [
            "Slussen", "Centralen", "T-Centralen", "Gamla Stan", "Östermalmstorg"
          ];
          
          setError(`Kunde inte hitta adressen "${searchQuery}". Prova att söka efter en hållplats direkt, t.ex. ${suggestions.join(", ")}.`);
          return;
        }
        
        const { lat, lon } = geocodeData[0];
        setLoadingMessage("Hämtar närliggande hållplatser...");
        
        // Find nearby stops with larger radius for specific addresses
        let nearbyStops = await getNearbyStops(parseFloat(lat), parseFloat(lon), 2000);
        
        // If no stops found with coordinates, try text-based search
        if (nearbyStops.length === 0) {
          setLoadingMessage("Söker efter hållplatser i området...");
          
          // Extract street name from address to search for stops
          const streetName = searchQuery.split(' ')[0]; // Take first word as street name
          
          // Try first with street name
          let textSearchResponse = await fetch(`${JOURNEY_PLANNER_V2_URL}/stop-finder?name_sf=${encodeURIComponent(streetName)}&any_obj_filter_sf=2&type_sf=any`);
          
          if (textSearchResponse.ok) {
            const textSearchData = await textSearchResponse.json();
            if (textSearchData.locations && textSearchData.locations.length > 0) {
              nearbyStops = textSearchData.locations;
            }
          }
          
          // If still no stops, try with full search term
          if (nearbyStops.length === 0) {
            textSearchResponse = await fetch(`${JOURNEY_PLANNER_V2_URL}/stop-finder?name_sf=${encodeURIComponent(searchQuery)}&any_obj_filter_sf=2&type_sf=any`);
            
            if (textSearchResponse.ok) {
              const textSearchData = await textSearchResponse.json();
              if (textSearchData.locations && textSearchData.locations.length > 0) {
                nearbyStops = textSearchData.locations;
              }
            }
          }
        }
        
        if (nearbyStops.length === 0) {
          // Provide suggestions for alternative search terms based on area
          const suggestions = [
            "Slussen", "Centralen", "T-Centralen", "Gamla Stan", "Östermalmstorg"
          ];
          
          setError(`Inga hållplatser hittades nära "${searchQuery}". Prova att söka efter en hållplats direkt, t.ex. ${suggestions.join(", ")}.`);
          return;
        }
        
        setSearchResults(nearbyStops.slice(0, 5));
        toast.success(`Hittade ${nearbyStops.length} närliggande hållplatser`);
      }
    } catch (err: unknown) {
      console.error("Search error:", err);
      setError("Kunde inte söka efter hållplatser. Kontrollera din internetanslutning.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleSelectDestination = (location: Location) => {
    setSelectedDestination(location.name);
    setSearchResults([]);
    setSearchQuery("");
    toast.success(`Vald destination: ${location.name}`);
  };

  const handleSearchTrips = async (destination: string) => {
    setError(null);
    setTrips([]);

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError("Din webbläsare stöder inte positionering.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Hämtar position...");

    try {
      // Get user's position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setUserCoords({ lat: latitude, lon: longitude });

      // Get destination SiteId
      setLoadingMessage("Hämtar hållplatsinformation...");
      const siteId = await getSiteId(destination);

      // Get trips
      setLoadingMessage("Hämtar resor...");
      const fetchedTrips = await getTripsFromCoordsToDest(
        latitude,
        longitude,
        siteId
      );

      setTrips(fetchedTrips);
      if (fetchedTrips.length > 0) {
        toast.success(`Hittade ${fetchedTrips.length} resor till ${destination}!`);
      }
    } catch (err: unknown) {
      console.error("Error fetching trips:", err);

      if (err && typeof err === 'object' && 'code' in err) {
        const geolocationError = err as GeolocationPositionError;
        if (geolocationError.code === 1) {
          // PERMISSION_DENIED
          setError("Du behöver tillåta plats för att söka resor.");
        } else if (geolocationError.code === 2) {
          // POSITION_UNAVAILABLE
          setError("Din position kunde inte hittas. Kontrollera dina inställningar.");
        } else if (geolocationError.code === 3) {
          // TIMEOUT
          setError("Det tog för lång tid att hitta din position. Försök igen.");
        } else {
          setError("Ett oväntat fel uppstod. Försök igen.");
        }
      } else if (err instanceof Error) {
        if (err.message.includes("internetanslutning")) {
          setError("Problem med internetanslutning. Kontrollera att du är ansluten till internet och försök igen.");
        } else if (err.message.includes("Fel vid uppslag")) {
          setError("Kunde inte hitta Fruängen-hållplatsen. Kontrollera din internetanslutning.");
        } else if (err.message.includes("Fel vid hämtning av resor")) {
          setError("Kunde inte hämta reseförslag. Kontrollera din internetanslutning.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Ett oväntat fel uppstod. Försök igen.");
      }
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            SL ta mig hem
          </h1>
          <p className="text-sm text-muted-foreground">
            Välj destination för att hitta bästa resan från din plats.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Search Box */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Sök efter hållplats eller adress..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
                disabled={loading}
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                size="lg"
                className="px-6"
              >
                <Search className="w-4 h-4 mr-2" />
                Sök
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-foreground">Hållplatser:</h3>
                {searchResults.map((location, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-4 hover:bg-muted transition-colors"
                    onClick={() => handleSelectDestination(location)}
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex items-center space-x-1">
                          {getStationIcons(location).map((modeInfo, index) => {
                            const IconComponent = modeInfo.icon;
                            return (
                              <div key={index} className="flex items-center">
                                <IconComponent className={`w-4 h-4 ${modeInfo.color}`} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base text-foreground leading-tight">
                          {location.name}
                        </div>
                        {location.disassembledName && location.disassembledName !== location.name && (
                          <div className="text-sm text-muted-foreground mt-1 leading-tight">
                            {location.disassembledName}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-muted-foreground">
                            {getStationTypeSummary(location)}
                          </div>
                          {location.coord && userCoords && (
                            <div className="text-xs text-muted-foreground">
                              {Math.round(calculateDistance(
                                location.coord[1], location.coord[0],
                                userCoords.lat, userCoords.lon
                              ))} m bort
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* Selected Destination Button */}
            {selectedDestination && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Vald destination:</h3>
                <Button
                  size="lg"
                  className="w-full h-16 text-lg font-bold shadow-button hover:shadow-lg transition-all"
                  onClick={() => handleSearchTrips(selectedDestination)}
                  disabled={loading}
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  {selectedDestination}
                </Button>
              </div>
            )}

            {/* Quick Access Buttons */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Snabbval:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 text-base font-bold"
                  onClick={() => handleSearchTrips("Fruängen")}
                  disabled={loading}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  FRUÄNGEN
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 text-base font-bold"
                  onClick={() => handleSearchTrips("T-Centralen")}
                  disabled={loading}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  T-CENTRALEN
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 text-base font-bold"
                  onClick={() => handleSearchTrips("Kungens Kurva")}
                  disabled={loading}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  XXL KUNGENS KURVA
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && <LoadingSpinner message={loadingMessage} />}

          {/* Error State */}
          {error && !loading && <ErrorMessage message={error} />}

          {/* Trip Results */}
          {trips.length > 0 && !loading && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Reseförslag ({trips.length})
              </h2>
              {trips.map((trip, index) => (
                <TripCard key={index} trip={trip} index={index} />
              ))}
            </div>
          )}

          {/* No trips found message */}
          {trips.length === 0 && !loading && !error && userCoords && selectedDestination && (
            <div className="text-center py-8">
              <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Inga resor kan hittas till din destination
              </h3>
              <p className="text-sm text-muted-foreground">
                Det gick inte att hitta några reseförslag till {selectedDestination}. Prova att söka efter en annan destination.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 w-full py-4 px-4 border-t border-border bg-background text-center space-x-4">
        <a
          href="/about"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Om oss
        </a>
        <span className="text-sm text-muted-foreground">•</span>
        <a
          href="/privacy"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Integritetspolicy
        </a>
      </footer>
    </div>
  );
};

export default Index;
