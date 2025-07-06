import Database from 'better-sqlite3';

const db = new Database('example.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
    );
`);

console.log('Database and table created successfully.');
export default db;