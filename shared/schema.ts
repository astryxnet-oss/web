import { pgTable, text, varchar, integer, boolean, timestamp, index, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// User role enum
export const userRoleEnum = pgEnum("user_role", ["owner", "staff", "user"]);
export type UserRole = "owner" | "staff" | "user";

export const categories = [
  { id: "discord", name: "Discord", icon: "MessageCircle", description: "Free Discord codes & giveaways", type: "codes" },
  { id: "minecraft", name: "Minecraft", icon: "Gamepad2", description: "Free Minecraft codes & keys", type: "codes" },
  { id: "websites", name: "Websites", icon: "Globe", description: "Free website codes & access", type: "codes" },
  { id: "gaming", name: "Gaming", icon: "Gamepad", description: "Free gaming codes & keys", type: "codes" },
  { id: "streaming", name: "Streaming", icon: "Play", description: "Free streaming service codes", type: "codes" },
  { id: "software", name: "Software", icon: "Code", description: "Free software licenses", type: "codes" },
  { id: "crypto", name: "Crypto", icon: "Coins", description: "Free crypto & web3 codes", type: "codes" },
  { id: "education", name: "Education", icon: "GraduationCap", description: "Free educational access codes", type: "codes" },
  { id: "shopping", name: "Shopping", icon: "ShoppingBag", description: "Free shopping & discount codes", type: "codes" },
  { id: "tools", name: "Tools", icon: "Wrench", description: "Free tool & utility codes", type: "codes" },
  { id: "discord-bots", name: "Discord Bots", icon: "Bot", description: "Advertise your Discord bots", type: "advertising" },
  { id: "discord-servers", name: "Discord Servers", icon: "Server", description: "Advertise your Discord servers", type: "advertising" },
  { id: "minecraft-addons", name: "Minecraft Addons", icon: "Puzzle", description: "Advertise mods, plugins & resource packs", type: "advertising" },
] as const;

export const userTags = [
  { id: "admin", name: "Admin", color: "red" },
  { id: "moderator", name: "Mod", color: "blue" },
  { id: "verified", name: "Verified", color: "green" },
  { id: "contributor", name: "Contributor", color: "purple" },
  { id: "premium", name: "Premium", color: "yellow" },
  { id: "early-supporter", name: "Early Supporter", color: "pink" },
] as const;

export type UserTagId = typeof userTags[number]["id"];

export type CategoryId = typeof categories[number]["id"];

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  isAdmin: boolean("is_admin").default(false),
  role: userRoleEnum("role").default("user"),
  tags: text("tags").array().default([]),
  bio: text("bio"),
  emailVerifiedAt: timestamp("email_verified_at"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: varchar("two_factor_secret"),
  twoFactorBackupCodes: text("two_factor_backup_codes"),
  isBanned: boolean("is_banned").default(false),
  bannedReason: text("banned_reason"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull().default("signup"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;

// 2FA login challenges (for pending 2FA verification during login)
export const loginChallenges = pgTable("login_challenges", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type LoginChallenge = typeof loginChallenges.$inferSelect;

// Audit log for admin actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  actorId: varchar("actor_id", { length: 36 }).notNull(),
  actorEmail: varchar("actor_email"),
  action: varchar("action", { length: 50 }).notNull(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: varchar("target_id", { length: 36 }),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// Site settings (key-value store for owner configuration)
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// Advertisements table for listings (Discord bots, servers, Minecraft addons)
export const advertisements = pgTable("advertisements", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  inviteLink: text("invite_link"), // Discord invite, download link, etc.
  imageUrl: text("image_url"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  isVerified: boolean("is_verified").default(false),
  viewCount: integer("view_count").default(0),
  submitterId: varchar("submitter_id", { length: 36 }),
  submitterName: text("submitter_name"),
  submitterEmail: text("submitter_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({
  id: true,
  viewCount: true,
  createdAt: true,
});

export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisements.$inferSelect;

const advertisingCategoryIds = categories.filter(c => c.type === "advertising").map(c => c.id) as [string, ...string[]];

export const submitAdvertisementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional().or(z.literal("")),
  category: z.enum(advertisingCategoryIds, { errorMap: () => ({ message: "Please select a category" }) }),
  inviteLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  submitterName: z.string().max(50, "Name is too long").optional().or(z.literal("")),
  submitterEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type SubmitAdvertisement = z.infer<typeof submitAdvertisementSchema>;

export const codes = pgTable("codes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  isVerified: boolean("is_verified").default(false),
  copyCount: integer("copy_count").default(0),
  submitterId: varchar("submitter_id", { length: 36 }),
  submitterName: text("submitter_name"),
  submitterEmail: text("submitter_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCodeSchema = createInsertSchema(codes).omit({
  id: true,
  copyCount: true,
  createdAt: true,
});

const categoryIds = categories.map(c => c.id) as [string, ...string[]];

export const submitCodeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  code: z.string().min(1, "Code is required").max(500, "Code is too long"),
  description: z.string().max(500, "Description is too long").optional().or(z.literal("")),
  category: z.enum(categoryIds, { errorMap: () => ({ message: "Please select a category" }) }),
  submitterName: z.string().max(50, "Name is too long").optional().or(z.literal("")),
  submitterEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type InsertCode = z.infer<typeof insertCodeSchema>;
export type Code = typeof codes.$inferSelect;
export type SubmitCode = z.infer<typeof submitCodeSchema>;

// Favorites table for users to save codes
export const favorites = pgTable("favorites", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  codeId: varchar("code_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// Ratings table for code upvotes/downvotes
export const ratings = pgTable("ratings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  codeId: varchar("code_id", { length: 36 }).notNull(),
  value: integer("value").notNull(), // 1 for upvote, -1 for downvote
  createdAt: timestamp("created_at").defaultNow(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

// Reports table for flagging problematic codes
export const reports = pgTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  codeId: varchar("code_id", { length: 36 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, reviewed, dismissed
  createdAt: timestamp("created_at").defaultNow(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
