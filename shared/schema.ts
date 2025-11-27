import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = [
  { id: "discord", name: "Discord", icon: "MessageCircle", description: "Discord server invites & Nitro codes" },
  { id: "minecraft", name: "Minecraft", icon: "Gamepad2", description: "Server IPs & promo codes" },
  { id: "websites", name: "Websites", icon: "Globe", description: "Website promo codes & coupons" },
  { id: "gaming", name: "Gaming", icon: "Trophy", description: "Game keys & in-game rewards" },
  { id: "software", name: "Software", icon: "Monitor", description: "Software licenses & trials" },
  { id: "shopping", name: "Shopping", icon: "ShoppingBag", description: "Discount codes & deals" },
  { id: "education", name: "Education", icon: "GraduationCap", description: "Course access & learning resources" },
  { id: "tools", name: "Tools", icon: "Wrench", description: "Productivity & utility codes" },
  { id: "streaming", name: "Streaming", icon: "Play", description: "Streaming service trials & codes" },
  { id: "crypto", name: "Crypto", icon: "Coins", description: "Crypto bonuses & referral codes" },
] as const;

export type CategoryId = typeof categories[number]["id"];

export const codes = pgTable("codes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  isVerified: boolean("is_verified").default(false),
  copyCount: integer("copy_count").default(0),
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

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
