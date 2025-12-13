import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Clock } from "lucide-react";
import { getSiteId, getTripsFromCoordsToDest, Trip } from "@/api/sl";
import TripCard from "@/components/TripCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { toast } from "sonner";

const Station = () => {
  const { stationName } = useParams<{ stationName: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{lat: number, lon: number} | null>(null);
  const [originName, setOriginName] = useState<string | null>(null);

  const decodedStationName = stationName ? decodeURIComponent(stationName) : "";
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  const handleGetTrips = useCallback(async () => {
    if (!decodedStationName) return;

    setError(null);
    setTrips([]);
    setOriginName(null);

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
      const siteId = await getSiteId(decodedStationName);

      // Get trips
      setLoadingMessage("Hämtar reseförslag...");
      const fetchedTrips = await getTripsFromCoordsToDest(
        latitude,
        longitude,
        siteId
      );

      setTrips(fetchedTrips);
      if (fetchedTrips.length > 0) {
        // Get origin name from first trip's first leg
        const firstTrip = fetchedTrips[0];
        if (firstTrip.legs && firstTrip.legs.length > 0) {
          const originName = firstTrip.legs[0].origin.disassembledName;
          setOriginName(originName);
        }
        toast.success(`Hittade ${fetchedTrips.length} reseförslag till ${decodedStationName}!`);
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
          setError("Kunde inte hitta stationen. Kontrollera din internetanslutning.");
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
  }, [decodedStationName]);

  // Auto-search when component mounts
  useEffect(() => {
    if (decodedStationName && !hasAutoSearched) {
      setHasAutoSearched(true);
      handleGetTrips();
    }
  }, [decodedStationName, hasAutoSearched, handleGetTrips]);

  // Reset auto-search flag when station name changes
  useEffect(() => {
    setHasAutoSearched(false);
  }, [decodedStationName]);

  if (!decodedStationName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Station inte hittad</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {decodedStationName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {originName 
              ? `Söker efter reseförslag från ${originName}.`
              : "Söker efter reseförslag från din plats."
            }
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Station Button */}
          <div className="space-y-4">
            <Button
              id="get-trips-button"
              size="lg"
              className="w-full h-20 text-xl font-bold shadow-button hover:shadow-lg transition-all"
              onClick={handleGetTrips}
              disabled={loading}
            >
              <MapPin className="w-6 h-6 mr-3" />
              {loading ? 'Söker reseförslag...' : 'Uppdatera'}
            </Button>
          </div>

          {/* Loading State */}
          {loading && <LoadingSpinner message={loadingMessage} />}

          {/* Error State */}
          {error && !loading && <ErrorMessage message={error} />}

          {/* Trip Results */}
          {trips.length > 0 && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Reseförslag ({trips.length})
                </h2>
              </div>
              {trips.map((trip, index) => (
                <TripCard key={index} trip={trip} index={index} />
              ))}
            </div>
          )}

          {/* No trips found message */}
          {trips.length === 0 && !loading && !error && userCoords && (
            <div className="text-center py-8">
              <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Inga resor kan hittas till din destination
              </h3>
              <p className="text-sm text-muted-foreground">
                Det gick inte att hitta några reseförslag till {decodedStationName}. Prova att söka efter en annan destination.
              </p>
            </div>
          )}

          {/* Instructions when no trips yet */}
          {trips.length === 0 && !loading && !error && !userCoords && (
            <div className="text-center py-8">
              <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Redo att hitta reseförslag?
              </h3>
              <p className="text-sm text-muted-foreground">
                Klicka på knappen ovan för att hämta reseförslag från din nuvarande plats till {decodedStationName}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-4 border-t border-border text-center space-x-4">
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

export default Station;

