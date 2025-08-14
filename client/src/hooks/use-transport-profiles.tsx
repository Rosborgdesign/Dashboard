import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileDetectionResult } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  error?: string;
}

export function useTransportProfiles() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const queryClient = useQueryClient();

  // Get current active profile
  const { data: activeProfile, isLoading } = useQuery({
    queryKey: ['/api/active-profile', location?.latitude, location?.longitude],
    queryFn: () => {
      const params = new URLSearchParams();
      if (location) {
        params.append('lat', location.latitude.toString());
        params.append('lng', location.longitude.toString());
      }
      return fetch(`/api/active-profile?${params}`).then(res => res.json());
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  }) as { data: ProfileDetectionResult | undefined, isLoading: boolean };

  // Get transport profiles list
  const { data: profiles = [] } = useQuery({
    queryKey: ['/api/transport-profiles'],
    queryFn: () => fetch('/api/transport-profiles').then(res => res.json()),
  });

  // Manual profile override mutation
  const manualProfileMutation = useMutation({
    mutationFn: (data: { profileName: string; duration?: number }) => 
      apiRequest('/api/manual-profile', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/active-profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transport'] });
    },
  });

  // Update location mutation
  const locationMutation = useMutation({
    mutationFn: (locationData: { latitude: string; longitude: string; accuracy?: number }) =>
      apiRequest('/api/location', { method: 'POST', body: JSON.stringify(locationData) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/active-profile'] });
    },
  });

  // GPS functions
  const requestGPSPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'GPS not supported' } as LocationState));
      return false;
    }

    try {
      // Check permission status
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        
        if (permission.state === 'denied') {
          setLocation(prev => ({ ...prev, error: 'GPS permission denied' } as LocationState));
          return false;
        }
      }

      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(),
            };
            setLocation(newLocation);
            setGpsEnabled(true);
            setPermissionStatus('granted');
            
            // Update server with location
            locationMutation.mutate({
              latitude: newLocation.latitude.toString(),
              longitude: newLocation.longitude.toString(),
              accuracy: newLocation.accuracy,
            });
            
            resolve(true);
          },
          (error) => {
            console.error('GPS error:', error);
            setLocation(prev => ({ ...prev, error: error.message } as LocationState));
            setPermissionStatus('denied');
            resolve(false);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 5 * 60 * 1000, // 5 minutes cache
          }
        );
      });
    } catch (error) {
      console.error('Permission error:', error);
      setLocation(prev => ({ ...prev, error: 'Permission error' } as LocationState));
      return false;
    }
  }, [locationMutation]);

  // Periodic GPS update (every 10 minutes)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gpsEnabled && permissionStatus === 'granted') {
      interval = setInterval(async () => {
        console.log('🌍 Periodic GPS update...');
        await requestGPSPermission();
      }, 10 * 60 * 1000); // 10 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gpsEnabled, permissionStatus, requestGPSPermission]);

  // Auto-start GPS on mount
  useEffect(() => {
    const initGPS = async () => {
      // Only try once on mount if permission is not yet determined
      if (permissionStatus === 'prompt') {
        await requestGPSPermission();
      }
    };
    
    initGPS();
  }, []); // Only run once on mount

  const setManualProfile = useCallback(async (profileName: string, durationMinutes: number = 60) => {
    await manualProfileMutation.mutateAsync({ profileName, duration: durationMinutes });
  }, [manualProfileMutation]);

  const enableGPS = useCallback(async () => {
    const success = await requestGPSPermission();
    if (success) {
      setGpsEnabled(true);
    }
    return success;
  }, [requestGPSPermission]);

  const disableGPS = useCallback(() => {
    setGpsEnabled(false);
    setLocation(null);
  }, []);

  return {
    // Current state
    activeProfile,
    profiles,
    location,
    gpsEnabled,
    permissionStatus,
    isLoading,
    
    // Actions
    setManualProfile,
    enableGPS,
    disableGPS,
    
    // Status
    hasLocation: !!location && !location.error,
    locationError: location?.error,
  };
}