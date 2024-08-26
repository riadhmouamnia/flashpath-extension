import { is, relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  json,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: text("username").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paths = pgTable("paths", {
  id: serial("id").primaryKey().notNull(),
  name: text("name").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pages = pgTable(
  "pages",
  {
    id: serial("id").primaryKey().notNull(),
    pathId: serial("path_id")
      .notNull()
      .references(() => paths.id),
    url: text("url").notNull(),
    domain: text("domain").notNull(),
    timeOnPage: numeric("time_on_page"),
    isBookmarked: boolean("is_bookmarked"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      urlIdx: index("url_idx").on(table.url),
      domainIdx: index("domain_idx").on(table.domain),
    };
  }
);

export const interactions = pgTable(
  "interactions",
  {
    id: serial("id").primaryKey().notNull(),
    pageId: serial("page_id")
      .notNull()
      .references(() => pages.id),
    type: text("type").notNull(),
    event: json("event").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      pageIdIdx: index("interactions_page_id_idx").on(table.pageId),
    };
  }
);

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey().notNull(),
    pageId: serial("page_id")
      .notNull()
      .references(() => pages.id),
    body: text("body").notNull(),
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    color: text("color"),
    favorite: boolean("favorite").default(false),
    hidden: boolean("hidden").default(false),
    sort: numeric("sort"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      pageIdIdx: index("notes_page_id_idx").on(table.pageId),
      tagIdx: index("tag_idx").on(table.tags),
      colorIdx: index("color_idx").on(table.color),
      favoriteIdx: index("favorite_idx").on(table.favorite),
      hiddenIdx: index("hidden_idx").on(table.hidden),
    };
  }
);

// relationships
export const usersRelations = relations(users, ({ many }) => ({
  paths: many(paths),
}));

export const pathsRelations = relations(paths, ({ one, many }) => ({
  user: one(users, {
    fields: [paths.userId],
    references: [users.id],
  }),
  pages: many(pages),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  path: one(paths, {
    fields: [pages.pathId],
    references: [paths.id],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  page: one(pages, {
    fields: [interactions.pageId],
    references: [pages.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  page: one(pages, {
    fields: [notes.pageId],
    references: [pages.id],
  }),
}));
