/* FILE: backend/server.js - DIAGNOSTIC VERSION */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs'); 
const csv = require('csv-parser');
const mammoth = require('mammoth'); 
const pdf = require('pdf-parse'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios'); // Bắt buộc phải có thư viện này

const app = express();
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH ---
const MODEL_NAME = "gemini-2.5-flash"; // Model mặc định

// Cấu hình Memory Storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 🔍 TÍNH NĂNG TỰ KIỂM TRA MODEL (CHẨN ĐOÁN)
// ==========================================
async function checkAvailableModels() {
    try {
        console.log("🔍 Đang kết nối tới Google để lấy danh sách Model...");
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        
        const response = await axios.get(url);
        const models = response.data.models;
        
        console.log("\n✅ KẾT NỐI THÀNH CÔNG! Dưới đây là các Model bạn được dùng:");
        console.log("-------------------------------------------------------");
        const availableNames = [];
        models.forEach(m => {
            const name = m.name.replace('models/', '');
            if (name.includes('gemini')) {
                console.log(`🔹 ${name}`);
                availableNames.push(name);
            }
        });
        console.log("-------------------------------------------------------\n");

        if (!availableNames.includes(MODEL_NAME)) {
            console.warn(`⚠️ CẢNH BÁO: Model mặc định '${MODEL_NAME}' không thấy trong danh sách!`);
            console.warn(`👉 Hãy đổi biến MODEL_NAME trong code thành một trong các tên ở trên.`);
        } else {
            console.log(`🚀 Model mặc định '${MODEL_NAME}' HỢP LỆ. Sẵn sàng chiến đấu!`);
        }

    } catch (error) {
        console.error("❌ LỖI KẾT NỐI GOOGLE:", error.response?.data || error.message);
        console.error("👉 Kiểm tra lại API KEY xem có bị sai hoặc hết hạn không.");
    }
}

// Chạy kiểm tra ngay khi khởi động
checkAvailableModels();

// ==========================================
// CÁC API NGHIỆP VỤ
// ==========================================

// Hàm phân tích CV (đã bỏ tham số apiVersion gây lỗi)
async function analyzeCV(fileBuffer, mimeType, jobCriteria) {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME }); // Để mặc định, không ép v1beta
        
        let prompt = `Bạn là chuyên gia HR. Hãy trích xuất thông tin từ tài liệu đính kèm.`;
        
        if (jobCriteria) {
            // ĐÂY CHÍNH LÀ CHỖ AI "HỌC" TỪ CSV CỦA BẠN
            // Chúng ta nhồi tiêu chí từ DB vào Prompt
            const reqs = jobCriteria.requirements;
            prompt += `
            Và SO SÁNH với yêu cầu công việc sau:
            - Vị trí: "${jobCriteria.title}"
            - Kỹ năng cần có: ${reqs.skills ? reqs.skills.join(', ') : 'Không rõ'}
            - Kinh nghiệm: ${reqs.experience_years} năm
            - Học vấn: ${reqs.education}
            
            Nhiệm vụ:
            1. Trích xuất thông tin ứng viên.
            2. Đánh giá % độ phù hợp (0-100) dựa trên các tiêu chí trên.
            3. Giải thích ngắn gọn lý do tại sao phù hợp/không phù hợp.
            `;
        } else {
            prompt += ` Đánh giá tổng quan chất lượng hồ sơ.`;
        }

        prompt += `
        Trả về JSON duy nhất (không markdown):
        {
            "full_name": "Tên ứng viên",
            "email": "Email",
            "skills": ["Skill 1", "Skill 2"],
            "score": số điểm (0-100),
            "match_reason": "Đánh giá chi tiết (Tiếng Việt)",
            "summary": "Tóm tắt hồ sơ"
        }`;

        const imageParts = [{
            inlineData: {
                data: fileBuffer.toString("base64"),
                mimeType: mimeType,
            },
        }];

        const result = await model.generateContent([prompt, ...imageParts]);
        const responseText = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Lỗi Gemini:", error.message);
        throw new Error(`AI không phản hồi: ${error.message}`);
    }
}

// API Upload & Scan
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        const jobId = req.body.job_id;
        let jobCriteria = null;
        
        // Lấy tri thức từ DB (CSV đã import)
        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) jobCriteria = jobRes.rows[0];
        }

        // Gọi AI phân tích
        const aiResult = await analyzeCV(req.file.buffer, req.file.mimetype, jobCriteria);

        // Lưu kết quả
        const finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";

        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6) RETURNING *`,
            [jobId || null, finalName, aiResult.email, jobCriteria ? jobCriteria.title : 'Ứng viên tự do', finalScore, JSON.stringify(aiResult)]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) {
        console.error("Lỗi Server:", err);
        res.status(500).json({ error: "Lỗi Server: " + err.message });
    }
});

// ... (Giữ nguyên các API import, list jobs, candidates cũ) ...
app.get('/api/candidates', async (req, res) => {
    const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
    res.json(result.rows);
});
app.get('/api/jobs', async (req, res) => {
    const result = await pool.query('SELECT * FROM job_positions ORDER BY id DESC');
    res.json(result.rows);
});
app.post('/api/jobs/import', upload.single('csv_file'), async (req, res) => {
    // ... code import csv cũ ...
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu CSV' });
        const results = [];
        const stream = require('stream').Readable.from(req.file.buffer);
        stream.pipe(csv()).on('data', (data) => results.push({
            title: data.Title || 'Job mới',
            requirements: { skills: data.Skills ? data.Skills.split('|') : [], experience: data.Experience || 0 },
            status: 'active'
        })).on('end', async () => {
            for (const job of results) await pool.query(`INSERT INTO job_positions (title, requirements, status) VALUES ($1, $2, 'active')`, [job.title, JSON.stringify(job.requirements)]);
            res.json({ message: "Import xong!" });
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});