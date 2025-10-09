import { Card } from "@/components/ui/card";
import { Trip } from "@/api/sl";
import { Clock, MapPin, ArrowRight } from "lucide-react";

interface TripCardProps {
  trip: Trip;
  index: number;
}

const TripCard = ({ trip, index }: TripCardProps) => {
  const legs = trip.LegList.Leg;
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];

  // Formatera tid från "HH:MM:SS" till "HH:MM"
  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  // Formatera varaktighet från "HH:MM:SS" eller "MM:SS" till läsbar text
  const formatDuration = (dur: string) => {
    const parts = dur.split(":");
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      if (hours > 0) {
        return `${hours} tim ${minutes} min`;
      }
      return `${minutes} min`;
    }
    return dur;
  };

  // Ikoner baserat på transporttyp
  const getTransportIcon = (leg: typeof legs[0]) => {
    if (leg.type === "WALK") return "🚶";
    if (leg.Product?.catCode === "1") return "🚇"; // Tunnelbana
    if (leg.Product?.catCode === "2") return "🚌"; // Buss
    if (leg.Product?.catCode === "3") return "🚊"; // Pendeltåg
    return "🚍";
  };

  return (
    <Card className="p-4 shadow-card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold">{formatTime(firstLeg.Origin.time)}</span>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold">{formatTime(lastLeg.Destination.time)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {formatDuration(trip.dur)}
        </div>
      </div>

      <div className="space-y-2">
        {legs.map((leg, legIndex) => (
          <div key={legIndex} className="flex items-start gap-2 text-sm">
            <span className="text-lg">{getTransportIcon(leg)}</span>
            <div className="flex-1">
              {leg.type === "WALK" ? (
                <span className="text-foreground">
                  Gå {leg.dist ? `${leg.dist} m` : "till nästa hållplats"}
                </span>
              ) : (
                <div>
                  <span className="font-medium text-foreground">
                    {leg.Product?.catOutL} {leg.Product?.num}
                  </span>
                  {legIndex < legs.length - 1 && (
                    <span className="text-muted-foreground ml-1">
                      → {leg.Destination.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
        <MapPin className="w-3 h-3" />
        <span>Från {firstLeg.Origin.name}</span>
      </div>
    </Card>
  );
};

export default TripCard;
