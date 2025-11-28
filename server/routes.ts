import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { submitCodeSchema, submitAdvertisementSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, isAdmin, isOwner, isStaffOrOwner, isEmailVerified } from "./replitAuth";
import { sendVerificationEmail, send2FAEnabledEmail } from "./emailService";
import { setupTwoFactor, verifyTwoFactorToken, verifyBackupCode, hashBackupCodes } from "./twoFactorService";

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
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.claims?.sub) {
        return res.json({ user: null });
      }
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

  app.post("/api/codes/submit", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = submitCodeSchema.parse(req.body);
      
      // Get user ID from authenticated user
      const userId = req.user.claims.sub;
      
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

  // Advertisement routes
  app.get("/api/advertisements", async (req, res) => {
    try {
      const ads = await storage.getApprovedAdvertisements();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      res.status(500).json({ error: "Failed to fetch advertisements" });
    }
  });

  app.get("/api/advertisements/:id", async (req, res) => {
    try {
      const ad = await storage.getAdvertisementById(req.params.id);
      if (!ad || ad.status !== "approved") {
        return res.status(404).json({ error: "Advertisement not found" });
      }
      res.json(ad);
    } catch (error) {
      console.error("Error fetching advertisement:", error);
      res.status(500).json({ error: "Failed to fetch advertisement" });
    }
  });

  app.get("/api/advertisements/category/:category", async (req, res) => {
    try {
      const ads = await storage.getAdvertisementsByCategory(req.params.category);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching advertisements by category:", error);
      res.status(500).json({ error: "Failed to fetch advertisements" });
    }
  });

  app.post("/api/advertisements/submit", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = submitAdvertisementSchema.parse(req.body);
      
      const userId = req.user.claims.sub;
      
      const ad = await storage.createAdvertisement({
        title: validatedData.title,
        description: validatedData.description || null,
        category: validatedData.category,
        inviteLink: validatedData.inviteLink || null,
        imageUrl: validatedData.imageUrl || null,
        status: "pending",
        isVerified: false,
        submitterId: userId,
        submitterName: validatedData.submitterName || null,
        submitterEmail: validatedData.submitterEmail || null,
      });
      
      res.status(201).json(ad);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid submission data", details: error.errors });
      }
      console.error("Error submitting advertisement:", error);
      res.status(500).json({ error: "Failed to submit advertisement" });
    }
  });

  app.post("/api/advertisements/:id/view", async (req, res) => {
    try {
      await storage.incrementViewCount(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(500).json({ error: "Failed to update view count" });
    }
  });

  // Email/Password authentication routes
  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const user = await storage.createUserWithPassword(firstName, lastName, email, password);
      
      const verificationToken = await storage.createEmailVerificationToken(user.id, "signup");
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      await sendVerificationEmail(email, verificationToken.token, baseUrl);
      
      req.login({ id: user.id, claims: { sub: user.id } }, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after signup" });
        }
        res.json({ 
          success: true, 
          user: { id: user.id, email: user.email },
          requiresEmailVerification: true
        });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password, twoFactorCode, challengeToken } = req.body;
      
      if (challengeToken && twoFactorCode) {
        const challenge = await storage.getLoginChallenge(challengeToken);
        if (!challenge) {
          return res.status(401).json({ error: "Invalid or expired challenge" });
        }
        
        if (new Date() > challenge.expiresAt) {
          await storage.deleteLoginChallenge(challengeToken);
          return res.status(401).json({ error: "Challenge expired, please login again" });
        }
        
        const user = await storage.getUser(challenge.userId);
        if (!user || !user.twoFactorSecret) {
          return res.status(401).json({ error: "Invalid challenge" });
        }
        
        let isValidCode = verifyTwoFactorToken(user.twoFactorSecret, twoFactorCode);
        
        if (!isValidCode && user.twoFactorBackupCodes) {
          const { valid, remainingCodes } = await verifyBackupCode(user.twoFactorBackupCodes, twoFactorCode);
          if (valid) {
            isValidCode = true;
            await storage.updateUser(user.id, { twoFactorBackupCodes: remainingCodes });
          }
        }
        
        if (!isValidCode) {
          return res.status(401).json({ error: "Invalid 2FA code" });
        }
        
        await storage.deleteLoginChallenge(challengeToken);
        await storage.updateUser(user.id, { lastLoginAt: new Date() });
        
        req.login({ id: user.id, claims: { sub: user.id } }, (err: any) => {
          if (err) {
            return res.status(500).json({ error: "Login failed" });
          }
          res.json({ 
            success: true, 
            user: { id: user.id, email: user.email, emailVerified: !!user.emailVerifiedAt }
          });
        });
        return;
      }
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (user.isBanned) {
        return res.status(403).json({ error: "Account is banned", reason: user.bannedReason });
      }

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        const challenge = await storage.createLoginChallenge(user.id);
        return res.json({
          requiresTwoFactor: true,
          challengeToken: challenge.token
        });
      }

      await storage.updateUser(user.id, { lastLoginAt: new Date() });
      
      req.login({ id: user.id, claims: { sub: user.id } }, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Login failed" });
        }
        res.json({ 
          success: true, 
          user: { id: user.id, email: user.email, emailVerified: !!user.emailVerifiedAt }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Email verification routes
  app.post("/api/auth/verify-email", async (req: any, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Token required" });
      }

      const verificationToken = await storage.getEmailVerificationToken(token);
      if (!verificationToken) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      if (new Date() > verificationToken.expiresAt) {
        await storage.deleteEmailVerificationToken(token);
        return res.status(400).json({ error: "Token expired" });
      }

      await storage.updateUser(verificationToken.userId, { emailVerifiedAt: new Date() });
      await storage.deleteEmailVerificationToken(token);

      res.json({ success: true, message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/auth/resend-verification", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ error: "User not found" });
      }

      if (user.emailVerifiedAt) {
        return res.status(400).json({ error: "Email already verified" });
      }

      const verificationToken = await storage.createEmailVerificationToken(user.id, "resend");
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      await sendVerificationEmail(user.email, verificationToken.token, baseUrl);

      res.json({ success: true, message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Failed to resend verification" });
    }
  });

  // 2FA routes
  app.post("/api/auth/2fa/setup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(400).json({ error: "User not found" });
      }

      if (user.twoFactorEnabled) {
        return res.status(400).json({ error: "2FA already enabled" });
      }

      const setup = await setupTwoFactor(user.email);
      
      await storage.updateUser(userId, { 
        twoFactorSecret: setup.secret,
        twoFactorBackupCodes: hashBackupCodes(setup.backupCodes)
      });

      res.json({ 
        qrCodeUrl: setup.qrCodeUrl, 
        backupCodes: setup.backupCodes,
        secret: setup.secret
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ error: "2FA setup failed" });
    }
  });

  app.post("/api/auth/2fa/verify", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Code required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ error: "2FA not set up" });
      }

      const isValid = verifyTwoFactorToken(user.twoFactorSecret, code);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid code" });
      }

      await storage.updateUser(userId, { twoFactorEnabled: true });
      
      if (user.email) {
        await send2FAEnabledEmail(user.email);
      }

      res.json({ success: true, message: "2FA enabled successfully" });
    } catch (error) {
      console.error("2FA verify error:", error);
      res.status(500).json({ error: "2FA verification failed" });
    }
  });

  app.post("/api/auth/2fa/disable", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Code required" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ error: "2FA not enabled" });
      }

      const isValid = verifyTwoFactorToken(user.twoFactorSecret, code);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid code" });
      }

      await storage.updateUser(userId, { 
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      });

      res.json({ success: true, message: "2FA disabled successfully" });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ error: "Failed to disable 2FA" });
    }
  });

  // Owner claim route (one-time setup)
  app.post("/api/auth/claim-owner", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      
      const hasOwner = await storage.hasOwner();
      if (hasOwner) {
        return res.status(403).json({ error: "Owner already exists" });
      }

      const user = await storage.updateUserRole(userId, "owner");
      
      await storage.createAuditLog(
        userId, 
        user?.email || null, 
        "claim_owner", 
        "user", 
        userId, 
        { message: "User claimed owner role" },
        req.ip
      );

      res.json({ success: true, user });
    } catch (error) {
      console.error("Claim owner error:", error);
      res.status(500).json({ error: "Failed to claim owner role" });
    }
  });

  // Check if owner exists
  app.get("/api/auth/has-owner", async (req, res) => {
    try {
      const hasOwner = await storage.hasOwner();
      res.json({ hasOwner });
    } catch (error) {
      console.error("Check owner error:", error);
      res.status(500).json({ error: "Failed to check owner status" });
    }
  });

  app.get("/api/users/:userId/profile", async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
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
  app.get("/api/admin/codes", isAdmin, async (req: any, res) => {
    try {
      const codes = await storage.getAllCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching all codes:", error);
      res.status(500).json({ error: "Failed to fetch codes" });
    }
  });

  app.post("/api/admin/codes/:id/approve", isAdmin, async (req: any, res) => {
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

  app.post("/api/admin/codes/:id/reject", isAdmin, async (req: any, res) => {
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

  app.post("/api/admin/codes/:id/verify", isAdmin, async (req: any, res) => {
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

  app.delete("/api/admin/codes/:id", isAdmin, async (req: any, res) => {
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

  app.get("/api/admin/reports", isAdmin, async (req: any, res) => {
    try {
      const reports = await storage.getAllPendingReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.post("/api/admin/reports/:id/review", isAdmin, async (req: any, res) => {
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

  // Admin advertisement routes
  app.get("/api/admin/advertisements", isAdmin, async (req: any, res) => {
    try {
      const ads = await storage.getAllAdvertisements();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching all advertisements:", error);
      res.status(500).json({ error: "Failed to fetch advertisements" });
    }
  });

  app.post("/api/admin/advertisements/:id/approve", isAdmin, async (req: any, res) => {
    try {
      const ad = await storage.updateAdvertisement(req.params.id, { status: "approved" });
      if (!ad) {
        return res.status(404).json({ error: "Advertisement not found" });
      }
      res.json(ad);
    } catch (error) {
      console.error("Error approving advertisement:", error);
      res.status(500).json({ error: "Failed to approve advertisement" });
    }
  });

  app.post("/api/admin/advertisements/:id/reject", isAdmin, async (req: any, res) => {
    try {
      const ad = await storage.updateAdvertisement(req.params.id, { status: "rejected" });
      if (!ad) {
        return res.status(404).json({ error: "Advertisement not found" });
      }
      res.json(ad);
    } catch (error) {
      console.error("Error rejecting advertisement:", error);
      res.status(500).json({ error: "Failed to reject advertisement" });
    }
  });

  app.post("/api/admin/advertisements/:id/verify", isAdmin, async (req: any, res) => {
    try {
      const ad = await storage.updateAdvertisement(req.params.id, { isVerified: true });
      if (!ad) {
        return res.status(404).json({ error: "Advertisement not found" });
      }
      res.json(ad);
    } catch (error) {
      console.error("Error verifying advertisement:", error);
      res.status(500).json({ error: "Failed to verify advertisement" });
    }
  });

  app.delete("/api/admin/advertisements/:id", isAdmin, async (req: any, res) => {
    try {
      const success = await storage.deleteAdvertisement(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Advertisement not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ error: "Failed to delete advertisement" });
    }
  });

  // User tag management (admin only)
  app.post("/api/admin/users/:id/tags", isAdmin, async (req: any, res) => {
    try {
      const { tags } = req.body;
      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: "Tags must be an array" });
      }
      
      const user = await storage.updateUserTags(req.params.id, tags);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user tags:", error);
      res.status(500).json({ error: "Failed to update user tags" });
    }
  });

  // User advertisements endpoint
  app.get("/api/user/advertisements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const ads = await storage.getAdvertisementsByUser(userId);
      res.json(ads);
    } catch (error) {
      console.error("Error fetching user advertisements:", error);
      res.status(500).json({ error: "Failed to fetch user advertisements" });
    }
  });

  // =====================
  // OWNER DASHBOARD ROUTES
  // =====================
  
  // Get all users (owner only)
  app.get("/api/owner/users", isOwner, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const users = await storage.getAllUsers(limit, offset);
      const total = await storage.getUserCount();
      res.json({ users, total, limit, offset });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get user by ID (owner only)
  app.get("/api/owner/users/:id", isOwner, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user role (owner only)
  app.post("/api/owner/users/:id/role", isOwner, async (req: any, res) => {
    try {
      const { role } = req.body;
      const actorId = req.user.claims?.sub || req.user.id;
      
      if (!["staff", "user"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'staff' or 'user'" });
      }

      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.role === "owner") {
        return res.status(403).json({ error: "Cannot change owner's role" });
      }

      const user = await storage.updateUserRole(req.params.id, role);
      
      await storage.createAuditLog(
        actorId,
        null,
        "change_role",
        "user",
        req.params.id,
        { oldRole: targetUser.role, newRole: role },
        req.ip
      );

      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Ban user (owner only)
  app.post("/api/owner/users/:id/ban", isOwner, async (req: any, res) => {
    try {
      const { reason } = req.body;
      const actorId = req.user.claims?.sub || req.user.id;
      
      const targetUser = await storage.getUser(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.role === "owner") {
        return res.status(403).json({ error: "Cannot ban owner" });
      }

      const user = await storage.updateUser(req.params.id, { 
        isBanned: true, 
        bannedReason: reason || "No reason provided" 
      });
      
      await storage.createAuditLog(
        actorId,
        null,
        "ban_user",
        "user",
        req.params.id,
        { reason },
        req.ip
      );

      res.json(user);
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  // Unban user (owner only)
  app.post("/api/owner/users/:id/unban", isOwner, async (req: any, res) => {
    try {
      const actorId = req.user.claims?.sub || req.user.id;
      
      const user = await storage.updateUser(req.params.id, { 
        isBanned: false, 
        bannedReason: null 
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createAuditLog(
        actorId,
        null,
        "unban_user",
        "user",
        req.params.id,
        {},
        req.ip
      );

      res.json(user);
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  // Get staff members (owner only)
  app.get("/api/owner/staff", isOwner, async (req: any, res) => {
    try {
      const staff = await storage.getStaffUsers();
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ error: "Failed to fetch staff" });
    }
  });

  // Get audit logs (owner only)
  app.get("/api/owner/audit-logs", isOwner, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await storage.getAuditLogs(limit, offset);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Site settings (owner only)
  app.get("/api/owner/settings", isOwner, async (req: any, res) => {
    try {
      const settings = await storage.getAllSiteSettings();
      const settingsMap: Record<string, any> = {};
      for (const setting of settings) {
        settingsMap[setting.key] = setting.value;
      }
      res.json(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/owner/settings", isOwner, async (req: any, res) => {
    try {
      const { key, value } = req.body;
      
      if (!key) {
        return res.status(400).json({ error: "Key required" });
      }

      const setting = await storage.setSiteSetting(key, value);
      
      const actorId = req.user.claims?.sub || req.user.id;
      await storage.createAuditLog(
        actorId,
        null,
        "update_setting",
        "setting",
        key,
        { value },
        req.ip
      );

      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // =====================
  // STAFF MODERATION ROUTES
  // =====================
  
  // Staff can delete codes
  app.delete("/api/staff/codes/:id", isStaffOrOwner, async (req: any, res) => {
    try {
      const actorId = req.user.claims?.sub || req.user.id;
      
      const code = await storage.getCodeById(req.params.id);
      if (!code) {
        return res.status(404).json({ error: "Code not found" });
      }

      const success = await storage.deleteCode(req.params.id);
      
      await storage.createAuditLog(
        actorId,
        null,
        "delete_code",
        "code",
        req.params.id,
        { title: code.title },
        req.ip
      );

      res.json({ success });
    } catch (error) {
      console.error("Error deleting code:", error);
      res.status(500).json({ error: "Failed to delete code" });
    }
  });

  // Staff can delete advertisements
  app.delete("/api/staff/advertisements/:id", isStaffOrOwner, async (req: any, res) => {
    try {
      const actorId = req.user.claims?.sub || req.user.id;
      
      const ad = await storage.getAdvertisementById(req.params.id);
      if (!ad) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      const success = await storage.deleteAdvertisement(req.params.id);
      
      await storage.createAuditLog(
        actorId,
        null,
        "delete_advertisement",
        "advertisement",
        req.params.id,
        { title: ad.title },
        req.ip
      );

      res.json({ success });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ error: "Failed to delete advertisement" });
    }
  });

  // Staff can view all content for moderation
  app.get("/api/staff/codes", isStaffOrOwner, async (req: any, res) => {
    try {
      const codes = await storage.getAllCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching codes:", error);
      res.status(500).json({ error: "Failed to fetch codes" });
    }
  });

  app.get("/api/staff/advertisements", isStaffOrOwner, async (req: any, res) => {
    try {
      const ads = await storage.getAllAdvertisements();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      res.status(500).json({ error: "Failed to fetch advertisements" });
    }
  });

  // Staff can approve/reject codes
  app.post("/api/staff/codes/:id/approve", isStaffOrOwner, async (req: any, res) => {
    try {
      const actorId = req.user.claims?.sub || req.user.id;
      const code = await storage.updateCode(req.params.id, { status: "approved" });
      
      if (!code) {
        return res.status(404).json({ error: "Code not found" });
      }

      await storage.createAuditLog(
        actorId,
        null,
        "approve_code",
        "code",
        req.params.id,
        { title: code.title },
        req.ip
      );

      res.json(code);
    } catch (error) {
      console.error("Error approving code:", error);
      res.status(500).json({ error: "Failed to approve code" });
    }
  });

  app.post("/api/staff/codes/:id/reject", isStaffOrOwner, async (req: any, res) => {
    try {
      const actorId = req.user.claims?.sub || req.user.id;
      const code = await storage.updateCode(req.params.id, { status: "rejected" });
      
      if (!code) {
        return res.status(404).json({ error: "Code not found" });
      }

      await storage.createAuditLog(
        actorId,
        null,
        "reject_code",
        "code",
        req.params.id,
        { title: code.title },
        req.ip
      );

      res.json(code);
    } catch (error) {
      console.error("Error rejecting code:", error);
      res.status(500).json({ error: "Failed to reject code" });
    }
  });

  app.post("/api/staff/advertisements/:id/approve", isStaffOrOwner, async (req: any, res) => {
    try {
      const actorId = req.user.claims?.sub || req.user.id;
      const ad = await storage.updateAdvertisement(req.params.id, { status: "approved" });
      
      if (!ad) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      await storage.createAuditLog(
        actorId,
        null,
        "approve_advertisement",
        "advertisement",
        req.params.id,
        { title: ad.title },
        req.ip
      );

      res.json(ad);
    } catch (error) {
      console.error("Error approving advertisement:", error);
      res.status(500).json({ error: "Failed to approve advertisement" });
    }
  });

  app.post("/api/staff/advertisements/:id/reject", isStaffOrOwner, async (req: any, res) => {
    try {
      const actorId = req.user.claims?.sub || req.user.id;
      const ad = await storage.updateAdvertisement(req.params.id, { status: "rejected" });
      
      if (!ad) {
        return res.status(404).json({ error: "Advertisement not found" });
      }

      await storage.createAuditLog(
        actorId,
        null,
        "reject_advertisement",
        "advertisement",
        req.params.id,
        { title: ad.title },
        req.ip
      );

      res.json(ad);
    } catch (error) {
      console.error("Error rejecting advertisement:", error);
      res.status(500).json({ error: "Failed to reject advertisement" });
    }
  });

  return httpServer;
}
