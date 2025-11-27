import { pgTable, text, varchar, integer, boolean, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const categories = [
  { id: "discord", name: "Discord", icon: "MessageCircle", description: "Free Discord codes & giveaways", type: "codes" },
  { id: "minecraft", name: "Minecraft", icon: "Gamepad2", description: "Free Minecraft codes & keys", type: "codes" },
  { id: "websites", name: "Websites", icon: "Globe", description: "Free website codes & access", type: "codes" },
  { id: "discord-bots", name: "Discord Bots", icon: "Bot", description: "Advertise your Discord bots", type: "advertising" },
  { id: "discord-servers", name: "Discord Servers", icon: "Server", description: "Advertise your Discord servers", type: "advertising" },
  { id: "minecraft-addons", name: "Minecraft Addons", icon: "Puzzle", description: "Advertise mods, plugins & resource packs", type: "advertising" },
] as const;

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
  isAdmin: boolean("is_admin").default(false),
  customTags: jsonb("custom_tags").default(sql`'[]'::jsonb`), // Array of custom tags added by owner
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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
