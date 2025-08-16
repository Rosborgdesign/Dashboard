import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarDay } from "@shared/schema";

interface CalendarProps {
  days?: CalendarDay[];
}

export default function Calendar({ days: propsDays }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const queryClient = useQueryClient();

  // Fetch calendar data for the current month
  const { data: calendarDays, isLoading } = useQuery<CalendarDay[]>({
    queryKey: ["/api/calendar", currentMonth.getMonth() + 1, currentMonth.getFullYear()],
    queryFn: () => fetch(`/api/calendar?month=${currentMonth.getMonth() + 1}&year=${currentMonth.getFullYear()}`).then(res => res.json()),
    refetchInterval: 5 * 60 * 1000, // 5 minutes for more frequent updates
  });

  const days = calendarDays || propsDays || [];

  if (isLoading) {
    return (
      <div className="dashboard-overlay rounded-lg p-3 w-[400px] flex items-center justify-center">
        <div className="text-white opacity-80">Loading calendar...</div>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const forceRefresh = async () => {
    // Clear server-side cache and client cache
    try {
      await fetch('/api/cache', { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
    } catch (error) {
      console.log('Cache clear failed, doing client refresh only');
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
    }
  };

  const getEventColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      '#F44336': 'text-red-300',
      '#9C27B0': 'text-purple-300', 
      '#FF9800': 'text-orange-300',
      '#795548': 'text-yellow-300',
    };
    return colorMap[color] || 'text-white opacity-80';
  };

  return (
    <div className="dashboard-overlay rounded-lg p-3 w-[400px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white font-semibold text-base">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <div className="flex space-x-1">
          <button
            onClick={() => navigateMonth('prev')}
            className="text-white opacity-80 hover:opacity-100 p-1"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="text-white opacity-80 hover:opacity-100 p-1"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-white opacity-70 mb-2">
        {dayNames.map(day => (
          <div key={day} className="font-semibold p-1">{day}</div>
        ))}
      </div>

      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, weekIndex) => {
          const weekDays = days.slice(weekIndex * 7, (weekIndex + 1) * 7);
          const hasCurrentMonthDays = weekDays.some(day => day.isCurrentMonth);
          
          if (!hasCurrentMonthDays) return null;
          
          return (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {weekDays.map((day, dayIndex) => {
                if (!day.isCurrentMonth) {
                  return <div key={dayIndex} className="h-12"></div>;
                }
                
                return (
                  <div
                    key={dayIndex}
                    className={`h-12 p-1 text-xs border border-white border-opacity-10 rounded-sm text-white bg-white bg-opacity-5 ${
                      day.isToday ? 'bg-blue-500 bg-opacity-30 border-blue-400 border-opacity-60' : ''
                    } ${
                      day.events.length > 0 ? 'bg-white bg-opacity-10' : ''
                    }`}
                  >
                    <div className={`mb-1 ${day.isToday ? "font-bold text-blue-200" : day.events.length > 0 ? "font-semibold" : ""}`}>
                      {day.date}
                    </div>
                    <div className="space-y-0.5">
                      {day.events.slice(0, 1).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 rounded-sm truncate bg-white bg-opacity-20 ${getEventColor(event.color)}`}
                          title={`${event.title} - ${event.startTime}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 1 && (
                        <div className="text-xs text-white opacity-60 px-1">
                          +{day.events.length - 1}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
}
