import { Ship, Bus, Train } from "lucide-react";
import type { TransportStop } from "@shared/schema";
import ProfileSelector from "./profile-selector";
import { useQuery } from "@tanstack/react-query";
import { useTransportProfiles } from "@/hooks/use-transport-profiles";

export default function Transport() {
  const { activeProfile } = useTransportProfiles();
  
  // Fetch transport data based on active profile
  const { data: stops = [], isLoading } = useQuery({
    queryKey: ['/api/transport', activeProfile?.profileId],
    queryFn: () => {
      const url = activeProfile?.profileId 
        ? `/api/transport?profileId=${activeProfile.profileId}`
        : '/api/transport';
      return fetch(url).then(res => res.json());
    },
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    enabled: !!activeProfile
  });
  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'boat':
        return <Ship className="w-6 h-6" />;
      case 'bus':
        return <Bus className="w-6 h-6" />;
      case 'metro':
        return <Train className="w-6 h-6" />;
      default:
        return <Bus className="w-6 h-6" />;
    }
  };

  const getTransportTypeText = (type: string) => {
    switch (type) {
      case 'boat':
        return 'Båt • Boat';
      case 'bus':
        return 'Buss • Bus';
      case 'metro':
        return 'Tunnelbana • Metro';
      default:
        return 'Transport';
    }
  };

  const getTransportColor = (type: string) => {
    switch (type) {
      case 'boat':
        return 'text-transport-boat';
      case 'bus':
        return 'text-transport-bus';
      case 'metro':
        return 'text-transport-metro';
      default:
        return 'text-gray-400';
    }
  };

  const getTransportTypeColor = (type: string) => {
    switch (type) {
      case 'boat':
        return '#2196F3'; // Blue for boats
      case 'bus':
        return '#FF5722'; // Orange/red for buses  
      case 'metro':
        return '#4CAF50'; // Green for metro
      case 'train':
        return '#9C27B0'; // Purple for trains
      case 'tram':
        return '#FF9800'; // Orange for trams
      default:
        return '#757575'; // Gray for unknown
    }
  };

  return (
    <div className="w-full px-12 py-8">
      <div className={`grid gap-12 ${stops.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {stops.map((stop) => (
          <div key={stop.id} className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className={`${getTransportColor(stop.type)} mr-3`}>
                {getTransportIcon(stop.type)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{stop.name}</h3>
                <p className="text-gray-400 text-sm">{getTransportTypeText(stop.type)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {stop.departures?.slice(0, 2).map((departure, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-3">
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3"
                      style={{ backgroundColor: getTransportTypeColor(departure.type) }}
                    >
                      {departure.line}
                    </div>
                    <span className="text-white font-medium">{departure.destination.replace(/\s*\([^)]*\)/g, '')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono text-lg">{departure.departureTime?.substring(0, 5) || departure.departureTime}</div>
                    {departure.delay !== undefined && departure.delay !== 0 && (
                      <div className={`text-xs ${departure.delay > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {departure.delay > 0 ? '+' : ''}{departure.delay} min
                      </div>
                    )}
                  </div>
                </div>
              )) || []}
            </div>
          </div>
        ))}
      </div>

      {/* Status indicator with profile selector */}
      <div className="flex items-center justify-center mt-6">
        <div className="flex items-center space-x-4 text-gray-400 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Last updated: {new Date().toLocaleTimeString('sv-SE')}</span>
          </div>
          <ProfileSelector />
        </div>
      </div>
    </div>
  );
}
