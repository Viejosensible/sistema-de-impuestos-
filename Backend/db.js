const path = require('path');
const mysql = require('mysql2');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'admin_impuestos',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'sistema_impuestos',
  dateStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool.promise();
