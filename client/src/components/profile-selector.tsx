import { useState } from 'react';
import { useTransportProfiles } from '@/hooks/use-transport-profiles';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, Settings } from 'lucide-react';

interface ProfileSelectorProps {
  compact?: boolean;
}

export default function ProfileSelector({ compact = true }: ProfileSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    activeProfile, 
    profiles, 
    setManualProfile, 
    hasLocation, 
    locationError,
    enableGPS,
    gpsEnabled,
    permissionStatus 
  } = useTransportProfiles();

  if (!activeProfile) return null;

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'location': return <MapPin className="w-3 h-3" />;
      case 'time': return <Clock className="w-3 h-3" />;
      case 'manual': return <User className="w-3 h-3" />;
      default: return <Settings className="w-3 h-3" />;
    }
  };

  const getReasonText = (reason: string, confidence: number) => {
    switch (reason) {
      case 'location': return `Plats (${confidence}%)`;
      case 'time': return `Tid (${confidence}%)`;
      case 'manual': return 'Manuell';
      default: return 'Standard';
    }
  };

  if (compact) {
    return (
      <>
        {/* Diskret status-indikator */}
        <div 
          className="flex items-center space-x-2 text-gray-400 text-xs cursor-pointer hover:text-gray-300 transition-colors"
          onClick={() => setIsOpen(true)}
          data-testid="profile-status-indicator"
        >
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: activeProfile.color }}
          />
          <span>{activeProfile.icon} {activeProfile.profileName}</span>
          {hasLocation && (
            <MapPin className="w-3 h-3 text-green-500" />
          )}
        </div>

        {/* Modal för profilval */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span style={{ color: activeProfile.color }}>{activeProfile.icon}</span>
                <span>Transport Profil</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Nuvarande profil */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{activeProfile.profileName}</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                    {getReasonIcon(activeProfile.reason)}
                    <span>{getReasonText(activeProfile.reason, activeProfile.confidence)}</span>
                  </div>
                </div>
                
                {!hasLocation && permissionStatus !== 'denied' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={enableGPS}
                    className="w-full mt-2"
                    data-testid="enable-gps-button"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Aktivera GPS för automatisk växling
                  </Button>
                )}

                {locationError && (
                  <p className="text-sm text-red-600 mt-2">
                    GPS: {locationError}
                  </p>
                )}
              </div>

              {/* Manuell profilväxling */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Växla manuellt:
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {profiles.map((profile: any) => (
                    <Button
                      key={profile.id}
                      variant={profile.name === activeProfile.profileName ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setManualProfile(profile.name, 120); // 2 timmar override
                        setIsOpen(false);
                      }}
                      className="flex items-center space-x-2"
                      data-testid={`profile-button-${profile.name.toLowerCase()}`}
                    >
                      <span>{profile.icon}</span>
                      <span>{profile.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* GPS status */}
              {hasLocation && (
                <div className="text-xs text-gray-500 flex items-center space-x-2">
                  <MapPin className="w-3 h-3 text-green-500" />
                  <span>GPS aktiv - uppdaterar var 10:e minut</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Full profil-selektor för admin-panel
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Transport Profiler</h3>
      
      <div className="space-y-2">
        {profiles.map((profile: any) => (
          <div
            key={profile.id}
            className={`p-3 rounded-lg border ${
              profile.name === activeProfile?.profileName
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: profile.color }}
                />
                <span>{profile.icon}</span>
                <span className="font-medium">{profile.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManualProfile(profile.name, 120)}
                data-testid={`admin-profile-${profile.name.toLowerCase()}`}
              >
                Aktivera
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}