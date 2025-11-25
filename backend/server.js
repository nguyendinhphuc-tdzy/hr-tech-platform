require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình chuẩn để đọc từ file .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Nó sẽ lấy nguyên chuỗi từ file .env
  ssl: {
    rejectUnauthorized: false
  }
});

// API Test
app.get('/api/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi Server: ' + err.message);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại cổng ${PORT}`);
});