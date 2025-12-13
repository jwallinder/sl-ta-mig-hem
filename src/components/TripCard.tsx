import { Card } from "@/components/ui/card";
import { Trip } from "@/api/sl";
import { Clock, MapPin, ArrowRight } from "lucide-react";

interface TripCardProps {
  trip: Trip;
  index: number;
}

const TripCard = ({ trip, index }: TripCardProps) => {
  const legs = trip.legs;
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];

  // Format time from ISO string to HH:MM
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  };

  // Format duration from seconds to readable text
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} tim ${minutes} min`;
    }
    return `${minutes} min`;
  };

  // Icons and names based on transport type
  const getTransportInfo = (leg: typeof legs[0]) => {
    const productName = leg.transportation.product?.name || leg.transportation.type;
    
    if (productName === "footpath") {
      return { icon: "🚶", name: "Gång" };
    }
    if (productName?.toLowerCase().includes("metro") || productName?.toLowerCase().includes("subway")) {
      return { icon: "🚇", name: "Tunnelbana" };
    }
    if (productName?.toLowerCase().includes("bus")) {
      return { icon: "🚌", name: "Buss" };
    }
    if (productName?.toLowerCase().includes("train")) {
      return { icon: "🚊", name: "Pendeltåg" };
    }
    return { icon: "🚍", name: productName || "Transport" };
  };

  return (
    <Card className="p-4 shadow-card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold">{formatTime(firstLeg.origin.departureTimePlanned || firstLeg.origin.departureTimeEstimated)}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold">{formatTime(lastLeg.destination.arrivalTimePlanned || lastLeg.destination.arrivalTimeEstimated)}</span>
        </div>
        <div className="text-sm font-medium text-foreground">
          {formatDuration(trip.tripDuration)}
        </div>
      </div>

      <div className="space-y-3">
        {legs.map((leg, legIndex) => {
          const transportInfo = getTransportInfo(leg);
          const isWalking = leg.transportation.product?.name === "footpath";
          
          return (
            <div key={legIndex} className="flex items-start gap-3 text-sm">
              <span className="text-xl mt-0.5">{transportInfo.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">
                    {transportInfo.name}
                  </span>
                  {!isWalking && leg.transportation.name && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {leg.transportation.name}
                    </span>
                  )}
                  {!isWalking && leg.transportation.direction && (
                    <span className="text-xs text-muted-foreground">
                      mot {leg.transportation.direction}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{formatTime(leg.origin.departureTimePlanned || leg.origin.departureTimeEstimated)}</span>
                  <span>→</span>
                  <span>{formatTime(leg.destination.arrivalTimePlanned || leg.destination.arrivalTimeEstimated)}</span>
                  {isWalking && leg.distance && (
                    <span className="ml-2">({leg.distance} m)</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {leg.origin.name} → {leg.destination.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
        <MapPin className="w-3 h-3" />
        <span>Från {firstLeg.origin.name}</span>
      </div>
    </Card>
  );
};

export default TripCard;
