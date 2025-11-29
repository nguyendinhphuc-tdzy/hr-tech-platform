/* FILE: backend/server.js */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs'); 
const csv = require('csv-parser');


// --- IMPORT THƯ VIỆN ĐỌC FILE ---
const mammoth = require('mammoth'); 
const pdf = require('pdf-parse'); // Dùng tên biến 'pdf' thống nhất

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// --- KIỂM TRA THƯ VIỆN (DEBUG) ---
console.log("Kiểm tra thư viện PDF:", typeof pdf); 
// Nếu nó in ra 'function' là đúng. Nếu 'undefined' là lỗi cài đặt.

// Cấu hình Memory Storage (Lưu file vào RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// 1. CÁC HÀM HỖ TRỢ
// ==========================================

// Hàm đọc PDF an toàn
async function readPdfBuffer(buffer) {
    try {
        if (typeof pdf !== 'function') {
            throw new Error("Thư viện pdf-parse chưa khởi tạo đúng!");
        }
        const data = await pdf(buffer);
        return data.text;
    } catch (err) {
        console.error("Lỗi đọc PDF nội bộ:", err);
        throw new Error("Không thể đọc nội dung file PDF này.");
    }
}

// Hàm chia nhỏ văn bản
function chunkText(text, chunkSize = 1000) {
    const chunks = [];
    let currentChunk = "";
    const sentences = text.split(/(?<=[.?!])\s+/);
    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > chunkSize) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else { currentChunk += " " + sentence; }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
}

// Hàm tạo Vector
async function createEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

// Hàm phân tích CV bằng Gemini
async function analyzeCV(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Bạn là HR. Phân tích CV này và trả về JSON (chỉ JSON): 
        { "full_name": "...", "email": "...", "skills": [], "score": 0, "summary": "..." }
        Nội dung: ${text.substring(0, 15000)}`;
        
        const result = await model.generateContent(prompt);
        const txt = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(txt);
    } catch (e) { return { skills: [], score: 0, summary: "Lỗi AI phân tích", full_name: "Ứng viên" }; }
}

// ==========================================
// 2. CÁC API
// ==========================================

// --- API 1: SCAN & MATCHING (So khớp với tiêu chí) ---
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        
        // Lấy ID công việc mà HR chọn (nếu có)
        const jobId = req.body.job_id;
        
        let jobCriteria = null;
        if (jobId) {
            // Lấy tiêu chí từ Database
            const jobResult = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobResult.rows.length > 0) {
                jobCriteria = jobResult.rows[0];
            }
        }

        // 1. Đọc nội dung PDF
        let rawText = "";
        try {
            const pdfData = await pdfParse(req.file.buffer);
            rawText = pdfData.text;
        } catch (e) { return res.status(400).json({ error: "Lỗi đọc file PDF" }); }

        // 2. Gửi cho AI Phân tích & So sánh
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        let prompt = "";
        if (jobCriteria) {
            // TRƯỜNG HỢP CÓ TIÊU CHÍ (Matching Mode)
            const reqs = jobCriteria.requirements;
            prompt = `
            Bạn là HR Manager. Hãy so sánh CV dưới đây với yêu cầu công việc sau:
            - Vị trí: ${jobCriteria.title}
            - Kỹ năng bắt buộc: ${reqs.skills ? reqs.skills.join(', ') : 'Không rõ'}
            - Kinh nghiệm: ${reqs.experience_years} năm
            - Học vấn: ${reqs.education}

            Nhiệm vụ:
            1. Trích xuất thông tin ứng viên.
            2. Đánh giá mức độ phù hợp (%) dựa trên các tiêu chí trên.
            3. Giải thích ngắn gọn lý do trừ điểm.

            Trả về JSON:
            {
                "full_name": "Tên ứng viên",
                "email": "Email",
                "score": số điểm (0-100),
                "match_reason": "Giải thích tại sao đạt điểm này",
                "skills": ["kỹ năng của ứng viên"],
                "missing_skills": ["kỹ năng còn thiếu"]
            }
            Nội dung CV: ${rawText.substring(0, 15000)}
            `;
        } else {
            // TRƯỜNG HỢP KHÔNG CHỌN VỊ TRÍ (Scan Mode thường)
            prompt = `Phân tích CV và trả về JSON: { "full_name": "...", "email": "...", "skills": [], "score": 0, "match_reason": "Tóm tắt hồ sơ" } \nNội dung: ${rawText.substring(0, 15000)}`;
        }

        const aiResultRaw = await model.generateContent(prompt);
        const txt = aiResultRaw.response.text().replace(/```json|```/g, '').trim();
        const aiResult = JSON.parse(txt);

        // Chuẩn hóa điểm về thang 10
        const finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;

        // 3. Lưu vào Database
        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên";
        
        // Lưu ý: Thêm cột job_id vào lệnh INSERT
        const result = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6) RETURNING *`,
            [
                jobId || null, // Lưu job_id nếu có
                finalName, 
                aiResult.email, 
                jobCriteria ? jobCriteria.title : 'Ứng viên tự do', // Role lấy theo tên Job
                finalScore, 
                JSON.stringify(aiResult)
            ]
        );

        res.json({ message: "Scan & Matching thành công!", candidate: result.rows[0] });

    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: "Lỗi Server: " + err.message }); 
    }
});

// API 2: Lấy danh sách
app.get('/api/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// API 3: Upload Tài liệu Training (Sửa lỗi 500 tại đây)
app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file tài liệu' });
        console.log(`📚 Đang học tài liệu: ${req.file.originalname}`);
        
        let rawText = "";

        // Xử lý PDF
        if (req.file.mimetype === 'application/pdf') {
            rawText = await readPdfBuffer(req.file.buffer);
        } 
        // Xử lý Word
        else if (req.file.mimetype.includes('word') || req.file.originalname.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            rawText = result.value;
        } else {
            return res.status(400).json({ error: "Chỉ hỗ trợ PDF và DOCX" });
        }

        // Training
        const chunks = chunkText(rawText);
        for (const chunk of chunks) {
            if (!chunk.trim()) continue;
            const vector = await createEmbedding(chunk);
            await pool.query(
                `INSERT INTO documents (content, metadata, embedding) VALUES ($1, $2, $3)`,
                [chunk, JSON.stringify({ filename: req.file.originalname }), `[${vector.join(',')}]`]
            );
        }
        res.json({ message: `Đã học xong ${chunks.length} đoạn kiến thức mới!` });

    } catch (err) { 
        console.error("Lỗi Training:", err);
        res.status(500).json({ error: "Lỗi Training: " + err.message }); 
    }
});

// API 4: Chat với AI
app.post('/api/training/chat', async (req, res) => {
    try {
        const { query } = req.body;
        const queryVector = await createEmbedding(query);

        const searchResult = await pool.query(
            `select content from match_documents($1, 0.5, 5)`,
            [`[${queryVector.join(',')}]`]
        );

        const context = searchResult.rows.map(r => r.content).join("\n---\n");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(`Dựa vào: ${context} \nTrả lời: ${query}`);
        res.json({ answer: result.response.text() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});
// --- API 5: IMPORT JOB TỪ CSV ---
app.post('/api/jobs/import', upload.single('csv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CSV' });
        
        const results = [];
        const filePath = req.file.path || req.file.buffer; // Xử lý cho cả Disk và Memory storage

        // Hàm đọc dòng CSV và xử lý
        const processStream = () => new Promise((resolve, reject) => {
            const stream = req.file.buffer 
                ? require('stream').Readable.from(req.file.buffer) // Đọc từ RAM (nếu dùng MemoryStorage)
                : fs.createReadStream(req.file.path); // Đọc từ ổ cứng

            stream
                .pipe(csv())
                .on('data', (data) => {
                    // Chuyển đổi dữ liệu CSV thành JSON tiêu chí
                    const jobData = {
                        title: data.Title || 'Vị trí chưa đặt tên',
                        requirements: {
                            skills: data.Skills ? data.Skills.split('|').map(s => s.trim()) : [],
                            experience_years: parseInt(data.Experience) || 0,
                            education: data.Education || 'Không yêu cầu',
                            description: data.Description || ''
                        },
                        status: 'active'
                    };
                    results.push(jobData);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        await processStream();

        // Lưu hàng loạt vào Database
        for (const job of results) {
            await pool.query(
                `INSERT INTO job_positions (title, requirements, status) VALUES ($1, $2, 'active')`,
                [job.title, JSON.stringify(job.requirements)]
            );
        }

        res.json({ message: `Đã nhập thành công ${results.length} vị trí tuyển dụng!` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi Import CSV: " + err.message });
    }
});

// --- API 6: LẤY DANH SÁCH JOB (Để hiển thị lên Dropdown chọn) ---
app.get('/api/jobs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM job_positions ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).send(err.message); }
});