import { type User, type UpsertUser, type Code, type InsertCode, type Favorite, type Rating, type Report, categories } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
