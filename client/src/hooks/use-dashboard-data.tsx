import { useQuery } from "@tanstack/react-query";
import type { DashboardConfig, MoodboardImage, TransportStop, CalendarDay } from "@shared/schema";

export function useDashboardData() {
  const { data: config, isLoading: configLoading } = useQuery<DashboardConfig>({
    queryKey: ["/api/config"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: moodboardImages, isLoading: imagesLoading } = useQuery<MoodboardImage[]>({
    queryKey: ["/api/moodboard/images"],
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  const { data: transportData, isLoading: transportLoading } = useQuery<TransportStop[]>({
    queryKey: ["/api/transport"],
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes (120s)
  });

  const currentDate = new Date();
  const { data: calendarData, isLoading: calendarLoading } = useQuery<CalendarDay[]>({
    queryKey: ["/api/calendar", currentDate.getMonth(), currentDate.getFullYear()],
    refetchInterval: 20 * 60 * 1000, // Refetch every 20 minutes
  });

  return {
    config,
    moodboardImages,
    transportData,
    calendarData,
    isLoading: configLoading || imagesLoading || transportLoading || calendarLoading,
  };
}
