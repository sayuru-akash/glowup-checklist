import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = neon(connectionString);

await sql.query(
  `
  create table if not exists glow_users (
    id text primary key,
    email text not null,
    name text not null,
    picture text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists glow_states (
    user_id text primary key references glow_users(id) on delete cascade,
    state jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );
  `,
  []
);

console.log("Database schema ready.");
