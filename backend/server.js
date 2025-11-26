require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình nơi lưu file tạm thời khi upload
// (Lưu ý: trên Render miễn phí, file này sẽ mất sau khi server khởi động lại, nhưng đủ để ta xử lý)
const upload = multer({ dest: 'uploads/' });

// Kết nối Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- HÀM "AI" ĐỌC HIỂU CV ---
async function parseCV(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdf(dataBuffer);
        const text = data.text; // Văn bản thô từ PDF

        // 1. Tìm Email (Thuật toán Regex)
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        const emails = text.match(emailRegex);
        const extractedEmail = emails ? emails[0] : null;

        // 2. Tìm Kỹ năng (So khớp từ khóa phổ biến)
        const techKeywords = ['React', 'NodeJS', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Excel', 'Figma', 'Javascript', 'HTML', 'CSS'];
        const foundSkills = techKeywords.filter(skill => 
            text.toLowerCase().includes(skill.toLowerCase())
        );

        // 3. Chấm điểm sơ bộ (Dựa trên số lượng kỹ năng)
        // Công thức: Mỗi kỹ năng + 1.5 điểm, tối đa 10
        let aiScore = Math.min(10, foundSkills.length * 1.5);
        if (aiScore < 5) aiScore = 5; // Điểm sàn

        return {
            raw_text: text,
            email: extractedEmail,
            skills: foundSkills,
            score: parseFloat(aiScore.toFixed(1))
        };
    } catch (error) {
        console.error("Lỗi đọc PDF:", error);
        return null;
    }
}

// --- API 1: Upload & Scan CV ---
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Chưa gửi file nào lên' });

        const { full_name } = req.body; // Lấy tên ứng viên từ form
        
        console.log(`Đang xử lý CV của: ${full_name}...`);

        // BƯỚC 1: GỌI "AI" ĐỌC FILE
        const scanResult = await parseCV(req.file.path);

        // BƯỚC 2: CHUẨN BỊ DỮ LIỆU ĐỂ LƯU
        let status = 'Failed';
        let aiRating = 0;
        let aiAnalysis = {};
        let emailToSave = '';

        if (scanResult) {
            status = 'Screening'; // Nếu đọc được thì cho vào vòng loại
            aiRating = scanResult.score;
            emailToSave = scanResult.email || '';
            aiAnalysis = {
                skills: scanResult.skills,
                summary: `Tìm thấy ${scanResult.skills.length} kỹ năng phù hợp.`
            };
        }

        // BƯỚC 3: LƯU VÀO DATABASE
        // (Chúng ta dùng cột ai_rating và ai_analysis nãy đã tạo)
        // Nếu chưa có cột ai_analysis, bạn cần chạy lệnh SQL thêm cột (xem hướng dẫn bên dưới)
        const result = await pool.query(
            `INSERT INTO candidates (organization_id, full_name, email, role, status, ai_rating) 
             VALUES (1, $1, $2, $3, $4, $5) RETURNING *`,
            [full_name, emailToSave, 'Ứng viên mới', status, aiRating]
        );

        // Xóa file tạm để giải phóng bộ nhớ
        fs.unlinkSync(req.file.path);

        console.log("Xử lý xong!");
        res.json({ 
            message: "Scan thành công!", 
            candidate: result.rows[0], 
            analysis: aiAnalysis 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Lỗi hệ thống: " + err.message);
    }
});

// --- API 2: Lấy danh sách (Giữ nguyên cái cũ) ---
app.get('/api/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Lỗi Server');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại cổng ${PORT}`);
});