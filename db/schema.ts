import { integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

// Satu baris = satu data planner.
// collection: "settings" | "vendors" | "seserahan" | "checklist" | "guests"
// itemId: id item (untuk settings = nama pengaturan, untuk vendors = key kategori)
export const records = pgTable(
  "records",
  {
    collection: text().notNull(),
    itemId: text("item_id").notNull(),
    data: jsonb().notNull(),
    position: integer().notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.collection, t.itemId] })],
);
