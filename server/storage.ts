import { type User, type InsertUser, type Code, type InsertCode, categories } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllCodes(): Promise<Code[]>;
  getApprovedCodes(): Promise<Code[]>;
  getCodesByCategory(category: string): Promise<Code[]>;
  getCodeById(id: string): Promise<Code | undefined>;
  createCode(code: InsertCode): Promise<Code>;
  updateCode(id: string, updates: Partial<Code>): Promise<Code | undefined>;
  deleteCode(id: string): Promise<boolean>;
  incrementCopyCount(id: string): Promise<void>;
  getCategoryCounts(): Promise<Record<string, number>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private codes: Map<string, Code>;

  constructor() {
    this.users = new Map();
    this.codes = new Map();
    this.seedInitialData();
  }

  private seedInitialData() {
    const sampleCodes: Omit<Code, "id">[] = [
      {
        title: "Discord Nitro Free Trial",
        code: "NITRO2024FREE",
        description: "Get 1 month of Discord Nitro free for new users. Limited time offer!",
        category: "discord",
        status: "approved",
        isVerified: true,
        copyCount: 234,
        submitterName: "Admin",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Hypixel VIP Weekend Pass",
        code: "HYPIXEL-VIP-2024",
        description: "Access VIP features on Hypixel for the weekend",
        category: "minecraft",
        status: "approved",
        isVerified: true,
        copyCount: 156,
        submitterName: "MinecraftFan",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Steam Winter Sale Bonus",
        code: "STEAM-WINTER-10",
        description: "Extra 10% off during Steam Winter Sale on select titles",
        category: "gaming",
        status: "approved",
        isVerified: false,
        copyCount: 89,
        submitterName: null,
        submitterEmail: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: "JetBrains All Products Pack",
        code: "JETBRAINS-STUDENT-2024",
        description: "Free JetBrains IDE license for students. Verify with .edu email.",
        category: "software",
        status: "approved",
        isVerified: true,
        copyCount: 312,
        submitterName: "DevHelper",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Amazon 20% Off Electronics",
        code: "ELEC20OFF",
        description: "20% discount on electronics over $50. Valid until end of month.",
        category: "shopping",
        status: "approved",
        isVerified: false,
        copyCount: 67,
        submitterName: "DealFinder",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Udemy Course Bundle Deal",
        code: "LEARN2024",
        description: "Get any 3 courses for the price of 1. New users only.",
        category: "education",
        status: "approved",
        isVerified: true,
        copyCount: 198,
        submitterName: null,
        submitterEmail: null,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Notion Pro Trial",
        code: "NOTION-PRO-30",
        description: "30 days of Notion Pro features free. Perfect for teams.",
        category: "tools",
        status: "approved",
        isVerified: true,
        copyCount: 145,
        submitterName: "ProductivityGuru",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Netflix 2 Months Free",
        code: "NETFLIX-NEW-USER",
        description: "New subscribers get 2 months free with annual plan",
        category: "streaming",
        status: "approved",
        isVerified: false,
        copyCount: 423,
        submitterName: "StreamLover",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Binance Sign-up Bonus",
        code: "BNB-WELCOME-100",
        description: "$100 bonus for new accounts with first $500 deposit",
        category: "crypto",
        status: "approved",
        isVerified: true,
        copyCount: 76,
        submitterName: null,
        submitterEmail: null,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Canva Pro Free Month",
        code: "CANVA-CREATE-FREE",
        description: "One month of Canva Pro with all premium features",
        category: "websites",
        status: "approved",
        isVerified: true,
        copyCount: 287,
        submitterName: "DesignPro",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Discord Server Boost",
        code: "BOOST-SERVER-FREE",
        description: "Free server boost for verified servers",
        category: "discord",
        status: "pending",
        isVerified: false,
        copyCount: 0,
        submitterName: "NewUser",
        submitterEmail: "user@example.com",
        createdAt: new Date(),
      },
      {
        title: "Epic Games Coupon",
        code: "EPIC-WINTER-2024",
        description: "$10 off any game purchase over $15",
        category: "gaming",
        status: "pending",
        isVerified: false,
        copyCount: 0,
        submitterName: "Gamer123",
        submitterEmail: null,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    sampleCodes.forEach((code) => {
      const id = randomUUID();
      this.codes.set(id, { ...code, id });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async getAllCodes(): Promise<Code[]> {
    return Array.from(this.codes.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async getApprovedCodes(): Promise<Code[]> {
    return Array.from(this.codes.values())
      .filter((code) => code.status === "approved")
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getCodesByCategory(category: string): Promise<Code[]> {
    return Array.from(this.codes.values())
      .filter((code) => code.category === category && code.status === "approved")
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async getCodeById(id: string): Promise<Code | undefined> {
    return this.codes.get(id);
  }

  async createCode(insertCode: InsertCode): Promise<Code> {
    const id = randomUUID();
    const code: Code = {
      ...insertCode,
      id,
      copyCount: 0,
      createdAt: new Date(),
    };
    this.codes.set(id, code);
    return code;
  }

  async updateCode(id: string, updates: Partial<Code>): Promise<Code | undefined> {
    const code = this.codes.get(id);
    if (!code) return undefined;
    
    const updatedCode = { ...code, ...updates };
    this.codes.set(id, updatedCode);
    return updatedCode;
  }

  async deleteCode(id: string): Promise<boolean> {
    return this.codes.delete(id);
  }

  async incrementCopyCount(id: string): Promise<void> {
    const code = this.codes.get(id);
    if (code) {
      code.copyCount = (code.copyCount || 0) + 1;
      this.codes.set(id, code);
    }
  }

  async getCategoryCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    for (const category of categories) {
      counts[category.id] = 0;
    }
    
    for (const code of this.codes.values()) {
      if (code.status === "approved") {
        counts[code.category] = (counts[code.category] || 0) + 1;
      }
    }
    
    return counts;
  }
}

export const storage = new MemStorage();
