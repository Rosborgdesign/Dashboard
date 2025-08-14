import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const dashboardConfig = pgTable("dashboard_config", {
  id: serial("id").primaryKey(),
  moodboardSettings: jsonb("moodboard_settings").notNull().default({
    displayTime: 40,
    transitionType: "fade",
    googleDriveFolderId: ""
  }),
  transportStops: jsonb("transport_stops").notNull().default([
    { id: "9001", name: "Nacka Strand", type: "boat", active: true },
    { id: "9002", name: "Jarlaberg", type: "bus", active: true }
  ]),
  calendarSettings: jsonb("calendar_settings").notNull().default({
    refreshInterval: 20,
    calendars: [
      { id: "1", name: "Work", color: "#F44336", enabled: true, googleCalendarId: "" },
      { id: "2", name: "Personal", color: "#9C27B0", enabled: true, googleCalendarId: "" },
      { id: "3", name: "Social", color: "#FF9800", enabled: true, googleCalendarId: "" }
    ]
  }),
  lastUpdated: timestamp("last_updated").defaultNow()
});

export const imageFrequency = pgTable("image_frequency", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  frequency: text("frequency").notNull().default("unlimited"), // unlimited, daily, weekly, monthly, yearly
  lastShown: timestamp("last_shown"),
  showCount: integer("show_count").default(0),
  periodCount: integer("period_count").default(0)
});

export const transportProfiles = pgTable("transport_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Hemma", "Jobbet", "Träning", "Auto"
  icon: text("icon").notNull().default("🔄"), // Emoji or icon name
  color: text("color").notNull().default("#6B7280"), // Hex color for status indicator
  isActive: boolean("is_active").default(false),
  
  // Time-based rules
  startTime: text("start_time"), // "06:00"
  endTime: text("end_time"), // "09:00"
  weekdays: jsonb("weekdays").default([1,2,3,4,5]), // 1=Monday, 7=Sunday
  
  // Location-based rules
  locationName: text("location_name"), // "Hemma", "Jobbet"
  latitude: text("latitude"), // GPS coordinates
  longitude: text("longitude"),
  radius: integer("radius").default(200), // meters
  
  // Transport stops for this profile
  transportStops: jsonb("transport_stops").notNull().default([]),
  
  // Priority for automatic selection
  priority: integer("priority").default(0), // Higher = more important
  
  createdAt: timestamp("created_at").defaultNow()
});

export const userLocation = pgTable("user_location", {
  id: serial("id").primaryKey(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  accuracy: integer("accuracy"), // GPS accuracy in meters
  timestamp: timestamp("timestamp").defaultNow(),
  detectedProfile: text("detected_profile"), // Which profile was detected
  manualOverride: text("manual_override"), // Manual profile selection
  overrideUntil: timestamp("override_until") // When override expires
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDashboardConfigSchema = createInsertSchema(dashboardConfig).omit({
  id: true,
  lastUpdated: true
});

export const insertImageFrequencySchema = createInsertSchema(imageFrequency).omit({
  id: true
});

export const insertTransportProfileSchema = createInsertSchema(transportProfiles).omit({
  id: true,
  createdAt: true
});

export const insertUserLocationSchema = createInsertSchema(userLocation).omit({
  id: true,
  timestamp: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DashboardConfig = typeof dashboardConfig.$inferSelect;
export type InsertDashboardConfig = z.infer<typeof insertDashboardConfigSchema>;
export type ImageFrequency = typeof imageFrequency.$inferSelect;
export type InsertImageFrequency = z.infer<typeof insertImageFrequencySchema>;
export type TransportProfile = typeof transportProfiles.$inferSelect;
export type InsertTransportProfile = z.infer<typeof insertTransportProfileSchema>;
export type UserLocation = typeof userLocation.$inferSelect;
export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;

// API response types
export interface MoodboardImage {
  id: string;
  url: string;
  name: string;
  frequency: string;
  lastShown?: string;
}

export interface TransportDeparture {
  line: string;
  destination: string;
  departureTime: string;
  realTime?: string;
  delay?: number;
  type: "bus" | "boat" | "metro" | "train" | "tram";
  track?: string;
}

export interface TransportStop {
  id: string;
  name: string;
  type: "bus" | "boat" | "metro" | "train" | "tram";
  active: boolean;
  departures?: TransportDeparture[];
}

export interface CalendarConfig {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  googleCalendarId?: string;
  icalData?: string;
  icalUrl?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  color: string;
  calendarName: string;
}

export interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

// Profile detection result
export interface ProfileDetectionResult {
  profileId: string;
  profileName: string;
  reason: "time" | "location" | "manual" | "default";
  confidence: number; // 0-100
  icon: string;
  color: string;
}
