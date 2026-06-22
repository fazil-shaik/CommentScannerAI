import { pgTable, serial, text, varchar, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(), // youtube, reddit, csv, manual
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  author: varchar("author", { length: 255 }),
  platform: varchar("platform", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // AI Metrics
  sentiment: varchar("sentiment", { length: 50 }), // positive, neutral, negative
  sentimentScore: doublePrecision("sentiment_score"),
  emotion: varchar("emotion", { length: 50 }), // joy, anger, fear, sadness, surprise
  emotionScore: doublePrecision("emotion_score"),
  toxicity: doublePrecision("toxicity"), // score 0 to 1
  topic: varchar("topic", { length: 100 }), // bugs, pricing, performance, features, support, other
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  comments: many(comments),
  reports: many(reports),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  project: one(projects, {
    fields: [comments.projectId],
    references: [projects.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  project: one(projects, {
    fields: [reports.projectId],
    references: [projects.id],
  }),
}));
