CREATE TABLE "third_party_api_keys" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "third_party_api_keys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"provider" varchar(100) NOT NULL,
	"api_key" varchar(500) NOT NULL,
	"key_name" varchar(255),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"daily_limit" integer DEFAULT 1000 NOT NULL,
	"current_usage" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"last_reset_at" timestamp with time zone,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"priority" integer DEFAULT 1 NOT NULL,
	"metadata" text
);
