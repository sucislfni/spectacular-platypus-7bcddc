CREATE TABLE "records" (
	"collection" text,
	"item_id" text,
	"data" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "records_pkey" PRIMARY KEY("collection","item_id")
);
