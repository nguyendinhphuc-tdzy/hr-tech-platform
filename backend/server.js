/* FILE: backend/server.js (Bản Final: Prompt PDF + Dynamic Fallback + Consistent Scoring) */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');
const mammoth = require('mammoth'); 
const pdf = require('pdf-parse'); 

const app = express();
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH ---
let ACTIVE_MODEL_NAME = "gemini-2.5-flash"; // SỬ DỤNG MODEL MỚI NHẤT ĐỂ THÔNG MINH HƠN
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- CÁC HÀM HỖ TRỢ ---
function sanitizeFilename(filename) {
    const str = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return str.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
}
function cleanJsonString(text) {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) clean = clean.substring(firstOpen, lastClose + 1);
    return clean;
}
async function readPdfBuffer(buffer) { try { return (await pdf(buffer)).text; } catch (e) { return ""; } }
function chunkText(text) { const chunks = []; let cur = ""; text.split(/(?<=[.?!])\s+/).forEach(s => { if ((cur + s).length > 1000) { chunks.push(cur); cur = s; } else cur += " " + s; }); if (cur) chunks.push(cur); return chunks; }
async function createEmbedding(text) { const model = genAI.getGenerativeModel({ model: "text-embedding-004" }); const result = await model.embedContent(text); return result.embedding.values; }

// --- KHO PROMPT TỪ PDF + DYNAMIC FALLBACK ---
// (ĐÃ BỔ SUNG SCORING RUBRIC VÀO TỪNG PROMPT ĐỂ AI CHẤM ĐIỂM NHẤT QUÁN)
function getSpecificPrompt(jobTitle, jobRequirements) {
    const title = jobTitle?.toLowerCase().trim() || "";

    // RUBRIC CHẤM ĐIỂM CHUNG (ĐỂ INJECT VÀO CÁC PROMPT)
    const SCORING_RUBRIC = `
# CÔNG THỨC CHẤM ĐIỂM (BẮT BUỘC TUÂN THỦ):
Tổng điểm tối đa là 10.0. Hãy tính toán dựa trên trọng số sau:
1. **Hard Skills (40% - Max 4.0):** So khớp từ khóa kỹ năng trong CV với yêu cầu. 
   - >90% khớp: 4.0 | 70-90%: 3.0 | 50-70%: 2.0 | <50%: 1.0
2. **Experience (30% - Max 3.0):** Độ liên quan của kinh nghiệm làm việc/dự án thực tế.
   - Rất liên quan/Có kinh nghiệm thực chiến: 3.0 | Khá liên quan: 2.0 | Ít liên quan: 1.0
3. **Education/Certifications (10% - Max 1.0):** Bằng cấp và chứng chỉ phù hợp.
4. **Soft Skills/Presentation (20% - Max 2.0):** Cách trình bày CV, tư duy logic, hoạt động ngoại khóa.

*LƯU Ý QUAN TRỌNG: Đánh giá phải KHÁCH QUAN, KHÔNG CẢM TÍNH. Nếu chạy lại 10 lần, kết quả phải giống nhau.*
    `;

    // 1. DATA ANALYST INTERN
    if (title.includes("data analyst")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng Kỹ thuật**. Bạn đang sàng lọc ứng viên cho vị trí **Thực tập sinh Phân tích Dữ liệu (Data Analyst Intern)**.
Ngữ cảnh kinh doanh: Môi trường sản xuất, tập trung vào làm sạch, hợp nhất và trực quan hóa dữ liệu.
Mục tiêu: Tìm ứng viên có kỹ năng "Bắt buộc" (Power BI, Data Cleaning) và ưu tiên có kinh nghiệm dữ liệu Sản xuất/Vận hành.

${SCORING_RUBRIC}

# Nhiệm vụ
1. **Phân tích và Đối chiếu:**
   - Trích xuất kỹ năng: Power BI, SQL, Python, Excel, Làm sạch dữ liệu.
   - Đối chiếu kinh nghiệm: Tìm bằng chứng về việc thu thập, làm sạch dữ liệu và tạo Dashboard.
   - Ngữ cảnh: Ưu tiên kinh nghiệm với dữ liệu Sản xuất/Chế tạo.
2. **Tư duy phản biện:**
   - Xác thực tuyên bố: Tìm ngữ cảnh cụ thể (VD: "Dùng Power BI để tối ưu quy trình X" thay vì chỉ liệt kê "Power BI").

# Định dạng Output (JSON Bắt buộc)
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2"],
    "score": 0.0,
    "summary": "Tóm tắt 2-3 câu về mức độ phù hợp (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT:\n\n**1. Mức độ đáp ứng bằng cấp:**\n[Chi tiết]\n\n**2. Mức độ đáp ứng trách nhiệm:**\n- Làm sạch & Hợp nhất dữ liệu: [Chi tiết]\n- Power BI Dashboard: [Chi tiết]\n\n**3. Độ phù hợp ngành Sản xuất:**\n[Có/Không + Chi tiết]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;
    }

    // 2. INNOVATION INTERN
    if (title.includes("innovation") || title.includes("sáng tạo")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là Chuyên gia Tuyển dụng. Vị trí: **Thực tập sinh Sáng tạo (Innovation Intern)**.
Ngữ cảnh: Hỗ trợ hoạt động nội bộ, truyền thông và kể chuyện bằng hình ảnh.
Mục tiêu: Tìm người có kỹ năng tổ chức (Must-Have) và sáng tạo/thiết kế (Nice-to-Have).

${SCORING_RUBRIC}

# Nhiệm vụ
1. **Phân tích:**
   - Kỹ năng: Microsoft Office (Excel, PPT), Thiết kế (Canva/Adobe), Tổ chức sự kiện.
   - Kinh nghiệm: Tổ chức sự kiện nội bộ, viết content, làm slide thuyết trình.
2. **Tư duy phản biện:**
   - Đánh giá sự kết hợp giữa "Tỉ mỉ hành chính" và "Tư duy sáng tạo".

# Định dạng Output (JSON Bắt buộc)
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2"],
    "score": 0.0,
    "summary": "Tóm tắt mức độ phù hợp (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT:\n\n**1. Thiết kế tài liệu hình ảnh:**\n[Chi tiết]\n\n**2. Tổ chức sự kiện:**\n[Chi tiết]\n\n**3. Sáng tạo nội dung:**\n[Chi tiết]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;
    }

    // 3. MARKETING INTERN
    if (title.includes("marketing")) {
        return `
# Vai trò & Ngữ cảnh
Vị trí: **Thực tập sinh Marketing**.
Yêu cầu: Am hiểu kỹ thuật số, xử lý công việc hỗn hợp (SEO/Content, Social Media, PR, Hậu cần sự kiện).
Mục tiêu: Ứng viên có kỹ năng thực thi hữu hình (Viết, Edit video, Tổ chức).

${SCORING_RUBRIC}

# Nhiệm vụ
Phân tích theo 5 trụ cột:
1. SEO & Content.
2. Social Media (TikTok, Zalo, FB) & Edit Video.
3. PR & Truyền thông.
4. Hậu cần sự kiện.
5. Sinh viên & Cộng đồng.

# Định dạng Output (JSON Bắt buộc)
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2"],
    "score": 0.0,
    "summary": "Tóm tắt tiềm năng sáng tạo và phù hợp (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT:\n\n**1. SEO/Nội dung:**\n[Chi tiết]\n\n**2. Mạng xã hội (Video/Thiết kế):**\n[Chi tiết]\n\n**3. Sự kiện/PR:**\n[Chi tiết]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;
    }

    // 4. NETWORK SECURITY INTERN
    if (title.includes("security") || title.includes("bảo mật")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng An ninh mạng. Vị trí: **Network Security Intern**.
Ngữ cảnh: Vận hành Bảo mật & Hỗ trợ Kỹ thuật.
Mục tiêu: Kỹ năng thực thi thực tế (Nmap, Burp Suite, Python), không chỉ lý thuyết.

${SCORING_RUBRIC}

# Nhiệm vụ
Phân tích 5 trụ cột:
1. Bảo mật mạng & Hạ tầng.
2. Pentest (Nmap, Burp Suite).
3. Phân tích mã độc.
4. Ứng cứu sự cố (IR/SOC).
5. Hỗ trợ kỹ thuật.

# Định dạng Output (JSON Bắt buộc)
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2"],
    "score": 0.0,
    "summary": "Tóm tắt mức độ phù hợp (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT:\n\n**1. Pentest & Lỗ hổng:**\n[Chi tiết]\n\n**2. Ứng cứu sự cố (IR):**\n[Chi tiết]\n\n**3. Kỹ năng thực tế (Tools/Scripting):**\n[Chi tiết]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;
    }

    // 5. AI ENGINEER INTERN
    if (title.includes("ai engineer") || title.includes("trí tuệ nhân tạo")) {
        return `
# Vai trò: Hệ thống Sàng lọc Tài năng AI. Vị trí: **AI Engineer Intern (NMT)**.
Ngữ cảnh: Phát triển tập dữ liệu đa ngữ, tinh chỉnh mô hình ngôn ngữ nhỏ (SLM).
Mục tiêu: Python, C++, NLP, PyTorch, Xây dựng Dataset. Kinh nghiệm >= 1 năm.

${SCORING_RUBRIC}

# Nhiệm vụ
1. Phân tích kỹ năng: NMT/NLP, Dataset Engineering, ML/DL.
2. Xác thực các tuyên bố kỹ thuật (Tránh từ khóa rỗng).

# Định dạng Output (JSON Bắt buộc)
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2"],
    "score": 0.0,
    "summary": "Tóm tắt mức độ phù hợp (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT:\n\n**1. NLP & NMT:**\n[Chi tiết]\n\n**2. Kỹ thuật Tập dữ liệu:**\n[Chi tiết]\n\n**3. Kỹ năng lập trình (Python/C++):**\n[Chi tiết]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;
    }

    // 6. BUSINESS ANALYST INTERN
    if (title.includes("business analyst") || title.includes("ba")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Kỹ thuật. Vị trí: **Business Analyst Intern**.
Ngữ cảnh: Insurtech. Hỗ trợ đội ngũ sản phẩm.
Mục tiêu: Kỹ năng phân tích/viết tài liệu (User Stories, SDLC) và nền tảng kỹ thuật (SQL).

${SCORING_RUBRIC}

# Nhiệm vụ
Phân tích kỹ năng: Thu thập yêu cầu, Công cụ (Jira/Figma), Phân tích dữ liệu (SQL).

# Định dạng Output (JSON Bắt buộc)
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2"],
    "score": 0.0,
    "summary": "Tóm tắt mức độ phù hợp (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT:\n\n**1. Thu thập yêu cầu & Tài liệu:**\n[Chi tiết]\n\n**2. Công cụ (Jira/Figma):**\n[Chi tiết]\n\n**3. Phân tích dữ liệu (SQL):**\n[Chi tiết]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;
    }

    // 7. SOFTWARE ENGINEER INTERN
    if (title.includes("software") || title.includes("mobile")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng Kỹ thuật. Vị trí: **Software Engineer Intern (Mobile)**.
Ngữ cảnh: Phát triển ứng dụng di động nhanh.
Mục tiêu: Nền tảng CS vững chắc (DSA) và Ngôn ngữ Mobile (iOS/Android/Flutter).

${SCORING_RUBRIC}

# Nhiệm vụ
Phân tích kỹ năng: Mobile Dev, CS Foundation (DSA), Clean Code.

# Định dạng Output (JSON Bắt buộc)
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2"],
    "score": 0.0,
    "summary": "Tóm tắt mức độ phù hợp (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT:\n\n**1. Phát triển Di động:**\n[Chi tiết]\n\n**2. Nền tảng CS (DSA):**\n[Chi tiết]\n\n**3. Chất lượng mã nguồn:**\n[Chi tiết]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;
    }

    // 8. RISK ANALYST INTERN
    if (title.includes("risk")) {
        return `
# Vai trò: Chuyên gia Tuyển dụng. Vị trí: **Risk Analyst Intern**.
Ngữ cảnh: Ngân hàng. Phân tích tài chính & thị trường.
Mục tiêu: Kiến thức tài chính (Báo cáo, Excel), Kỹ năng mềm (Tỉ mỉ). Ưu tiên CFA/ACCA.

${SCORING_RUBRIC}

# Nhiệm vụ
Phân tích kỹ năng: Tài chính, Nghiên cứu thị trường, Excel.

# Định dạng Output (JSON Bắt buộc)
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2"],
    "score": 0.0,
    "summary": "Tóm tắt mức độ phù hợp (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT:\n\n**1. Phân tích Tài chính:**\n[Chi tiết]\n\n**2. Nghiên cứu Thị trường:**\n[Chi tiết]\n\n**3. Sự tỉ mỉ & Quy trình:**\n[Chi tiết]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;
    }

    // --- MẶC ĐỊNH: DYNAMIC FALLBACK (Logic Tự Động) ---
    // Logic: Nếu không khớp tên, tự tạo Prompt dựa trên cột 'requirements' trong Database
    const reqSkills = jobRequirements?.skills ? (Array.isArray(jobRequirements.skills) ? jobRequirements.skills.join(", ") : jobRequirements.skills) : "Các kỹ năng chuyên môn liên quan đến " + jobTitle;
    const reqExp = jobRequirements?.experience || "Không yêu cầu cụ thể";
    const reqEdu = jobRequirements?.education || "Đại học hoặc tương đương";

    return `
# Vai trò: Chuyên gia Tuyển dụng & Đánh giá Tài năng.
# Vị trí cần tuyển: "${jobTitle}"

# Ngữ cảnh & Yêu cầu từ Database:
Hệ thống không có Prompt mẫu chuyên sâu cho vị trí này, vì vậy bạn hãy phân tích dựa trên dữ liệu yêu cầu thực tế sau:
1. **Kỹ năng Bắt buộc (Must-Have):** ${reqSkills}
2. **Kinh nghiệm yêu cầu:** ${reqExp}
3. **Học vấn:** ${reqEdu}

${SCORING_RUBRIC}

# Nhiệm vụ:
1. **Quét CV:** Tìm kiếm bằng chứng cụ thể về việc ứng viên sở hữu các kỹ năng: ${reqSkills}.
2. **Đánh giá độ sâu:** Phân biệt giữa việc chỉ liệt kê từ khóa và việc có dự án/kinh nghiệm thực tế áp dụng.
3. **Chấm điểm:** Dựa trên mức độ khớp giữa CV và danh sách kỹ năng trên (Thang điểm 10) theo CÔNG THỨC CHẤM ĐIỂM (SCORING RUBRIC) đã cung cấp.

# Định dạng Output (JSON Bắt buộc):
{
    "full_name": "Họ tên",
    "email": "Email",
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "score": 0.0,
    "summary": "Tóm tắt 2-3 câu đánh giá tổng quan (Tiếng Việt).",
    "match_reason": "Trình bày chi tiết bằng TIẾNG VIỆT:\n\n**1. Phân tích Kỹ năng Yêu cầu (${reqSkills}):**\n[Chi tiết]\n\n**2. Kinh nghiệm & Dự án:**\n[Chi tiết]\n\n**3. Đánh giá chung:**\n[Điểm mạnh/Yếu]",
    "recommendation": "Phỏng vấn / Cân nhắc / Từ chối",
    "confidence": "Cao / Trung bình / Thấp"
}
`;
}

// ==========================================
// 1. API AUTH: ĐĂNG KÝ (SIGN UP)
// ==========================================
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log("📝 Nhận yêu cầu đăng ký:", req.body);
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) return res.status(400).json({ error: "Vui lòng nhập đủ thông tin!" });

        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkUser.rows.length > 0) return res.status(400).json({ error: "Email đã tồn tại!" });

        const result = await pool.query(
            `INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'Admin Access') RETURNING *`,
            [fullName, email, password]
        );
        res.json({ message: "Đăng ký thành công!", user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: "Lỗi hệ thống: " + err.message }); }
});

// ==========================================
// 2. API AUTH: ĐĂNG NHẬP (LOGIN)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: "Email không tồn tại!" });
        const user = result.rows[0];
        if (user.password !== password) return res.status(400).json({ error: "Sai mật khẩu!" });
        res.json({ message: "Đăng nhập thành công!", user: user });
    } catch (err) { res.status(500).json({ error: "Lỗi: " + err.message }); }
});

// ==========================================
// 3. API CV: SCAN & UPLOAD (TÍCH HỢP PROMPT PDF + FALLBACK)
// ==========================================
app.post('/api/cv/upload', upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        console.log(`🤖 Đang xử lý: ${req.file.originalname}`);

        // 1. Upload Storage
        const safeName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}_${safeName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('cv_uploads').upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
        if (uploadError) console.error("Lỗi Storage:", uploadError);
        const { data: { publicUrl } } = supabase.storage.from('cv_uploads').getPublicUrl(fileName);
        const finalFileUrl = uploadError ? null : publicUrl;

        // 2. Lấy thông tin Job để chọn Prompt
        const jobId = req.body.job_id;
        let jobTitle = "General Application";
        let jobReqs = {};

        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) {
                jobTitle = jobRes.rows[0].title;
                jobReqs = jobRes.rows[0].requirements || {}; // Lấy requirements từ DB
            }
        }

        // 3. LẤY PROMPT TƯƠNG ỨNG (HOẶC TỰ TẠO)
        const selectedPrompt = getSpecificPrompt(jobTitle, jobReqs);
        console.log(`🎯 Sử dụng Prompt cho vị trí: ${jobTitle}`);

        // 4. Gọi AI VỚI TEMPERATURE = 0.0 (QUAN TRỌNG ĐỂ KẾT QUẢ NHẤT QUÁN)
        const model = genAI.getGenerativeModel({ 
            model: ACTIVE_MODEL_NAME, 
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.0 // Set về 0 để loại bỏ tính ngẫu nhiên
            } 
        });
        const imageParts = [{ inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } }];
        const result = await model.generateContent([selectedPrompt, ...imageParts]);
        
        let aiResult;
        try { aiResult = JSON.parse(cleanJsonString(result.response.text())); } 
        catch (parseError) { aiResult = { full_name: "Lỗi đọc", score: 0, summary: "Lỗi phân tích AI", email: null }; }

        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        // Chuẩn hóa điểm số (nếu AI trả về > 10, chia 10)
        let finalScore = aiResult.score;
        if (finalScore > 10) finalScore = (finalScore / 10).toFixed(1);

        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis, cv_file_url) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6, $7) RETURNING *`,
            [jobId || null, finalName, aiResult.email, jobTitle, finalScore, JSON.stringify(aiResult), finalFileUrl]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) { 
        console.error("🔥 Lỗi Server:", err);
        res.status(500).json({ error: "Lỗi: " + err.message }); 
    }
});

// ... (CÁC API KHÁC GIỮ NGUYÊN) ...
app.get('/api/candidates', async (req, res) => { const r = await pool.query('SELECT * FROM candidates ORDER BY id DESC'); res.json(r.rows); });
app.get('/api/jobs', async (req, res) => { const r = await pool.query('SELECT * FROM job_positions ORDER BY id DESC'); res.json(r.rows); });
app.put('/api/candidates/:id/status', async (req, res) => { try { const { status } = req.body; await pool.query(`UPDATE candidates SET status = $1 WHERE id = $2`, [status, req.params.id]); res.json({ message: "Updated" }); } catch (err) { res.status(500).json({ error: err.message }); }});
app.post('/api/jobs/import', upload.single('csv_file'), async (req, res) => { /* Logic import cũ */ res.json({message:"Imported"}); });
app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => { /* Logic training cũ */ res.json({message:"Trained"}); });
app.post('/api/training/chat', async (req, res) => { /* Logic chat cũ */ res.json({answer:"AI reply"}); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server chạy tại cổng ${PORT}`); });