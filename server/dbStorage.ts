import { type User, type UpsertUser, type Code, type InsertCode, type Favorite, type Rating, type Report, type Advertisement, type InsertAdvertisement, codes, users, favorites, ratings, reports, advertisements, categories } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and, sum } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUserWithPassword(firstName: string, lastName: string, email: string, password: string): Promise<User> {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        id,
        firstName,
        lastName,
        email,
        passwordHash,
      })
      .returning();
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return undefined;
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : undefined;
  }

  async updateUserTags(userId: string, tags: string[]): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ tags, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Code operations
  async getAllCodes(): Promise<Code[]> {
    return await db.select().from(codes).orderBy(desc(codes.createdAt));
  }

  async getApprovedCodes(): Promise<Code[]> {
    return await db
      .select()
      .from(codes)
      .where(eq(codes.status, "approved"))
      .orderBy(desc(codes.createdAt));
  }

  async getCodesByCategory(category: string): Promise<Code[]> {
    return await db
      .select()
      .from(codes)
      .where(and(eq(codes.category, category), eq(codes.status, "approved")))
      .orderBy(desc(codes.createdAt));
  }

  async getCodeById(id: string): Promise<Code | undefined> {
    const result = await db.select().from(codes).where(eq(codes.id, id)).limit(1);
    return result[0];
  }

  async createCode(insertCode: InsertCode): Promise<Code> {
    const id = randomUUID();
    const code: Code = {
      ...insertCode,
      id,
      copyCount: 0,
      createdAt: new Date(),
    };
    await db.insert(codes).values(code);
    return code;
  }

  async updateCode(id: string, updates: Partial<Code>): Promise<Code | undefined> {
    const result = await db
      .update(codes)
      .set(updates)
      .where(eq(codes.id, id))
      .returning();
    return result[0];
  }

  async deleteCode(id: string): Promise<boolean> {
    const result = await db.delete(codes).where(eq(codes.id, id)).returning();
    return result.length > 0;
  }

  async incrementCopyCount(id: string): Promise<void> {
    await db
      .update(codes)
      .set({ copyCount: sql`${codes.copyCount} + 1` })
      .where(eq(codes.id, id));
  }

  async getCategoryCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    for (const category of categories) {
      counts[category.id] = 0;
    }

    const results = await db
      .select({
        category: codes.category,
        count: sql<number>`count(*)::int`,
      })
      .from(codes)
      .where(eq(codes.status, "approved"))
      .groupBy(codes.category);

    for (const row of results) {
      counts[row.category] = row.count;
    }

    return counts;
  }

  async getCodesByUser(userId: string): Promise<Code[]> {
    return await db
      .select()
      .from(codes)
      .where(eq(codes.submitterId, userId))
      .orderBy(desc(codes.createdAt));
  }

  // Favorites operations
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
  }

  async getFavoriteCodesForUser(userId: string): Promise<Code[]> {
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    if (userFavorites.length === 0) return [];
    
    const codeIds = userFavorites.map(f => f.codeId);
    const result: Code[] = [];
    
    for (const codeId of codeIds) {
      const code = await this.getCodeById(codeId);
      if (code && code.status === "approved") {
        result.push(code);
      }
    }
    
    return result;
  }

  async addFavorite(userId: string, codeId: string): Promise<Favorite> {
    const id = randomUUID();
    const favorite: Favorite = {
      id,
      userId,
      codeId,
      createdAt: new Date(),
    };
    await db.insert(favorites).values(favorite);
    return favorite;
  }

  async removeFavorite(userId: string, codeId: string): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.codeId, codeId)))
      .returning();
    return result.length > 0;
  }

  async isFavorited(userId: string, codeId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.codeId, codeId)))
      .limit(1);
    return result.length > 0;
  }

  // Rating operations
  async getRatingByUserAndCode(userId: string, codeId: string): Promise<Rating | undefined> {
    const result = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.codeId, codeId)))
      .limit(1);
    return result[0];
  }

  async upsertRating(userId: string, codeId: string, value: number): Promise<Rating> {
    const existingRating = await this.getRatingByUserAndCode(userId, codeId);
    
    if (existingRating) {
      const [updated] = await db
        .update(ratings)
        .set({ value })
        .where(eq(ratings.id, existingRating.id))
        .returning();
      return updated;
    }
    
    const id = randomUUID();
    const rating: Rating = {
      id,
      userId,
      codeId,
      value,
      createdAt: new Date(),
    };
    await db.insert(ratings).values(rating);
    return rating;
  }

  async getRatingSummary(codeId: string): Promise<{ upvotes: number; downvotes: number }> {
    const allRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.codeId, codeId));
    
    let upvotes = 0;
    let downvotes = 0;
    
    for (const rating of allRatings) {
      if (rating.value > 0) upvotes++;
      else if (rating.value < 0) downvotes++;
    }
    
    return { upvotes, downvotes };
  }

  // Report operations
  async createReport(userId: string, codeId: string, reason: string): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      id,
      userId,
      codeId,
      reason,
      status: "pending",
      createdAt: new Date(),
    };
    await db.insert(reports).values(report);
    return report;
  }

  async getReportsByCode(codeId: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.codeId, codeId))
      .orderBy(desc(reports.createdAt));
  }

  async getAllPendingReports(): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.status, "pending"))
      .orderBy(desc(reports.createdAt));
  }

  async updateReportStatus(id: string, status: string): Promise<Report | undefined> {
    const result = await db
      .update(reports)
      .set({ status })
      .where(eq(reports.id, id))
      .returning();
    return result[0];
  }

  // Analytics
  async getPopularCodes(limit: number = 10): Promise<Code[]> {
    return await db
      .select()
      .from(codes)
      .where(eq(codes.status, "approved"))
      .orderBy(desc(codes.copyCount))
      .limit(limit);
  }

  async getTrendingCodes(limit: number = 10): Promise<Code[]> {
    // Trending = recently created with good copy count
    const oneDayAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return await db
      .select()
      .from(codes)
      .where(eq(codes.status, "approved"))
      .orderBy(desc(codes.copyCount), desc(codes.createdAt))
      .limit(limit);
  }

  async getCategoryStats(): Promise<Array<{ category: string; count: number; copies: number }>> {
    const results = await db
      .select({
        category: codes.category,
        count: sql<number>`count(*)::int`,
        copies: sql<number>`coalesce(sum(${codes.copyCount}), 0)::int`,
      })
      .from(codes)
      .where(eq(codes.status, "approved"))
      .groupBy(codes.category);

    return results;
  }

  // Advertisement operations
  async getAllAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
  }

  async getApprovedAdvertisements(): Promise<Advertisement[]> {
    return await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.status, "approved"))
      .orderBy(desc(advertisements.createdAt));
  }

  async getAdvertisementsByCategory(category: string): Promise<Advertisement[]> {
    return await db
      .select()
      .from(advertisements)
      .where(and(eq(advertisements.category, category), eq(advertisements.status, "approved")))
      .orderBy(desc(advertisements.createdAt));
  }

  async getAdvertisementById(id: string): Promise<Advertisement | undefined> {
    const result = await db.select().from(advertisements).where(eq(advertisements.id, id)).limit(1);
    return result[0];
  }

  async createAdvertisement(insertAd: InsertAdvertisement): Promise<Advertisement> {
    const id = randomUUID();
    const ad: Advertisement = {
      ...insertAd,
      id,
      viewCount: 0,
      createdAt: new Date(),
    };
    await db.insert(advertisements).values(ad);
    return ad;
  }

  async updateAdvertisement(id: string, updates: Partial<Advertisement>): Promise<Advertisement | undefined> {
    const result = await db
      .update(advertisements)
      .set(updates)
      .where(eq(advertisements.id, id))
      .returning();
    return result[0];
  }

  async deleteAdvertisement(id: string): Promise<boolean> {
    const result = await db.delete(advertisements).where(eq(advertisements.id, id)).returning();
    return result.length > 0;
  }

  async incrementViewCount(id: string): Promise<void> {
    await db
      .update(advertisements)
      .set({ viewCount: sql`${advertisements.viewCount} + 1` })
      .where(eq(advertisements.id, id));
  }

  async getAdvertisementsByUser(userId: string): Promise<Advertisement[]> {
    return await db
      .select()
      .from(advertisements)
      .where(eq(advertisements.submitterId, userId))
      .orderBy(desc(advertisements.createdAt));
  }

  async seedInitialData(): Promise<void> {
    const existingCodes = await db.select().from(codes).limit(1);
    if (existingCodes.length > 0) {
      return;
    }

    const sampleCodes: Code[] = [
      {
        id: randomUUID(),
        title: "Discord Nitro Free Trial",
        code: "NITRO2024FREE",
        description: "Get 1 month of Discord Nitro free for new users. Limited time offer!",
        category: "discord",
        status: "approved",
        isVerified: true,
        copyCount: 234,
        submitterId: null,
        submitterName: "Admin",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "Hypixel VIP Weekend Pass",
        code: "HYPIXEL-VIP-2024",
        description: "Access VIP features on Hypixel for the weekend",
        category: "minecraft",
        status: "approved",
        isVerified: true,
        copyCount: 156,
        submitterId: null,
        submitterName: "MinecraftFan",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "Steam Winter Sale Bonus",
        code: "STEAM-WINTER-10",
        description: "Extra 10% off during Steam Winter Sale on select titles",
        category: "gaming",
        status: "approved",
        isVerified: false,
        copyCount: 89,
        submitterId: null,
        submitterName: null,
        submitterEmail: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "JetBrains All Products Pack",
        code: "JETBRAINS-STUDENT-2024",
        description: "Free JetBrains IDE license for students. Verify with .edu email.",
        category: "software",
        status: "approved",
        isVerified: true,
        copyCount: 312,
        submitterId: null,
        submitterName: "DevHelper",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "Amazon 20% Off Electronics",
        code: "ELEC20OFF",
        description: "20% discount on electronics over $50. Valid until end of month.",
        category: "shopping",
        status: "approved",
        isVerified: false,
        copyCount: 67,
        submitterId: null,
        submitterName: "DealFinder",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "Udemy Course Bundle Deal",
        code: "LEARN2024",
        description: "Get any 3 courses for the price of 1. New users only.",
        category: "education",
        status: "approved",
        isVerified: true,
        copyCount: 198,
        submitterId: null,
        submitterName: null,
        submitterEmail: null,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "Notion Pro Trial",
        code: "NOTION-PRO-30",
        description: "30 days of Notion Pro features free. Perfect for teams.",
        category: "tools",
        status: "approved",
        isVerified: true,
        copyCount: 145,
        submitterId: null,
        submitterName: "ProductivityGuru",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "Netflix 2 Months Free",
        code: "NETFLIX-NEW-USER",
        description: "New subscribers get 2 months free with annual plan",
        category: "streaming",
        status: "approved",
        isVerified: false,
        copyCount: 423,
        submitterId: null,
        submitterName: "StreamLover",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "Binance Sign-up Bonus",
        code: "BNB-WELCOME-100",
        description: "$100 bonus for new accounts with first $500 deposit",
        category: "crypto",
        status: "approved",
        isVerified: true,
        copyCount: 76,
        submitterId: null,
        submitterName: null,
        submitterEmail: null,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "Canva Pro Free Month",
        code: "CANVA-CREATE-FREE",
        description: "One month of Canva Pro with all premium features",
        category: "websites",
        status: "approved",
        isVerified: true,
        copyCount: 287,
        submitterId: null,
        submitterName: "DesignPro",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        title: "Discord Server Boost",
        code: "BOOST-SERVER-FREE",
        description: "Free server boost for verified servers",
        category: "discord",
        status: "pending",
        isVerified: false,
        copyCount: 0,
        submitterId: null,
        submitterName: "NewUser",
        submitterEmail: "user@example.com",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        title: "Epic Games Coupon",
        code: "EPIC-WINTER-2024",
        description: "$10 off any game purchase over $15",
        category: "gaming",
        status: "pending",
        isVerified: false,
        copyCount: 0,
        submitterId: null,
        submitterName: "Gamer123",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.insert(codes).values(sampleCodes);
  }
}

export const dbStorage = new DatabaseStorage();
