import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { submitCodeSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication
  await setupAuth(app);
  
  // Seed initial data
  if (storage.seedInitialData) {
    await storage.seedInitialData();
  }
  
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public code routes
  app.get("/api/codes", async (req, res) => {
    try {
      const codes = await storage.getApprovedCodes();
      const counts = await storage.getCategoryCounts();
      res.json({ codes, counts });
    } catch (error) {
      console.error("Error fetching codes:", error);
      res.status(500).json({ error: "Failed to fetch codes" });
    }
  });

  app.get("/api/codes/:id", async (req, res) => {
    try {
      const code = await storage.getCodeById(req.params.id);
      if (!code || code.status !== "approved") {
        return res.status(404).json({ error: "Code not found" });
      }
      
      // Get rating summary
      const ratingSummary = await storage.getRatingSummary(req.params.id);
      
      res.json({ ...code, ...ratingSummary });
    } catch (error) {
      console.error("Error fetching code:", error);
      res.status(500).json({ error: "Failed to fetch code" });
    }
  });

  app.get("/api/codes/category/:category", async (req, res) => {
    try {
      const codes = await storage.getCodesByCategory(req.params.category);
      res.json(codes);
    } catch (error) {
      console.error("Error fetching codes by category:", error);
      res.status(500).json({ error: "Failed to fetch codes" });
    }
  });

  app.post("/api/codes/submit", async (req: any, res) => {
    try {
      const validatedData = submitCodeSchema.parse(req.body);
      
      // Get user ID if authenticated
      const userId = req.user?.claims?.sub || null;
      
      const code = await storage.createCode({
        title: validatedData.title,
        code: validatedData.code,
        description: validatedData.description || null,
        category: validatedData.category,
        status: "pending",
        isVerified: false,
        submitterId: userId,
        submitterName: validatedData.submitterName || null,
        submitterEmail: validatedData.submitterEmail || null,
      });
      
      res.status(201).json(code);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid submission data", details: error.errors });
      }
      console.error("Error submitting code:", error);
      res.status(500).json({ error: "Failed to submit code" });
    }
  });

  app.post("/api/codes/:id/copy", async (req, res) => {
    try {
      await storage.incrementCopyCount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing copy count:", error);
      res.status(500).json({ error: "Failed to update copy count" });
    }
  });

  // User profile routes (protected)
  app.get("/api/user/codes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const codes = await storage.getCodesByUser(userId);
      res.json(codes);
    } catch (error) {
      console.error("Error fetching user codes:", error);
      res.status(500).json({ error: "Failed to fetch user codes" });
    }
  });

  app.get("/api/user/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const codes = await storage.getFavoriteCodesForUser(userId);
      res.json(codes);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/codes/:id/favorite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const codeId = req.params.id;
      
      const isFavorited = await storage.isFavorited(userId, codeId);
      
      if (isFavorited) {
        await storage.removeFavorite(userId, codeId);
        res.json({ favorited: false });
      } else {
        await storage.addFavorite(userId, codeId);
        res.json({ favorited: true });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  app.get("/api/codes/:id/favorited", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isFavorited = await storage.isFavorited(userId, req.params.id);
      res.json({ favorited: isFavorited });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  });

  // Rating routes (protected)
  app.post("/api/codes/:id/rate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const codeId = req.params.id;
      const { value } = req.body;
      
      if (value !== 1 && value !== -1) {
        return res.status(400).json({ error: "Value must be 1 or -1" });
      }
      
      const existingRating = await storage.getRatingByUserAndCode(userId, codeId);
      
      // If same vote, remove it (toggle off)
      if (existingRating && existingRating.value === value) {
        // We don't have a delete method, so just set to 0 (neutral)
        await storage.upsertRating(userId, codeId, 0);
        const summary = await storage.getRatingSummary(codeId);
        return res.json({ userRating: 0, ...summary });
      }
      
      await storage.upsertRating(userId, codeId, value);
      const summary = await storage.getRatingSummary(codeId);
      res.json({ userRating: value, ...summary });
    } catch (error) {
      console.error("Error rating code:", error);
      res.status(500).json({ error: "Failed to rate code" });
    }
  });

  app.get("/api/codes/:id/rating", async (req: any, res) => {
    try {
      const codeId = req.params.id;
      const userId = req.user?.claims?.sub;
      
      const summary = await storage.getRatingSummary(codeId);
      let userRating = 0;
      
      if (userId) {
        const rating = await storage.getRatingByUserAndCode(userId, codeId);
        userRating = rating?.value || 0;
      }
      
      res.json({ userRating, ...summary });
    } catch (error) {
      console.error("Error fetching rating:", error);
      res.status(500).json({ error: "Failed to fetch rating" });
    }
  });

  // Report routes (protected)
  app.post("/api/codes/:id/report", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const codeId = req.params.id;
      const { reason } = req.body;
      
      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({ error: "Please provide a detailed reason (at least 10 characters)" });
      }
      
      const report = await storage.createReport(userId, codeId, reason.trim());
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Analytics routes (public)
  app.get("/api/analytics/popular", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const codes = await storage.getPopularCodes(limit);
      res.json(codes);
    } catch (error) {
      console.error("Error fetching popular codes:", error);
      res.status(500).json({ error: "Failed to fetch popular codes" });
    }
  });

  app.get("/api/analytics/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const codes = await storage.getTrendingCodes(limit);
      res.json(codes);
    } catch (error) {
      console.error("Error fetching trending codes:", error);
      res.status(500).json({ error: "Failed to fetch trending codes" });
    }
  });

  app.get("/api/analytics/categories", async (req, res) => {
    try {
      const stats = await storage.getCategoryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ error: "Failed to fetch category stats" });
    }
  });

  // Admin routes (protected by isAdmin)
  app.get("/api/admin/codes", isAuthenticated, async (req: any, res) => {
    try {
      const codes = await storage.getAllCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching all codes:", error);
      res.status(500).json({ error: "Failed to fetch codes" });
    }
  });

  app.post("/api/admin/codes/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const code = await storage.updateCode(req.params.id, { status: "approved" });
      if (!code) {
        return res.status(404).json({ error: "Code not found" });
      }
      res.json(code);
    } catch (error) {
      console.error("Error approving code:", error);
      res.status(500).json({ error: "Failed to approve code" });
    }
  });

  app.post("/api/admin/codes/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const code = await storage.updateCode(req.params.id, { status: "rejected" });
      if (!code) {
        return res.status(404).json({ error: "Code not found" });
      }
      res.json(code);
    } catch (error) {
      console.error("Error rejecting code:", error);
      res.status(500).json({ error: "Failed to reject code" });
    }
  });

  app.post("/api/admin/codes/:id/verify", isAuthenticated, async (req: any, res) => {
    try {
      const code = await storage.updateCode(req.params.id, { isVerified: true });
      if (!code) {
        return res.status(404).json({ error: "Code not found" });
      }
      res.json(code);
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  app.delete("/api/admin/codes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteCode(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Code not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting code:", error);
      res.status(500).json({ error: "Failed to delete code" });
    }
  });

  app.get("/api/admin/reports", isAuthenticated, async (req: any, res) => {
    try {
      const reports = await storage.getAllPendingReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/admin/reports/:id/review", isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      if (!["reviewed", "dismissed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const report = await storage.updateReportStatus(req.params.id, status);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  return httpServer;
}
