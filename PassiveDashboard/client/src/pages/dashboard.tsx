import { useQuery } from "@tanstack/react-query";
import Moodboard from "@/components/moodboard";
import Clock from "@/components/clock";
import Calendar from "@/components/calendar";
import Transport from "@/components/transport";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const {
    config,
    moodboardImages,
    calendarData,
    isLoading
  } = useDashboardData();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'a') {
        setLocation('/admin');
      }
      // Refresh shortcut (Ctrl+R or F5 override)
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
      if (e.key === 'F5') {
        e.preventDefault();
        handleRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setLocation]);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/transport"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view w-full flex flex-col bg-black text-white">
      {/* Upper Section (70% height) */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        {/* Moodboard Background */}
        <Moodboard 
          images={moodboardImages || []}
          displayTime={config?.moodboardSettings?.displayTime || 40}
          transitionType={config?.moodboardSettings?.transitionType || "fade"}
        />
        
        {/* Clock Overlay */}
        <div className="absolute top-8 left-8">
          <Clock />
        </div>
        
        {/* Calendar Overlay */}
        <div className="absolute top-8 right-8">
          <Calendar />
        </div>

        {/* Incognito Refresh Button */}
        <button
          onClick={handleRefresh}
          className="absolute bottom-4 right-4 w-3 h-3 opacity-5 hover:opacity-20 transition-opacity duration-300 text-white"
          title="Refresh data (Ctrl+R)"
        >
          <RefreshCw className="w-full h-full" />
        </button>
      </div>

      {/* Lower Section (30% height) - Transport Departures */}
      <div className="h-[30vh] bg-gray-900">
        <Transport />
      </div>
    </div>
  );
}
