import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Station {
  id: string;
  name: string;
  disassembledName: string;
  coord: number[];
}

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  // Debounced search function
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchStations(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchStations = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/sl/stop-finder?name_sf=${encodeURIComponent(query)}&any_obj_filter_sf=2&type_sf=any`);
      
      if (!response.ok) {
        throw new Error(`Sökfel: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.locations && data.locations.length > 0) {
        setSearchResults(data.locations.slice(0, 8)); // Visa max 8 resultat
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStationSelect = (station: Station) => {
    setSearchQuery(station.name);
    setShowResults(false);
    navigate(`/station/${encodeURIComponent(station.name)}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/station/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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
            Sök efter en station för att hitta reseförslag
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Search Section */}
          <div className="space-y-4">
            <div className="relative">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Sök efter station..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setShowResults(true)}
                    className="w-full"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  size="lg"
                  className="px-6"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Sök
                </Button>
              </div>

              {/* Autocomplete Results */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  {searchResults.map((station, index) => (
                    <button
                      key={station.id}
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      onClick={() => handleStationSelect(station)}
                    >
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-3 flex-shrink-0 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{station.name}</div>
                          {station.disassembledName && station.disassembledName !== station.name && (
                            <div className="text-xs text-muted-foreground">{station.disassembledName}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10">
                  <div className="px-4 py-3 text-muted-foreground">
                    Inga stationer hittades
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Populära stationer:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {["T-Centralen", "Slussen", "Gamla Stan", "Östermalmstorg", "Fruängen", "Kungens Kurva"].map((station) => (
                <Button
                  key={station}
                  variant="outline"
                  className="h-12 text-base font-medium"
                  onClick={() => navigate(`/station/${encodeURIComponent(station)}`)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {station}
                </Button>
              ))}
            </div>
          </div>
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

export default Home;

