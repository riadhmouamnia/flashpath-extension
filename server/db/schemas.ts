import { relations } from "drizzle-orm";
import {
  boolean,
  json,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: numeric("id").primaryKey().notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paths = pgTable("paths", {
  id: numeric("id").primaryKey().notNull(),
  name: text("name").notNull(),
  userId: numeric("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interactions = pgTable("interactions", {
  url: text("url").primaryKey().notNull(),
  totalTimeSpent: numeric("total_time_spent"),
  reloadCount: numeric("reload_count"),
  scrollPosition: json("scroll_position"),
  hasScrolledFullPage: boolean("has_scrolled_full_page"),
  isBookmarked: boolean("is_bookmarked"),
  Keystrokes: json("keystrokes"),
  textHighlightEvent: json("text_highlight_event"),
  mediaEvent: json("media_event"),
  clickEvent: json("click_event"),
  pathId: numeric("path_id")
    .notNull()
    .references(() => paths.id),
  userId: numeric("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notes = pgTable("notes", {
  url: text("url").primaryKey().notNull(),
  notes: json("notes"),
  pathId: numeric("path_id")
    .notNull()
    .references(() => paths.id),
  userId: numeric("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// relationships
export const usersRelations = relations(users, ({ many }) => ({
  paths: many(paths),
}));

export const pathsRelations = relations(paths, ({ one, many }) => ({
  user: one(users, {
    fields: [paths.userId],
    references: [users.id],
  }),
  interactions: many(interactions),
  notes: many(notes),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  path: one(paths, {
    fields: [interactions.pathId],
    references: [paths.id],
  }),
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  path: one(paths, {
    fields: [notes.pathId],
    references: [paths.id],
  }),
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));
