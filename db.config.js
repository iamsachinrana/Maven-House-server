require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT
})

client.connect(function (err) {
  if (err) throw err;
  console.log("🔌️ Database Connection has been established successfully!");
});

module.exports = client;

