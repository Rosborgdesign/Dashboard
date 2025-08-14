import { useState, useEffect } from "react";
import type { MoodboardImage } from "@shared/schema";

interface MoodboardProps {
  images: MoodboardImage[];
  displayTime: number;
  transitionType: string;
}

export default function Moodboard({ images, displayTime, transitionType }: MoodboardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, displayTime * 1000);

    return () => clearInterval(interval);
  }, [images.length, displayTime]);

  useEffect(() => {
    if (images.length > 0) {
      setIsLoading(false);
    }
  }, [images]);

  if (isLoading || images.length === 0) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading images...</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={image.url}
            alt={image.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
