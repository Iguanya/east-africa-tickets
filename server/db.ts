import mysql, { PoolConnection, ResultSetHeader } from "mysql2/promise";

const {
  MYSQL_HOST = "localhost",
  MYSQL_PORT = "3306",
  MYSQL_USER = "root",
  MYSQL_PASSWORD = "root_root",
  MYSQL_DATABASE = "east_africa_tickets",
  MYSQL_CONNECTION_LIMIT = "10",
} = process.env;

export const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: Number(MYSQL_PORT),
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: Number(MYSQL_CONNECTION_LIMIT),
});

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function execute(sql: string, params: unknown[] = []) {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

export async function getConnection() {
  return pool.getConnection();
}

export async function withTransaction<T>(
  fn: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

