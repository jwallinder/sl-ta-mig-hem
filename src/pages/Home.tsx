import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Train, Bus, Navigation, Zap, Ship, Car } from "lucide-react";
import { toast } from "sonner";
import { JOURNEY_PLANNER_V2_URL } from "@/api/sl";

interface Station {
  id: string;
  name: string;
  disassembledName: string;
  coord: number[];
  type: string;
  productClasses?: number[];
  parent?: {
    isGlobalId: boolean;
    id: string;
    name: string;
    disassembledName: string;
    type: string;
    coord: number[];
    niveau: number;
    productClasses?: number[];
  };
}

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
const getStationTransportModes = (station: Station) => {
  const productClasses = new Set<number>();
  
  // Add main station's productClasses
  if (station.productClasses && station.productClasses.length > 0) {
    station.productClasses.forEach(pc => productClasses.add(pc));
  }
  
  // Add parent station's productClasses if it exists
  if (station.parent?.productClasses && station.parent.productClasses.length > 0) {
    station.parent.productClasses.forEach(pc => productClasses.add(pc));
  }
  
  return Array.from(productClasses);
};

// Create icons for all transport modes
const getStationIcons = (station: Station) => {
  const productClasses = getStationTransportModes(station);
  
  if (productClasses.length === 0) {
    // Fallback to type-based guess
    if (station.type) {
      return [getTransportModeInfoFromType(station.type)];
    }
    
    // Fallback to name-based guess
    const name = station.name.toLowerCase();
    if (name.includes('t-centralen') || name.includes('slussen')) {
      return [{ icon: Train, color: 'text-green-600', label: 'Tunnelbana' }];
    }
    return [{ icon: MapPin, color: 'text-gray-600', label: 'Hållplats' }];
  }
  
  return productClasses.map(pc => getTransportModeInfoFromProductClass(pc));
};

// Create a summary of transport modes
const getStationTypeSummary = (station: Station) => {
  const productClasses = getStationTransportModes(station);
  
  if (productClasses.length === 0) {
    // Fallback to type-based guess
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
      const response = await fetch(`${JOURNEY_PLANNER_V2_URL}/stop-finder?name_sf=${encodeURIComponent(query)}&any_obj_filter_sf=2&type_sf=any`);
      
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
            SL ta mig hem
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
                      className="w-full text-left px-4 py-4 hover:bg-muted transition-colors border-b border-border last:border-b-0 focus:bg-muted focus:outline-none"
                      onClick={() => handleStationSelect(station)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="flex items-center space-x-1">
                            {getStationIcons(station).map((modeInfo, index) => {
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
                            {station.name}
                          </div>
                          {station.disassembledName && station.disassembledName !== station.name && (
                            <div className="text-sm text-muted-foreground mt-1 leading-tight">
                              {station.disassembledName}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {getStationTypeSummary(station)}
                          </div>
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

export default Home;

