import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertDashboardConfigSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error("Auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Dashboard configuration
  app.get("/api/config", async (req, res) => {
    try {
      const config = await storage.getDashboardConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  app.put("/api/config", async (req, res) => {
    try {
      console.log('Received config update:', JSON.stringify(req.body?.calendarSettings?.calendars?.map((c: any) => ({
        name: c.name,
        hasIcalData: !!c.icalData,
        icalDataLength: c.icalData?.length || 0
      })), null, 2));
      
      const validatedData = insertDashboardConfigSchema.parse(req.body);
      const updatedConfig = await storage.updateDashboardConfig(validatedData);
      res.json(updatedConfig);
    } catch (error) {
      console.error('Config update error:', error);
      res.status(400).json({ message: "Invalid configuration data" });
    }
  });

  // Moodboard images
  app.get("/api/moodboard/images", async (req, res) => {
    try {
      const images = await storage.getMoodboardImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moodboard images" });
    }
  });

  app.post("/api/moodboard/images/:imageUrl/view", async (req, res) => {
    try {
      const { imageUrl } = req.params;
      const decodedUrl = decodeURIComponent(imageUrl);
      
      const frequency = await storage.updateImageFrequency(decodedUrl, {
        lastShown: new Date(),
        showCount: 1,
        periodCount: 1
      });
      
      res.json(frequency);
    } catch (error) {
      res.status(500).json({ message: "Failed to update image frequency" });
    }
  });

  // Transport data
  app.get("/api/transport", async (req, res) => {
    try {
      const { profileId } = req.query;
      const transportData = await storage.getTransportData(profileId as string | undefined);
      res.json(transportData);
    } catch (error) {
      console.error("Transport data error:", error);
      res.status(500).json({ message: "Failed to fetch transport data" });
    }
  });

  // Calendar data
  app.get("/api/calendar", async (req, res) => {
    try {
      const { month, year } = req.query;
      const monthNum = month ? parseInt(month as string) : new Date().getMonth();
      const yearNum = year ? parseInt(year as string) : new Date().getFullYear();
      
      console.log(`🚀 Calendar API called: month=${monthNum}, year=${yearNum}`);
      const calendarData = await storage.getCalendarData(monthNum, yearNum);
      console.log(`📅 Returning ${calendarData.length} days with events`);
      res.json(calendarData);
    } catch (error) {
      console.error('❌ Calendar error:', error);
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });

  // Transport profiles routes
  app.get("/api/transport-profiles", async (req, res) => {
    try {
      const profiles = await storage.getTransportProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching transport profiles:", error);
      res.status(500).json({ message: "Failed to fetch transport profiles" });
    }
  });

  app.post("/api/transport-profiles", async (req, res) => {
    try {
      const profile = await storage.createTransportProfile(req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error creating transport profile:", error);
      res.status(500).json({ message: "Failed to create transport profile" });
    }
  });

  // Profile detection and GPS routes
  app.post("/api/location", async (req, res) => {
    try {
      const location = await storage.updateUserLocation(req.body);
      res.json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.get("/api/active-profile", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      const profile = await storage.detectActiveProfile(
        lat as string | undefined, 
        lng as string | undefined
      );
      res.json(profile);
    } catch (error) {
      console.error("Error detecting active profile:", error);
      res.status(500).json({ message: "Failed to detect active profile" });
    }
  });

  app.post("/api/manual-profile", async (req, res) => {
    try {
      const { profileName, duration } = req.body;
      await storage.setManualProfileOverride(profileName, duration);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting manual profile override:", error);
      res.status(500).json({ message: "Failed to set manual profile override" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
