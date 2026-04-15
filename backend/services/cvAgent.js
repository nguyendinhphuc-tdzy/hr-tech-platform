const pdfParse = require('pdf-parse');

const STRICT_JSON_SCHEMA = `
{
  "candidate_info": {
    "full_name": "[TRÍCH XUẤT CHÍNH XÁC TỪ CV. NẾU KHÔNG CÓ GHI: Không Rõ Tên]",
    "email": "[TRÍCH XUẤT TỪ CV. NẾU KHÔNG CÓ GHI: Không Rõ Email]"
  },
  "skills": ["Kỹ năng 1", "Kỹ năng 2", "Kỹ năng 3"],
  "scoring": {
    "hard_skills": 0.0,
    "experience": 0.0,
    "education": 0.0,
    "soft_skills": 0.0,
    "total_score": 0.0
  },
  "deep_analysis": {
    "match_reason_and_insights": "Đánh giá chi tiết từng hạng mục...",
    "strengths": ["Điểm mạnh 1 có số liệu", "Điểm mạnh 2"],
    "weaknesses_and_red_flags": ["Lỗ hổng 1", "Nhảy việc/Thiếu số liệu"],
    "unique_highlight": "Điểm sáng độc bản của ứng viên (USP)",
    "missing_skills": ["Kỹ năng thiếu 1", "Kỹ năng thiếu 2"]
  }
}
`;

/**
 * Giai đoạn 1: Information Extractor (Local PDF-Parse)
 * Đọc file PDF và chuyển thành text ngay trên máy server. Không dùng tới internet/Gemini.
 */
async function extractTextFromPDF(fileBuffer) {
    console.log("-> [Agent 1] Bắt đầu đọc PDF bằng thư viện cục bộ (pdf-parse)...");
    try {
        const data = await pdfParse(fileBuffer);
        return data.text;
    } catch (err) {
        console.error("Lỗi đọc PDF:", err);
        return "Không thể đọc văn bản từ PDF này. Hãy dùng văn bản thô.";
    }
}

/**
 * Giai đoạn 2: Evaluator & Synthesizer Agent (Ollama Qwen 2.5:7b)
 * Vừa gánh phần lập luận phân tích, vừa đóng gói trực tiếp ra định dạng JSON.
 */
async function evaluateAndSynthesizeCV(cvText, jobTitle, jobReqs, timeoutMs) {
    console.log("-> [Agent 2] Ollama khởi chạy đánh giá và bọc kết quả JSON...");
    const reqSkills = jobReqs?.skills ? (Array.isArray(jobReqs.skills) ? jobReqs.skills.join(", ") : jobReqs.skills) : "Kỹ năng cần thiết cho công việc này";

    // Các quy định cực kỳ nghiêm ngặt dành cho AI Local (Ollama Qwen 7B)
    const prompt = `Bạn là Giám đốc Tuyển dụng và Thẩm định Công nghệ chuyên nghiệp. Bạn đang chấm điểm ứng viên cho vị trí: ${jobTitle}.
Yêu cầu chuyên môn mặc định/mong muốn: ${reqSkills}

HƯỚNG DẪN CHẤM ĐIỂM (RUBRIC - THANG 10):
- hard_skills (Tối đa 4.0 điểm): So khớp công nghệ, platform.
- experience (Tối đa 3.0 điểm): Trải nghiệm thực tế, thực tập, dự án có số liệu.
- education (Tối đa 1.0 điểm): Bằng cấp, chứng chỉ.
- soft_skills (Tối đa 2.0 điểm): Trình bày, kỹ năng mềm.
LƯU Ý: Breakdown điểm không được vượt quá số Max quy định ở trên. Tổng điểm 'total_score' phải là tổng của 4 thành phần này (Tối đa 10.0).

QUY TẮC TRÍCH XUẤT VÀ PHÂN TÍCH CHUYÊN SÂU (CỰC KỲ QUAN TRỌNG):

1. TRÍCH XUẤT ĐỊNH DANH (STRICT EXTRACTION):
Tên (full_name) và Email (email) PHẢI nằm trong phần văn bản CV. Tuyệt đối không tự nghĩ ra tên/email giả (VD: Nguyễn Văn A, example.com). NẾU VĂN BẢN KHÔNG CÓ TÊN/EMAIL, GHI RÕ: "Không Rõ Tên" hoặc "Không Rõ Email".

2. ĐÁNH GIÁ TỔNG QUAN & LẬP LUẬN CHẤM ĐIỂM (MATCH REASON & INSIGHTS):
Khái quát tính logic của CV. Đánh giá chi tiết từng hạng mục điểm đã chấm (khen/chê rõ ràng). Đọc sát từng tác vụ, dự án ứng viên đã làm để xác nhận họ thực sự có kinh nghiệm hay chỉ đang "nhồi nhét" từ khóa.

3. PHÂN TÍCH ĐIỂM MẠNH (STRENGTHS):
Chỉ ra 2-3 điểm mạnh cốt lõi nhất của ứng viên. Phải được chứng minh bằng SỐ LIỆU (metrics), QUY MÔ DỰ ÁN, hoặc KẾT QUẢ THỰC TẾ. Không dùng các từ ngữ sáo rỗng.

4. PHÂN TÍCH ĐIỂM YẾU & RỦI RO (WEAKNESSES & RED FLAGS):
Chỉ ra hổng trong kinh nghiệm. Có employment gap bất thường không? Nhảy việc quá nhanh? Mô tả công việc thiếu chiều sâu/số liệu?

5. ĐIỂM NỔI BẬT ĐỘC BẢN (UNIQUE SELLING PROPOSITION - USP):
CV này có điểm gì thực sự sáng giá và khác biệt so với mặt bằng chung? (Tư duy hệ thống, lead team sớm, ngách công nghệ đặc thù, sở hữu dự án cá nhân ấn tượng...).

6. KỸ NĂNG/KINH NGHIỆM CÒN THIẾU (MISSING SKILLS/GAPS):
Dựa trên tiêu chuẩn vị trí, ứng viên đang hổng những kỹ năng chuyên môn/framework nào?

=== VĂN BẢN CV (RAW TEXT) ===
${cvText.substring(0, 4800)}
============================

YÊU CẦU ĐỊNH DẠNG ĐẦU RA (OUTPUT FORMAT):
Phản hồi bắt buộc phải trả về theo cấu trúc JSON dưới đây để hệ thống dễ dàng parse dữ liệu (Tất cả viết bằng Tiếng Việt):
${STRICT_JSON_SCHEMA}
`;

    const ollamaUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:7b";

    try {
        const controller = new AbortController();
        // Thời gian chờ cho Local AI lên đến 5 phút (300,000 ms) vì Qwen 7B có thể mất 1-3 phút để phân tích toàn bộ CV
        const MAX_TIMEOUT = 300000;
        const timer = setTimeout(() => controller.abort(), MAX_TIMEOUT);

        const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
                "User-Agent": "HRTech-Backend/1.0"
            },
            body: JSON.stringify({
                model: ollamaModel,
                messages: [{ role: "user", content: prompt }],
                stream: false
            }),
            signal: controller.signal
        });
        clearTimeout(timer);

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const data = await response.json();
        let rawJson = data.message?.content || data.response || "";

        // Clean chuỗi phòng trường hợp Ollama bọc JSON trong Markdown block
        rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstOpen = rawJson.indexOf('{');
        const lastClose = rawJson.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1) {
            rawJson = rawJson.substring(firstOpen, lastClose + 1);
        }

        return JSON.parse(rawJson);

    } catch (err) {
        console.error(`[Agent 2] Lỗi Ollama CV Scan:`, err.message);
        throw new Error("Ollama thất bại trong việc phân tích JSON. Xin thử lại: " + err.message);
    }
}

/**
 * Hàm điều phối chung Workflow (Ollama-Only)
 */
async function runCVAgent(fileBuffer, mimeType, jobTitle, jobReqs, genAI, timeoutMs) {
    try {
        // Tham số genAI không còn được dùng nhưng giữ nguyên signature hàm để không phải sửa nơi gọi quá nhiều
        const textEx = await extractTextFromPDF(fileBuffer);
        const jsonResult = await evaluateAndSynthesizeCV(textEx, jobTitle, jobReqs, timeoutMs);
        console.log("✅ Hoàn tất Agent Workflow (Ollama Only)!");
        return jsonResult;
    } catch (err) {
        console.error("🔥 Lỗi CVAgent Workflow: ", err);
        throw err;
    }
}

module.exports = {
    runCVAgent
};
