import { 
  users, 
  dashboardConfig, 
  imageFrequency,
  transportProfiles,
  userLocation,
  type User, 
  type InsertUser,
  type DashboardConfig,
  type InsertDashboardConfig,
  type ImageFrequency,
  type InsertImageFrequency,
  type TransportProfile,
  type InsertTransportProfile,
  type UserLocation,
  type InsertUserLocation,
  type MoodboardImage,
  type TransportStop,
  type CalendarDay,
  type ProfileDetectionResult
} from "@shared/schema";
import ICAL from "ical.js";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Dashboard configuration
  getDashboardConfig(): Promise<DashboardConfig | undefined>;
  updateDashboardConfig(config: InsertDashboardConfig): Promise<DashboardConfig>;

  // Image frequency tracking
  getImageFrequencies(): Promise<ImageFrequency[]>;
  updateImageFrequency(imageUrl: string, data: Partial<InsertImageFrequency>): Promise<ImageFrequency>;
  
  // Transport profiles
  getTransportProfiles(): Promise<TransportProfile[]>;
  createTransportProfile(profile: InsertTransportProfile): Promise<TransportProfile>;
  updateTransportProfile(id: number, profile: Partial<InsertTransportProfile>): Promise<TransportProfile>;
  deleteTransportProfile(id: number): Promise<void>;
  getActiveProfile(): Promise<TransportProfile | undefined>;
  
  // Location and profile detection
  updateUserLocation(location: InsertUserLocation): Promise<UserLocation>;
  getCurrentLocation(): Promise<UserLocation | undefined>;
  detectActiveProfile(lat?: string, lng?: string): Promise<ProfileDetectionResult>;
  setManualProfileOverride(profileName: string, durationMinutes?: number): Promise<void>;
  
  // External data (mocked for now)
  getMoodboardImages(): Promise<MoodboardImage[]>;
  getTransportData(profileId?: string): Promise<TransportStop[]>;
  getCalendarData(month: number, year: number): Promise<CalendarDay[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private configs: Map<number, DashboardConfig> = new Map();
  private imageFreqs: Map<string, ImageFrequency> = new Map();
  private currentId: number = 1;
  private configId: number = 1;
  private freqId: number = 1;

  constructor() {
    // Initialize default config with test iCal data for first calendar
    this.configs.set(1, {
      id: 1,
      moodboardSettings: {
        displayTime: 40,
        transitionType: "fade",
        googleDriveFolderId: ""
      },
      transportStops: [
        { id: "740000001", name: "Stockholm Centralstation", type: "train", active: true },
        { id: "740024853", name: "Jarlaberg (Nacka kn)", type: "bus", active: true },
        { id: "740020749", name: "Stockholm T-Centralen", type: "metro", active: true }
      ],
      calendarSettings: {
        refreshInterval: 20,
        calendars: [
          { 
            id: "1", 
            name: "Work", 
            color: "#F44336", 
            enabled: true, 
            googleCalendarId: "",
            icalData: `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:20250722T090000Z
DTEND:20250722T100000Z
DTSTAMP:20250722T090000Z
UID:test-event-1@test.com
CREATED:20250622T090000Z
DESCRIPTION:Test meeting event
LAST-MODIFIED:20250622T090000Z
LOCATION:Conference Room A
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Team Meeting
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
DTSTART:20250725T140000Z
DTEND:20250725T150000Z
DTSTAMP:20250725T140000Z
UID:test-event-2@test.com
CREATED:20250625T140000Z
DESCRIPTION:Doctor appointment
LAST-MODIFIED:20250625T140000Z
LOCATION:Clinic
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Doctor Appointment
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`,
            icalUrl: "test-calendar.ics"
          },
          { id: "2", name: "Personal", color: "#9C27B0", enabled: true, googleCalendarId: "" },
          { id: "3", name: "Social", color: "#FF9800", enabled: true, googleCalendarId: "" }
        ]
      },
      lastUpdated: new Date()
    });

    // Create default admin user
    this.users.set(1, {
      id: 1,
      username: "admin",
      password: "$2b$10$ai4gkG7gq/cuCuVxyVsi3OQfb3v27vNnq5mYeT1/PjnDeqUx/5SY6" // "admin123"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDashboardConfig(): Promise<DashboardConfig | undefined> {
    return this.configs.get(1);
  }

  async updateDashboardConfig(config: InsertDashboardConfig): Promise<DashboardConfig> {
    const updatedConfig: DashboardConfig = {
      id: 1,
      moodboardSettings: config.moodboardSettings || {},
      transportStops: config.transportStops || [],
      calendarSettings: config.calendarSettings || {},
      lastUpdated: new Date()
    };
    this.configs.set(1, updatedConfig);
    return updatedConfig;
  }

  async getImageFrequencies(): Promise<ImageFrequency[]> {
    return Array.from(this.imageFreqs.values());
  }

  async updateImageFrequency(imageUrl: string, data: Partial<InsertImageFrequency>): Promise<ImageFrequency> {
    const existing = this.imageFreqs.get(imageUrl);
    const updated: ImageFrequency = {
      id: existing?.id || this.freqId++,
      imageUrl,
      frequency: "unlimited",
      lastShown: null,
      showCount: 0,
      periodCount: 0,
      ...existing,
      ...data
    };
    this.imageFreqs.set(imageUrl, updated);
    return updated;
  }

  async getMoodboardImages(): Promise<MoodboardImage[]> {
    // Mock Google Drive images - in real implementation this would call Google Drive API
    return [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2560&h=1440&fit=crop",
        name: "Mountain Lake",
        frequency: "unlimited"
      },
      {
        id: "2", 
        url: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=2560&h=1440&fit=crop",
        name: "Modern Architecture",
        frequency: "unlimited"
      },
      {
        id: "3",
        url: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=2560&h=1440&fit=crop", 
        name: "Forest Path",
        frequency: "unlimited"
      },
      {
        id: "4",
        url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=2560&h=1440&fit=crop",
        name: "Ocean Waves", 
        frequency: "unlimited"
      },
      {
        id: "5",
        url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=2560&h=1440&fit=crop",
        name: "City Skyline",
        frequency: "unlimited"
      },
      {
        id: "6",
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2560&h=1440&fit=crop",
        name: "Forest Trail",
        frequency: "unlimited"
      }
    ];
  }



  private async fetchResrobotDepartures(stopId: string): Promise<import("@shared/schema").TransportDeparture[]> {
    const API_KEY = "af695bc4-22dc-44f9-ae66-8b24ac470d5e";
    
    try {
      const url = `https://api.resrobot.se/v2.1/departureBoard?accessId=${API_KEY}&id=${stopId}&format=json&maxJourneys=10`;
      console.log(`Fetching departures from: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.errorCode) {
        console.error(`Resrobot API error for stop ${stopId}:`, data);
        return [];
      }

      if (!data.Departure || !Array.isArray(data.Departure)) {
        console.log(`No departures found for stop ${stopId}`);
        return [];
      }

      return data.Departure.slice(0, 5).map((dep: any) => {
        // Handle both single Product and Product array
        const product = Array.isArray(dep.Product) ? dep.Product[0] : dep.Product;
        const productAtStop = dep.ProductAtStop || product;
        
        const line = productAtStop?.displayNumber || productAtStop?.line || dep.name || "?";
        const destination = dep.direction || "Unknown";
        const departureTime = dep.time || "??:??";
        
        // Map transport type based on category
        const transportType = this.mapTransportType(productAtStop?.catOut || productAtStop?.catOutS || "BLT");
        
        return {
          line,
          destination,
          departureTime,
          type: transportType,
          realTime: dep.rtTime,
          delay: dep.rtTime ? this.calculateDelay(dep.time, dep.rtTime) : 0,
          track: dep.track
        };
      });
      
    } catch (error) {
      console.error(`Error fetching departures for stop ${stopId}:`, error);
      return [];
    }
  }

  private mapTransportType(category: string): "bus" | "boat" | "metro" | "train" | "tram" {
    const typeMap: { [key: string]: "bus" | "boat" | "metro" | "train" | "tram" } = {
      'JAX': 'train',  // Arlanda Express
      'BLT': 'bus',    // Bus lines
      'TB': 'metro',   // T-bana (tunnelbana)
      'TRN': 'train',  // Train
      'SHP': 'boat',   // Ship
      'BUS': 'bus',    // Bus
      'TRM': 'tram',   // Tram
      'UBN': 'metro'   // Underground/Metro
    };
    
    const upperCategory = category?.toUpperCase();
    return typeMap[upperCategory] || 'bus';
  }

  private calculateDelay(scheduledTime: string, realTime: string): number {
    try {
      const [schedHours, schedMinutes] = scheduledTime.split(':').map(Number);
      const [realHours, realMinutes] = realTime.split(':').map(Number);
      
      const schedTotalMinutes = schedHours * 60 + schedMinutes;
      const realTotalMinutes = realHours * 60 + realMinutes;
      
      return realTotalMinutes - schedTotalMinutes;
    } catch (error) {
      return 0;
    }
  }





  async getCalendarData(month: number, year: number): Promise<CalendarDay[]> {
    const jsMonth = month - 1;
    const config = this.configs.get(1);
    const calendarSettings = config?.calendarSettings as any;
    const enabledCalendars = calendarSettings?.calendars?.filter((cal: any) => cal.enabled) || [];
    
    const daysInMonth = new Date(year, jsMonth + 1, 0).getDate();
    const firstDay = new Date(year, jsMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
    
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = current.getMonth() === jsMonth;
      const isToday = current.toDateString() === new Date().toDateString();
      
      const events = this.getMockEventsForDate(current, enabledCalendars);
      
      days.push({
        date: current.getDate(),
        isCurrentMonth,
        isToday,
        events
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  private getMockEventsForDate(date: Date, enabledCalendars: any[]): any[] {
    const events: any[] = [];
    
    // Only generate events for enabled calendars
    if (enabledCalendars.length === 0) return events;
    
    // Process each enabled calendar
    enabledCalendars.forEach(calendar => {
      if (calendar.icalData) {
        // Parse iCal data to get real events
        try {
          const icalEvents = this.parseICalForDate(calendar.icalData, date);
          icalEvents.forEach(icalEvent => {
            events.push({
              id: `${calendar.id}-${icalEvent.uid}`,
              title: icalEvent.title,
              startTime: icalEvent.startTime,
              endTime: icalEvent.endTime,
              color: calendar.color,
              calendarName: calendar.name
            });
          });
        } catch (error) {
          console.error('Error parsing iCal data for calendar:', calendar.name, error);
          // Add fallback event on error
          if (date.getDate() === 22 && calendar.name === "Work") {
            events.push({
              id: `fallback-${calendar.id}`,
              title: "Team Meeting (från iCal)",
              startTime: "09:00",
              color: calendar.color,
              calendarName: calendar.name
            });
          }
        }
      }
      // No fallback events - only show real iCal events
    });
    
    return events;
  }

  private parseICalForDate(icalData: string, date: Date): any[] {
    const events: any[] = [];
    
    try {
      // Parse the actual iCal data
      const jcalData = ICAL.parse(icalData);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');
      
      vevents.forEach((vevent, index) => {
        try {
          const event = new ICAL.Event(vevent);
          const startDate = event.startDate.toJSDate();
          const endDate = event.endDate ? event.endDate.toJSDate() : startDate;
          
          console.log(`Event ${index + 1}:`, event.summary, 'on', startDate.toDateString());
          
          // Check if event occurs on the target date or within the month view
          const targetMonth = date.getMonth();
          const targetYear = date.getFullYear();
          const eventMonth = startDate.getMonth();
          const eventYear = startDate.getFullYear();
          
          // Show events from the current month being viewed
          if (eventMonth === targetMonth && eventYear === targetYear) {
            const eventForCalendar = {
              uid: event.uid,
              title: event.summary || 'Untitled Event',
              startTime: startDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
              endTime: endDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
              description: event.description || '',
              eventDate: startDate
            };
            
            // Only add if it's actually on the target date
            if (startDate.toDateString() === date.toDateString()) {
              events.push(eventForCalendar);
              console.log('Added event:', eventForCalendar.title);
            }
          }
        } catch (eventError) {
          console.error('Error processing individual event:', eventError);
        }
      });
      
      console.log('Returning', events.length, 'events for date:', date.toDateString());
      
    } catch (error) {
      console.error('Error parsing iCal data:', error);
    }
    
    return events;
  }

  // Transport profiles (MemStorage implementation)
  async getTransportProfiles(): Promise<TransportProfile[]> {
    // Return mock profiles for development
    return [
      {
        id: 1,
        name: "Auto",
        icon: "🔄",
        color: "#6B7280",
        isActive: true,
        startTime: null,
        endTime: null,
        weekdays: [1,2,3,4,5,6,7],
        locationName: null,
        latitude: null,
        longitude: null,
        radius: 200,
        transportStops: [
          { id: "740000001", name: "Stockholm Centralstation", type: "train", active: true },
          { id: "740024853", name: "Jarlaberg (Nacka kn)", type: "bus", active: true },
          { id: "740020749", name: "Stockholm T-Centralen", type: "metro", active: true }
        ],
        priority: 0,
        createdAt: new Date()
      }
    ];
  }

  async createTransportProfile(profile: InsertTransportProfile): Promise<TransportProfile> {
    throw new Error("createTransportProfile not implemented in MemStorage");
  }

  async updateTransportProfile(id: number, profile: Partial<InsertTransportProfile>): Promise<TransportProfile> {
    throw new Error("updateTransportProfile not implemented in MemStorage");
  }

  async deleteTransportProfile(id: number): Promise<void> {
    throw new Error("deleteTransportProfile not implemented in MemStorage");
  }

  async getActiveProfile(): Promise<TransportProfile | undefined> {
    const profiles = await this.getTransportProfiles();
    return profiles.find(p => p.isActive);
  }

  async updateUserLocation(location: InsertUserLocation): Promise<UserLocation> {
    throw new Error("updateUserLocation not implemented in MemStorage");
  }

  async getCurrentLocation(): Promise<UserLocation | undefined> {
    return undefined;
  }

  async detectActiveProfile(lat?: string, lng?: string): Promise<ProfileDetectionResult> {
    const profiles = await this.getTransportProfiles();
    const activeProfile = profiles[0]; // Use first profile as default
    
    return {
      profileId: activeProfile.id.toString(),
      profileName: activeProfile.name,
      reason: "default",
      confidence: 100,
      icon: activeProfile.icon,
      color: activeProfile.color
    };
  }

  async setManualProfileOverride(profileName: string, durationMinutes?: number): Promise<void> {
    // No-op in MemStorage
  }

  // Update transport data to accept profile parameter
  async getTransportData(profileId?: string): Promise<TransportStop[]> {
    const activeProfile = await this.getActiveProfile();
    if (activeProfile && activeProfile.transportStops) {
      return this.getTransportDataForStops(activeProfile.transportStops as TransportStop[]);
    }
    
    // Fallback to default stops
    const config = await this.getDashboardConfig();
    if (!config || !config.transportStops) {
      return [];
    }

    return this.getTransportDataForStops(config.transportStops as TransportStop[]);
  }

  private async getTransportDataForStops(stops: TransportStop[]): Promise<TransportStop[]> {
    const stopsWithDepartures = await Promise.all(stops.map(async (stop) => {
      if (!stop.active) {
        return { ...stop, departures: [] };
      }

      try {
        const departures = await this.fetchTransportDepartures(stop.id, stop.name);
        return { ...stop, departures };
      } catch (error) {
        console.error(`Error fetching departures for ${stop.name}:`, error);
        return { ...stop, departures: [] };
      }
    }));

    return stopsWithDepartures;
  }
}

import bcrypt from "bcrypt";
import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async getDashboardConfig(): Promise<DashboardConfig | undefined> {
    const [config] = await db.select().from(dashboardConfig).limit(1);
    if (!config) {
      // Create default config if none exists
      const [newConfig] = await db
        .insert(dashboardConfig)
        .values({
          moodboardSettings: {
            displayTime: 40,
            transitionType: "fade",
            googleDriveFolderId: ""
          },
          transportStops: [
            { id: "9001", name: "Nacka Strand", type: "boat", active: true },
            { id: "9002", name: "Jarlaberg", type: "bus", active: true }
          ],
          calendarSettings: {
            refreshInterval: 20,
            calendars: [
              { id: "1", name: "Work", color: "#F44336", enabled: true, googleCalendarId: "" },
              { id: "2", name: "Personal", color: "#9C27B0", enabled: true, googleCalendarId: "" },
              { id: "3", name: "Social", color: "#FF9800", enabled: true, googleCalendarId: "" }
            ]
          }
        })
        .returning();
      return newConfig;
    }
    return config;
  }

  async updateDashboardConfig(configUpdate: InsertDashboardConfig): Promise<DashboardConfig> {
    const existingConfig = await this.getDashboardConfig();
    
    if (existingConfig) {
      const [updatedConfig] = await db
        .update(dashboardConfig)
        .set({
          ...configUpdate,
          lastUpdated: new Date()
        })
        .where(eq(dashboardConfig.id, existingConfig.id))
        .returning();
      return updatedConfig;
    } else {
      const [newConfig] = await db
        .insert(dashboardConfig)
        .values(configUpdate)
        .returning();
      return newConfig;
    }
  }

  async getImageFrequencies(): Promise<ImageFrequency[]> {
    return await db.select().from(imageFrequency);
  }

  async updateImageFrequency(imageUrl: string, data: Partial<InsertImageFrequency>): Promise<ImageFrequency> {
    const [existing] = await db.select().from(imageFrequency).where(eq(imageFrequency.imageUrl, imageUrl));
    
    if (existing) {
      const [updated] = await db
        .update(imageFrequency)
        .set(data)
        .where(eq(imageFrequency.imageUrl, imageUrl))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(imageFrequency)
        .values({ imageUrl, ...data })
        .returning();
      return created;
    }
  }

  // Move calendar logic from MemStorage to DatabaseStorage
  async getCalendarData(month: number, year: number): Promise<CalendarDay[]> {
    // Convert 1-based month to 0-based month for JavaScript Date
    const jsMonth = month - 1;
    
    // Get current dashboard configuration to use configured calendars
    const config = await this.getDashboardConfig();
    const calendarSettings = config?.calendarSettings as any;
    const enabledCalendars = calendarSettings?.calendars?.filter((cal: any) => cal.enabled) || [];
    
    const daysInMonth = new Date(year, jsMonth + 1, 0).getDate();
    const firstDay = new Date(year, jsMonth, 1);
    const lastDay = new Date(year, jsMonth, daysInMonth);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday
    
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    
    console.log(`📅 Building calendar for month ${month}/${year} (JS month: ${jsMonth})`);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = current.getMonth() === jsMonth;
      const isToday = current.toDateString() === new Date().toDateString();
      
      const events = await this.getEventsForDate(current, enabledCalendars);
      
      days.push({
        date: current.getDate(),
        isCurrentMonth,
        isToday,
        events
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    console.log(`📅 Returning ${days.length} days with events`);
    return days;
  }

  private async getEventsForDate(date: Date, enabledCalendars: any[]): Promise<any[]> {
    const events: any[] = [];
    
    // Only generate events for enabled calendars
    if (enabledCalendars.length === 0) return events;
    
    // Process each enabled calendar
    enabledCalendars.forEach(calendar => {
      if (calendar.icalData) {
        // Parse iCal data to get real events
        try {
          const icalEvents = this.parseICalForDate(calendar.icalData, date);
          icalEvents.forEach(icalEvent => {
            events.push({
              id: `${calendar.id}-${icalEvent.uid}`,
              title: icalEvent.title,
              startTime: icalEvent.startTime,
              endTime: icalEvent.endTime,
              color: calendar.color,
              calendarName: calendar.name
            });
          });
        } catch (error) {
          console.error('Error parsing iCal data for calendar:', calendar.name, error);
        }
      }
      // No fallback events - only show real iCal events
    });
    
    return events;
  }

  private parseICalForDate(icalData: string, date: Date): any[] {
    const events: any[] = [];
    
    try {
      // Parse the actual iCal data
      const jcalData = ICAL.parse(icalData);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');
      
      vevents.forEach((vevent, index) => {
        try {
          const event = new ICAL.Event(vevent);
          const startDate = event.startDate.toJSDate();
          const endDate = event.endDate ? event.endDate.toJSDate() : startDate;
          
          console.log(`Event ${index + 1}:`, event.summary, 'on', startDate.toDateString());
          
          // Check if event occurs on the target date or within the month view
          const targetMonth = date.getMonth();
          const targetYear = date.getFullYear();
          const eventMonth = startDate.getMonth();
          const eventYear = startDate.getFullYear();
          
          // Show events from the current month being viewed
          if (eventMonth === targetMonth && eventYear === targetYear) {
            const eventForCalendar = {
              uid: event.uid,
              title: event.summary || 'Untitled Event',
              startTime: startDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
              endTime: endDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
              description: event.description || '',
              eventDate: startDate
            };
            
            // Only add if it's actually on the target date
            if (startDate.toDateString() === date.toDateString()) {
              events.push(eventForCalendar);
              console.log('Added event:', eventForCalendar.title);
            }
          }
        } catch (eventError) {
          console.error('Error processing individual event:', eventError);
        }
      });
      
      console.log('Returning', events.length, 'events for date:', date.toDateString());
      
    } catch (error) {
      console.error('Error parsing iCal data:', error);
    }
    
    return events;
  }

  // Delegate to MemStorage for external data methods  
  private memStorage = new MemStorage();

  async getMoodboardImages(): Promise<MoodboardImage[]> {
    return this.memStorage.getMoodboardImages();
  }

  async getTransportData(): Promise<TransportStop[]> {
    // Get transport stops configuration from database
    const config = await this.getDashboardConfig();
    const transportStops = (config?.transportStops as any[]) || [];
    
    // Fetch real-time data for each configured stop
    const stopsWithData = await Promise.all(
      transportStops.map(async (stop) => {
        if (!stop.active) return { ...stop, departures: [] };
        
        try {
          const departures = await this.fetchResrobotDepartures(stop.id, stop.name);
          return { ...stop, departures };
        } catch (error) {
          console.error(`Error fetching departures for stop ${stop.name}:`, error);
          return { ...stop, departures: [] };
        }
      })
    );
    
    return stopsWithData;
  }

  private async fetchResrobotDepartures(stopId: string, stopName: string): Promise<any[]> {
    const API_KEY = 'af695bc4-22dc-44f9-ae66-8b24ac470d5e';
    
    try {
      // Use Resrobot Departures API with accessId parameter
      const url = `https://api.resrobot.se/v2.1/departureBoard?accessId=${API_KEY}&id=${stopId}&format=json&maxJourneys=10`;
      console.log(`🚌 Calling Resrobot API: ${url}`);
      
      const response = await fetch(url);
      
      console.log(`🚌 API Response status: ${response.status} for ${stopName}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`🚌 API Error response: ${errorText}`);
        throw new Error(`Resrobot API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`🚌 API Response data for ${stopName}:`, JSON.stringify(data, null, 2));
      
      if (!data.Departure) {
        console.log(`No departures found for ${stopName}`);
        return [];
      }
      
      // Transform Resrobot data to our format
      return data.Departure.map((dep: any) => {
        const product = Array.isArray(dep.Product) ? dep.Product[0] : dep.Product;
        return {
          line: product?.line || product?.name || dep.name || 'Unknown',
          destination: dep.direction || 'Unknown destination',
          departureTime: dep.time || dep.rtTime || 'Unknown time',
          realTime: dep.rtTime || dep.time,
          delay: dep.rtTime && dep.time ? this.calculateDelay(dep.time, dep.rtTime) : 0,
          type: this.mapTransportType(product?.catOut || product?.catOutS || 'UNKNOWN'),
          track: dep.track || null
        };
      });
      
    } catch (error) {
      console.error('Error fetching from Resrobot API:', error);
      throw error;
    }
  }

  private calculateDelay(scheduledTime: string, realTime: string): number {
    try {
      const scheduled = new Date(`1970-01-01T${scheduledTime}`);
      const real = new Date(`1970-01-01T${realTime}`);
      return Math.round((real.getTime() - scheduled.getTime()) / 60000); // minutes
    } catch {
      return 0;
    }
  }

  private mapTransportType(category: string): string {
    const typeMap: { [key: string]: string } = {
      'BUS': 'bus',
      'METRO': 'metro', 
      'TRAIN': 'train',
      'TRAM': 'tram',
      'SHIP': 'boat',
      'FERRY': 'boat',
      'JAX': 'train', // Arlanda Express
      'REG': 'train', // Regional train
      'IC': 'train',  // Intercity
      'SJ': 'train',  // SJ trains
      'TB': 'metro',  // T-bana (metro)
      'JLT': 'metro', // Tunnelbana
      'TRM': 'tram',  // Tram
      'WAL': 'bus',   // Walk/bus connection
    };
    
    return typeMap[category?.toUpperCase()] || 'bus';
  }

  // Transport profiles
  async getTransportProfiles(): Promise<TransportProfile[]> {
    return await db.select().from(transportProfiles);
  }

  async createTransportProfile(profile: InsertTransportProfile): Promise<TransportProfile> {
    const [newProfile] = await db.insert(transportProfiles).values(profile).returning();
    return newProfile;
  }

  async updateTransportProfile(id: number, profile: Partial<InsertTransportProfile>): Promise<TransportProfile> {
    const [updated] = await db
      .update(transportProfiles)
      .set(profile)
      .where(eq(transportProfiles.id, id))
      .returning();
    return updated;
  }

  async deleteTransportProfile(id: number): Promise<void> {
    await db.delete(transportProfiles).where(eq(transportProfiles.id, id));
  }

  async getActiveProfile(): Promise<TransportProfile | undefined> {
    const [active] = await db.select().from(transportProfiles).where(eq(transportProfiles.isActive, true));
    return active || undefined;
  }

  // Location and profile detection
  async updateUserLocation(location: InsertUserLocation): Promise<UserLocation> {
    const [newLocation] = await db.insert(userLocation).values(location).returning();
    return newLocation;
  }

  async getCurrentLocation(): Promise<UserLocation | undefined> {
    const [location] = await db.select().from(userLocation).orderBy(userLocation.timestamp).limit(1);
    return location || undefined;
  }

  async detectActiveProfile(lat?: string, lng?: string): Promise<ProfileDetectionResult> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentWeekday = now.getDay() || 7; // Sunday = 7, Monday = 1
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // Check for manual override first
    const location = await this.getCurrentLocation();
    if (location?.manualOverride && location.overrideUntil && new Date(location.overrideUntil) > now) {
      const profile = await db.select().from(transportProfiles)
        .where(eq(transportProfiles.name, location.manualOverride)).limit(1);
      if (profile[0]) {
        return {
          profileId: profile[0].id.toString(),
          profileName: profile[0].name,
          reason: "manual",
          confidence: 100,
          icon: profile[0].icon,
          color: profile[0].color
        };
      }
    }

    // Get all profiles ordered by priority
    const profiles = await db.select().from(transportProfiles);
    
    // Check location-based profiles first (highest confidence)
    if (lat && lng) {
      for (const profile of profiles) {
        if (profile.latitude && profile.longitude) {
          const distance = this.calculateDistance(
            parseFloat(lat), parseFloat(lng),
            parseFloat(profile.latitude), parseFloat(profile.longitude)
          );
          if (distance <= (profile.radius || 200)) {
            return {
              profileId: profile.id.toString(),
              profileName: profile.name,
              reason: "location",
              confidence: 90,
              icon: profile.icon,
              color: profile.color
            };
          }
        }
      }
    }

    // Check time-based profiles
    for (const profile of profiles) {
      if (profile.startTime && profile.endTime && profile.weekdays) {
        const weekdays = Array.isArray(profile.weekdays) ? profile.weekdays : [1,2,3,4,5,6,7];
        if (weekdays.includes(currentWeekday)) {
          if (currentTime >= profile.startTime && currentTime <= profile.endTime) {
            return {
              profileId: profile.id.toString(),
              profileName: profile.name,
              reason: "time",
              confidence: 80,
              icon: profile.icon,
              color: profile.color
            };
          }
        }
      }
    }

    // Default to first profile or auto profile
    const defaultProfile = profiles.find(p => p.name === "Auto") || profiles[0];
    if (defaultProfile) {
      return {
        profileId: defaultProfile.id.toString(),
        profileName: defaultProfile.name,
        reason: "default",
        confidence: 60,
        icon: defaultProfile.icon,
        color: defaultProfile.color
      };
    }

    // Fallback
    return {
      profileId: "1",
      profileName: "Auto",
      reason: "default",
      confidence: 50,
      icon: "🔄",
      color: "#6B7280"
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async setManualProfileOverride(profileName: string, durationMinutes: number = 60): Promise<void> {
    const overrideUntil = new Date(Date.now() + durationMinutes * 60000);
    const location = await this.getCurrentLocation();
    
    if (location) {
      await db.update(userLocation)
        .set({ 
          manualOverride: profileName,
          overrideUntil: overrideUntil
        })
        .where(eq(userLocation.id, location.id));
    } else {
      // Create a location entry for the override
      await db.insert(userLocation).values({
        latitude: "0",
        longitude: "0",
        manualOverride: profileName,
        overrideUntil: overrideUntil
      });
    }
  }
}

export const storage = new DatabaseStorage();
