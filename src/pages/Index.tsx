import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getFruangenSiteId, getTripsFromCoordsToDest, Trip } from "@/api/sl";
import TripCard from "@/components/TripCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { toast } from "sonner";
import { MapPin } from "lucide-react";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Kontrollera om API-nyckel finns
  const hasApiKey = !!import.meta.env.VITE_TRAFIKLAB_KEY;

  const handleSearchTrips = async () => {
    setError(null);
    setTrips([]);

    if (!hasApiKey) {
      setError(
        "API-nyckel saknas. Vänligen konfigurera VITE_TRAFIKLAB_KEY i din miljö. Se README för instruktioner."
      );
      return;
    }

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

      // Hämta Fruängen SiteId
      setLoadingMessage("Hämtar hållplatsinformation...");
      const fruangenSiteId = await getFruangenSiteId();

      // Hämta resor
      setLoadingMessage("Hämtar resor...");
      const fetchedTrips = await getTripsFromCoordsToDest(
        latitude,
        longitude,
        fruangenSiteId
      );

      setTrips(fetchedTrips);
      toast.success(`Hittade ${fetchedTrips.length} resor till Fruängen!`);
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
            Fruängen Direkt
          </h1>
          <p className="text-sm text-muted-foreground">
            Tryck för att hitta bästa resan från din plats till Fruängen.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* API Key Warning */}
          {!hasApiKey && (
            <ErrorMessage message="API-nyckel saknas. Konfigurera VITE_TRAFIKLAB_KEY för att använda appen. Se README för instruktioner." />
          )}

          {/* Main Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className="h-20 px-16 text-2xl font-bold shadow-button hover:shadow-lg transition-all"
              onClick={handleSearchTrips}
              disabled={loading || !hasApiKey}
              aria-label="Sök resor till Fruängen"
            >
              <MapPin className="w-6 h-6 mr-2" />
              FRUÄNGEN
            </Button>
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
