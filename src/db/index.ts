import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = "postgresql://postgres.jjysfdhfnfuvyudybumf:dGQWK5rK4k5UVP5X@aws-0-sa-east-1.pooler.supabase.com:6543/postgres";

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
