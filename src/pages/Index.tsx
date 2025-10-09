import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSiteId, getTripsFromCoordsToDest, getNearbyStops, Trip } from "@/api/sl";
import TripCard from "@/components/TripCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { toast } from "sonner";
import { MapPin, Search } from "lucide-react";

// Funktion för att beräkna avstånd mellan två koordinater (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Jordens radie i meter
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{lat: number, lon: number} | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setLoadingMessage("Söker efter hållplatser...");
    setError(null);
    setSearchResults([]);

    try {
      // Först försök att hitta hållplatser direkt
      const response = await fetch(`/api/sl/stop-finder?name_sf=${encodeURIComponent(searchQuery)}&any_obj_filter_sf=46&type_sf=any`);
      
      if (!response.ok) {
        throw new Error(`Sökfel: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.locations && data.locations.length > 0) {
        // Om vi hittade hållplatser direkt, visa dem
        setSearchResults(data.locations.slice(0, 5));
        toast.success(`Hittade ${data.locations.length} hållplatser`);
      } else {
        // Om inga hållplatser hittades direkt, försök geokoda adressen
        setLoadingMessage("Inga hållplatser hittades direkt. Geokodar adress...");
        
        // Använd Nominatim för geokodning (OpenStreetMap) med Stockholm som prioritet
        let geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + " Stockholm")}&countrycodes=se&limit=1`);
        
        if (!geocodeResponse.ok) {
          throw new Error("Kunde inte geokoda adressen");
        }
        
        let geocodeData = await geocodeResponse.json();
        
        // Om ingen resultat med Stockholm, försök utan
        if (!geocodeData || geocodeData.length === 0) {
          geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=se&limit=1`);
          
          if (!geocodeResponse.ok) {
            throw new Error("Kunde inte geokoda adressen");
          }
          
          geocodeData = await geocodeResponse.json();
        }
        
        if (!geocodeData || geocodeData.length === 0) {
          // Om geokodningen misslyckas, försök med textbaserad sökning som sista utväg
          setLoadingMessage("Försöker hitta hållplatser med textbaserad sökning...");
          
          const textSearchResponse = await fetch(`/api/sl/stop-finder?name_sf=${encodeURIComponent(searchQuery)}&any_obj_filter_sf=2&type_sf=any`);
          
          if (textSearchResponse.ok) {
            const textSearchData = await textSearchResponse.json();
            if (textSearchData.locations && textSearchData.locations.length > 0) {
              setSearchResults(textSearchData.locations.slice(0, 5));
              toast.success(`Hittade ${textSearchData.locations.length} hållplatser`);
              return;
            }
          }
          
          // Ge förslag på alternativa söktermer baserat på område
          const suggestions = [
            "Slussen", "Centralen", "T-Centralen", "Gamla Stan", "Östermalmstorg"
          ];
          
          setError(`Kunde inte hitta adressen "${searchQuery}". Prova att söka efter en hållplats direkt, t.ex. ${suggestions.join(", ")}.`);
          return;
        }
        
        const { lat, lon } = geocodeData[0];
        setLoadingMessage("Hämtar närliggande hållplatser...");
        
        // Hitta närliggande hållplatser med större radie för specifika adresser
        let nearbyStops = await getNearbyStops(parseFloat(lat), parseFloat(lon), 2000);
        
        // Om inga hållplatser hittades med koordinater, försök med textbaserad sökning
        if (nearbyStops.length === 0) {
          setLoadingMessage("Söker efter hållplatser i området...");
          
          // Extrahera gatunamn från adressen för att söka efter hållplatser
          const streetName = searchQuery.split(' ')[0]; // Ta första ordet som gatunamn
          
          // Försök först med gatunamn
          let textSearchResponse = await fetch(`/api/sl/stop-finder?name_sf=${encodeURIComponent(streetName)}&any_obj_filter_sf=2&type_sf=any`);
          
          if (textSearchResponse.ok) {
            const textSearchData = await textSearchResponse.json();
            if (textSearchData.locations && textSearchData.locations.length > 0) {
              nearbyStops = textSearchData.locations;
            }
          }
          
          // Om fortfarande inga hållplatser, försök med hela söktermen
          if (nearbyStops.length === 0) {
            textSearchResponse = await fetch(`/api/sl/stop-finder?name_sf=${encodeURIComponent(searchQuery)}&any_obj_filter_sf=2&type_sf=any`);
            
            if (textSearchResponse.ok) {
              const textSearchData = await textSearchResponse.json();
              if (textSearchData.locations && textSearchData.locations.length > 0) {
                nearbyStops = textSearchData.locations;
              }
            }
          }
        }
        
        if (nearbyStops.length === 0) {
          // Ge förslag på alternativa söktermer baserat på område
          const suggestions = [
            "Slussen", "Centralen", "T-Centralen", "Gamla Stan", "Östermalmstorg"
          ];
          
          setError(`Inga hållplatser hittades nära "${searchQuery}". Prova att söka efter en hållplats direkt, t.ex. ${suggestions.join(", ")}.`);
          return;
        }
        
        setSearchResults(nearbyStops.slice(0, 5));
        toast.success(`Hittade ${nearbyStops.length} närliggande hållplatser`);
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError("Kunde inte söka efter hållplatser. Kontrollera din internetanslutning.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleSelectDestination = (location: any) => {
    setSelectedDestination(location.name);
    setSearchResults([]);
    setSearchQuery("");
    toast.success(`Vald destination: ${location.name}`);
  };

  const handleSearchTrips = async (destination: string) => {
    setError(null);
    setTrips([]);

    // Kontrollera om geolocation finns
    if (!navigator.geolocation) {
      setError("Din webbläsare stöder inte positionering.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Hämtar position...");

    try {
      // Hämta användarens position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setUserCoords({ lat: latitude, lon: longitude });

      // Hämta destination SiteId
      setLoadingMessage("Hämtar hållplatsinformation...");
      const siteId = await getSiteId(destination);

      // Hämta resor
      setLoadingMessage("Hämtar resor...");
      const fetchedTrips = await getTripsFromCoordsToDest(
        latitude,
        longitude,
        siteId
      );

      setTrips(fetchedTrips);
      toast.success(`Hittade ${fetchedTrips.length} resor till ${destination}!`);
    } catch (err: any) {
      console.error("Error fetching trips:", err);

      if (err.code === 1) {
        // PERMISSION_DENIED
        setError("Du behöver tillåta plats för att söka resor.");
      } else if (err.code === 2) {
        // POSITION_UNAVAILABLE
        setError("Din position kunde inte hittas. Kontrollera dina inställningar.");
      } else if (err.code === 3) {
        // TIMEOUT
        setError("Det tog för lång tid att hitta din position. Försök igen.");
      } else if (err.message && err.message.includes("internetanslutning")) {
        setError("Problem med internetanslutning. Kontrollera att du är ansluten till internet och försök igen.");
      } else if (err.message && err.message.includes("Fel vid uppslag")) {
        setError("Kunde inte hitta Fruängen-hållplatsen. Kontrollera din internetanslutning.");
      } else if (err.message && err.message.includes("Fel vid hämtning av resor")) {
        setError("Kunde inte hämta reseförslag. Kontrollera din internetanslutning.");
      } else if (err.message) {
        setError(err.message);
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
            Stockholm Direkt
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
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground">Hållplatser:</h3>
                {searchResults.map((location, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handleSelectDestination(location)}
                  >
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{location.name}</div>
                      {location.disassembledName && location.disassembledName !== location.name && (
                        <div className="text-xs text-muted-foreground">{location.disassembledName}</div>
                      )}
                      {location.coord && userCoords && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Avstånd: {Math.round(calculateDistance(
                            location.coord[1], location.coord[0],
                            userCoords.lat, userCoords.lon
                          ))} m
                        </div>
                      )}
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
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-4 border-t border-border text-center">
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
