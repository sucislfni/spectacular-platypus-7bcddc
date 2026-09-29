import type { Config } from "@netlify/functions";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { records } from "../../db/schema.js";

const COLLECTIONS = new Set(["settings", "vendors", "seserahan", "checklist", "guests"]);

type Upsert = { collection: string; itemId: string; data: unknown; position?: number };
type Ref = { collection: string; itemId: string };

const isValidRef = (r: any): r is Ref =>
  r && COLLECTIONS.has(r.collection) && typeof r.itemId === "string" && r.itemId.length > 0 && r.itemId.length <= 200;

const noStore = { "Cache-Control": "no-store" };

export default async (req: Request) => {
  if (req.method === "GET") {
    const rows = await db
      .select()
      .from(records)
      .orderBy(asc(records.collection), asc(records.position), asc(records.updatedAt));
    return Response.json({ records: rows }, { headers: noStore });
  }

  if (req.method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "JSON tidak valid" }, { status: 400 });
    }

    const upserts: Upsert[] = Array.isArray(body?.upserts) ? body.upserts.filter((u: any) => isValidRef(u) && u.data !== undefined && u.data !== null) : [];
    const deletes: Ref[] = Array.isArray(body?.deletes) ? body.deletes.filter(isValidRef) : [];

    await db.transaction(async (tx) => {
      for (const d of deletes) {
        await tx
          .delete(records)
          .where(and(eq(records.collection, d.collection), eq(records.itemId, d.itemId)));
      }
      for (const u of upserts) {
        const position = Number.isFinite(u.position) ? Math.trunc(u.position as number) : 0;
        await tx
          .insert(records)
          .values({ collection: u.collection, itemId: u.itemId, data: u.data, position })
          .onConflictDoUpdate({
            target: [records.collection, records.itemId],
            set: { data: u.data, position, updatedAt: sql`now()` },
          });
      }
    });

    return Response.json({ ok: true, upserted: upserts.length, deleted: deletes.length }, { headers: noStore });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/data",
};
