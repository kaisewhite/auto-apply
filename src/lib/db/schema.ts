import type { InferSelectModel } from "drizzle-orm";
import { pgTable, varchar, timestamp, json, uuid, index, primaryKey, foreignKey, boolean, vector } from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const document = pgTable(
  "Document",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id").references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    metadata: json("metadata"),
    embedding: vector("embedding", { dimensions: 1536 }),
  },
  (table) => [index("embeddingIndex").using("hnsw", table.embedding.op("vector_cosine_ops"))]
);

export type User = InferSelectModel<typeof user>;
