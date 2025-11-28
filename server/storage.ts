import { type User, type UpsertUser, type Code, type InsertCode, type Favorite, type Rating, type Report, type Advertisement, type InsertAdvertisement, type EmailVerificationToken, type LoginChallenge, type AuditLog, type SiteSetting, type UserRole, categories } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithPassword(firstName: string, lastName: string, email: string, password: string): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | undefined>;
  updateUserTags(userId: string, tags: string[]): Promise<User | undefined>;
  updateUser(userId: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  getUserCount(): Promise<number>;
  
  // Email verification
  createEmailVerificationToken(userId: string, type?: string): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(token: string): Promise<boolean>;
  deleteExpiredTokens(): Promise<void>;
  
  // 2FA login challenges
  createLoginChallenge(userId: string): Promise<LoginChallenge>;
  getLoginChallenge(token: string): Promise<LoginChallenge | undefined>;
  deleteLoginChallenge(token: string): Promise<boolean>;
  
  // Role management
  updateUserRole(userId: string, role: UserRole): Promise<User | undefined>;
  getOwner(): Promise<User | undefined>;
  getStaffUsers(): Promise<User[]>;
  hasOwner(): Promise<boolean>;
  
  // Audit logging
  createAuditLog(actorId: string, actorEmail: string | null, action: string, targetType?: string, targetId?: string, details?: any, ipAddress?: string): Promise<AuditLog>;
  getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;
  
  // Site settings
  getSiteSetting(key: string): Promise<any>;
  setSiteSetting(key: string, value: any): Promise<SiteSetting>;
  getAllSiteSettings(): Promise<SiteSetting[]>;
  
  // Code operations
  getAllCodes(): Promise<Code[]>;
  getApprovedCodes(): Promise<Code[]>;
  getCodesByCategory(category: string): Promise<Code[]>;
  getCodeById(id: string): Promise<Code | undefined>;
  createCode(code: InsertCode): Promise<Code>;
  updateCode(id: string, updates: Partial<Code>): Promise<Code | undefined>;
  deleteCode(id: string): Promise<boolean>;
  incrementCopyCount(id: string): Promise<void>;
  getCategoryCounts(): Promise<Record<string, number>>;
  getCodesByUser(userId: string): Promise<Code[]>;
  
  // Advertisement operations
  getAllAdvertisements(): Promise<Advertisement[]>;
  getApprovedAdvertisements(): Promise<Advertisement[]>;
  getAdvertisementsByCategory(category: string): Promise<Advertisement[]>;
  getAdvertisementById(id: string): Promise<Advertisement | undefined>;
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: string, updates: Partial<Advertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: string): Promise<boolean>;
  incrementViewCount(id: string): Promise<void>;
  getAdvertisementsByUser(userId: string): Promise<Advertisement[]>;
  
  // Favorites operations
  getFavoritesByUser(userId: string): Promise<Favorite[]>;
  getFavoriteCodesForUser(userId: string): Promise<Code[]>;
  addFavorite(userId: string, codeId: string): Promise<Favorite>;
  removeFavorite(userId: string, codeId: string): Promise<boolean>;
  isFavorited(userId: string, codeId: string): Promise<boolean>;
  
  // Rating operations
  getRatingByUserAndCode(userId: string, codeId: string): Promise<Rating | undefined>;
  upsertRating(userId: string, codeId: string, value: number): Promise<Rating>;
  getRatingSummary(codeId: string): Promise<{ upvotes: number; downvotes: number }>;
  
  // Report operations
  createReport(userId: string, codeId: string, reason: string): Promise<Report>;
  getReportsByCode(codeId: string): Promise<Report[]>;
  getAllPendingReports(): Promise<Report[]>;
  updateReportStatus(id: string, status: string): Promise<Report | undefined>;
  
  // Analytics
  getPopularCodes(limit?: number): Promise<Code[]>;
  getTrendingCodes(limit?: number): Promise<Code[]>;
  getCategoryStats(): Promise<Array<{ category: string; count: number; copies: number }>>;
  
  seedInitialData?(): Promise<void>;
}

import { dbStorage } from "./dbStorage";

export const storage: IStorage = dbStorage;
