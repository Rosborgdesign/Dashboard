import { useState, useEffect } from "react";

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeString = time.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="dashboard-overlay rounded-lg px-6 py-4">
      <div className="text-white font-light text-6xl tracking-wide">
        {timeString}
      </div>
      <div className="text-white text-lg opacity-80 mt-1">
        {dateString}
      </div>
    </div>
  );
}
