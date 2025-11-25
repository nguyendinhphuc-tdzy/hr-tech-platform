require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json()); // Để server hiểu dữ liệu JSON gửi lên

// Kết nối Database
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// API 1: Lấy danh sách ứng viên (Thay thế candidateData hardcode)
app.get('/api/candidates', async (req, res) => {
    try {
        // Giả sử ta lấy của tổ chức đầu tiên (sau này sẽ lấy từ token đăng nhập)
        const result = await pool.query('SELECT * FROM candidates');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Lỗi Server");
    }
});

// API 2: Kéo thả ứng viên (Cập nhật Stage)
app.put('/api/candidates/:id/move', async (req, res) => {
    try {
        const { id } = req.params;
        const { new_stage } = req.body; // Frontend gửi { "new_stage": "interview" }
        await pool.query(
            'UPDATE candidates SET pipeline_stage = $1 WHERE id = $2',
            [new_stage, id]
        );
        res.json("Cập nhật thành công!");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Lỗi Server");
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});