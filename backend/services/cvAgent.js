const STRICT_JSON_SCHEMA = `
{ 
    "full_name": "...", "email": "...", "skills": ["Skill1", "Skill2"], 
    "score": 0.0, 
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 }, 
    "summary": "Tóm tắt 2-3 câu ngắn gọn", 
    "match_reason": "Giải thích chi tiết có dẫn chứng", 
    "recommendation": "Phỏng vấn/Cân nhắc/Loại",
    "confidence": "Cao/Trung bình/Thấp",
    "market_salary": "Thu nhập thị trường: ..."
}
`;

/**
 * Giai đoạn 1: Information Extractor (Gemini 2.0 Flash)
 * Đọc file PDF và chuyển thành text.
 */
async function extractTextFromPDF(fileBuffer, mimeType, genAI) {
    console.log("-> [Agent 1] Bắt đầu đọc PDF (OCR)...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = "Hãy xuất toàn bộ văn bản trong tài liệu đính kèm ra thành markdown text rõ ràng nhất, không bỏ sót chi tiết nào.";
    
    const imageParts = [{ inlineData: { data: fileBuffer.toString("base64"), mimeType: mimeType } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    return result.response.text();
}

/**
 * Giai đoạn 2: Evaluator Agent (Ollama Qwen 2.5:7b)
 * Phân tích chuyên sâu dựa trên text đã bóc.
 */
async function evaluateCV(cvText, jobTitle, jobReqs, timeoutMs) {
    console.log("-> [Agent 2] Ollama khởi chạy đánh giá chuyên sâu...");
    const reqSkills = jobReqs?.skills ? (Array.isArray(jobReqs.skills) ? jobReqs.skills.join(", ") : jobReqs.skills) : "Kỹ năng cần thiết cho công việc này";
    
    const prompt = `Bạn là Giám đốc tuyển dụng khắt khe. 
Yêu cầu công việc (Job Title): ${jobTitle}
Yêu cầu kỹ năng/Kinh nghiệm: ${reqSkills}

Hồ sơ ứng viên (đã bóc tách văn bản):
${cvText}

Hãy suy luận từng bước (Chain of Thought):
1. Phân tích điểm mạnh (Hard skills, Soft skills).
2. Phân tích điểm yếu (Thiếu hụt kỹ năng, kinh nghiệm).
3. Đánh giá số điểm tổng quan trên thang 10.0 (Hard skills 40%, Exp 30%, Edu 10%, Soft 20%).
4. Dự đoán mức lương Benchmark thị trường.

Ghi chú: Viết bằng tiếng Việt, giải thích cặn kẽ và chặt chẽ từng luận điểm dựa vào các số liệu/năm thực tế có trong CV. Không cần xuất JSON ở bước này.`;

    const ollamaUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
    const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:7b";

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs || 60000);

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
        const output = data.message?.content || data.response || "";
        return output;

    } catch (err) {
        console.warn(`[Agent 2] Lỗi kết nối Ollama (${err.message}), Fallback sang xử lý luồng Gemini...`);
        return "[LỖI OLLAMA] Mạng nội bộ không truy cập được. Hãy tiến hành phân tích và chấm điểm hoàn toàn dựa vào kinh nghiệm của bạn.";
    }
}

/**
 * Giai đoạn 3: Synthesizer Agent (Gemini 2.0 Flash)
 * Đóng gói JSON
 */
async function synthesizeToJSON(cvText, evaluatorReasoning, genAI) {
    console.log("-> [Agent 3] Gemini 2.0 rà soát và định dạng JSON cuối...");
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
    });

    const prompt = `Phân tích dữ liệu ứng viên và đóng gói THÀNH ĐÚNG ĐỊNH DẠNG JSON SAU (không trả về gì ngoài JSON):
${STRICT_JSON_SCHEMA}

- Họ tên, Email, Kỹ năng: Lấy từ [CV GỐC].
- Kết quả điếm số, Tóm tắt, Giải thích (match_reason): Dựa chủ yếu vào lập luận của [Ý KIẾN GIÁM KHẢO OLLAMA]. Nếu Ollama bị lỗi, hãy tự đánh giá trực tiếp từ [CV GỐC].

[CV GỐC]:
${cvText.substring(0, 3000)}

[Ý KIẾN GIÁM KHẢO OLLAMA]:
${evaluatorReasoning}
`;

    const result = await model.generateContent(prompt);
    let rawJson = result.response.text();
    
    // Clean string format if necessary
    rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstOpen = rawJson.indexOf('{');
    const lastClose = rawJson.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) {
        rawJson = rawJson.substring(firstOpen, lastClose + 1);
    }
    
    return JSON.parse(rawJson);
}

/**
 * Hàm điều phối chung Workflow
 */
async function runCVAgent(fileBuffer, mimeType, jobTitle, jobReqs, genAI, timeoutMs) {
    try {
        const textEx = await extractTextFromPDF(fileBuffer, mimeType, genAI);
        const evalTxt = await evaluateCV(textEx, jobTitle, jobReqs, timeoutMs);
        const jsonResult = await synthesizeToJSON(textEx, evalTxt, genAI);
        console.log("✅ Hoàn tất Agent Workflow!");
        return jsonResult;
    } catch (err) {
        console.error("🔥 Lỗi CVAgent Workflow: ", err);
        throw err;
    }
}

module.exports = {
    runCVAgent
};
