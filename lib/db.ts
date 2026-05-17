import { neon } from "@neondatabase/serverless";
import type { StoredAppState, UserProfile } from "@/lib/types";

const schema = `
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
`;

let sqlClient: ReturnType<typeof neon> | null = null;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export function getSql() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  sqlClient ??= neon(connectionString);
  return sqlClient;
}

export async function ensureSchema() {
  await getSql().query(schema, []);
}

export async function upsertUser(profile: UserProfile) {
  const sql = getSql();
  await sql`
    insert into glow_users (id, email, name, picture, updated_at)
    values (${profile.id}, ${profile.email}, ${profile.name}, ${profile.picture ?? null}, now())
    on conflict (id) do update set
      email = excluded.email,
      name = excluded.name,
      picture = excluded.picture,
      updated_at = now()
  `;
}

export async function loadUserState(userId: string) {
  const rows = (await getSql()`
    select state from glow_states where user_id = ${userId} limit 1
  `) as Array<{ state: StoredAppState }>;

  return rows[0]?.state ?? null;
}

export async function saveUserState(userId: string, state: StoredAppState) {
  const sql = getSql();
  const safeState = { ...state, profile: { ...state.profile, id: userId } };
  await sql`
    insert into glow_states (user_id, state, updated_at)
    values (${userId}, ${JSON.stringify(safeState)}::jsonb, now())
    on conflict (user_id) do update set
      state = excluded.state,
      updated_at = now()
  `;
}

export async function clearUserState(userId: string) {
  await getSql()`delete from glow_states where user_id = ${userId}`;
}
