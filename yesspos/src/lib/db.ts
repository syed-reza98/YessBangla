import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
  conn: mysql.Pool | undefined;
};

const pool =
  globalForDb.conn ??
  mysql.createPool({
    uri: process.env.DATABASE_URL || "mysql://root:@localhost:3306/yesspos_db",
    waitForConnections: true,
    connectionLimit: process.env.NODE_ENV === "production" ? 10 : 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = pool;
}

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
