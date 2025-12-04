
// import * as sql from "mssql";
import sql from "mssql";

const config: sql.config = {
  user: "sa",
  password: "root",
  server: 'localhost',
  database: "Acarsh_db",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;
  pool = await new sql.ConnectionPool(config).connect();
  return pool;
}

