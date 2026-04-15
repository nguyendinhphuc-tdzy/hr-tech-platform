const pdfParse = require('pdf-parse');

const STRICT_JSON_SCHEMA = `
{ 
    "full_name": "[TÊN CỦA ỨNG VIÊN TRONG CV, KHÔNG ĐƯỢC BỊA ĐẶT]", 
    "email": "[EMAIL TRONG CV, NẾU KHÔNG CÓ TRẢ VỀ NULL]", 
    "skills": ["Kỹ năng 1", "Kỹ năng 2"], 
    "score": 0.0, 
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 }, 
    "summary": "Tóm tắt 2-3 câu ngắn gọn", 
    "match_reason": "Giải thích chi tiết có dẫn chứng", 
    "recommendation": "Phỏng vấn/Cân nhắc/Loại",
    "confidence": "Cao/Trung bình/Thấp",
    "market_salary": "Thu nhập thị trường VNĐ"
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
    
    // Yêu cầu vô cùng khắt khe về JSON để đảm bảo Ollama không sinh thêm chữ dư thừa
    const prompt = `Bạn là Giám đốc tuyển dụng độc lập. 
Yêu cầu công việc: ${jobTitle} - Yêu cầu kỹ năng: ${reqSkills}

Hồ sơ ứng viên:
${cvText.substring(0, 4000)}

NHIỆM VỤ CỦA BẠN: Phát hiện chính xác Tên và Email của ứng viên trong văn bản trên. Tuyệt đối không được sử dụng dữ liệu giả (như Nguyen Van A, example.com, ...). Phân tích sâu, tính điểm (Scale 10.0), chỉ ra lập luận vào trường match_reason, BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON sau, không được phép trả về thêm bất kì chữ nào khác ngoài thẻ JSON:
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
