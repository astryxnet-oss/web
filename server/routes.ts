import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { submitCodeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
      res.json(code);
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

  app.post("/api/codes/submit", async (req, res) => {
    try {
      const validatedData = submitCodeSchema.parse(req.body);
      
      const code = await storage.createCode({
        title: validatedData.title,
        code: validatedData.code,
        description: validatedData.description || null,
        category: validatedData.category,
        status: "pending",
        isVerified: false,
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

  app.get("/api/admin/codes", async (req, res) => {
    try {
      const codes = await storage.getAllCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching all codes:", error);
      res.status(500).json({ error: "Failed to fetch codes" });
    }
  });

  app.post("/api/admin/codes/:id/approve", async (req, res) => {
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

  app.post("/api/admin/codes/:id/reject", async (req, res) => {
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

  app.post("/api/admin/codes/:id/verify", async (req, res) => {
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

  app.delete("/api/admin/codes/:id", async (req, res) => {
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

  return httpServer;
}
