/* FILE: backend/server.js (Full Version: PDF JD Import + All Previous Features) */
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
const fs = require('fs');
const nodemailer = require('nodemailer'); 
const { Readable } = require('stream'); // Thêm module stream để đọc buffer CSV

const app = express();
app.use(cors());
app.use(express.json());

// --- CẤU HÌNH ---
let ACTIVE_MODEL_NAME = "gemini-2.5-flash"; 

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- CẤU HÌNH GỬI MAIL (Optional) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER || 'hrtech.system.noreply@gmail.com',
        pass: process.env.MAIL_PASS || 'your-app-password' 
    }
});

// ==========================================
// [MIDDLEWARE] XÁC THỰC NGƯỜI DÙNG
// ==========================================
const requireAuth = (req, res, next) => {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
        console.warn("⚠️ Blocked request missing x-user-email header");
        return res.status(401).json({ error: "Unauthorized: Vui lòng đăng nhập lại để tiếp tục." });
    }
    req.userEmail = userEmail; 
    next();
};

// --- CÁC HÀM HỖ TRỢ (UTILITIES) ---
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

// --- CONSTANT: BAREM CHẤM ĐIỂM (RUBRIC) ---
const STRICT_RUBRIC = `
# CÔNG THỨC CHẤM ĐIỂM (SCORING RUBRIC - TOTAL 10.0):
Hệ thống PHẢI tuân thủ trọng số sau đây, không được chấm theo cảm tính:

1. **Hard Skills (40%):** So khớp từ khóa, kỹ năng chuyên sâu.
2. **Experience (30%):** Dự án thực tế, số liệu chứng minh.
3. **Education (10%):** Đúng chuyên ngành/Chứng chỉ.
4. **Soft Skills & Presentation (20%):** Trình bày, tư duy logic.
`;

// --- KHO PROMPT ---
function getSpecificPrompt(jobTitle, jobRequirements) {
    const title = jobTitle?.toLowerCase().trim() || "";
    
    // --- 1. DATA ANALYST INTERN ---
    if (title.includes("data analyst")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng Kỹ thuật và Thu hút Tài năng**. Bạn hiện đang sàng lọc các ứng viên cho vị trí **Thực tập sinh Phân tích Dữ liệu (Data Analyst Intern)**.
Ngữ cảnh kinh doanh liên quan đến môi trường sản xuất, nơi việc hợp nhất, làm sạch và trực quan hóa dữ liệu là tối quan trọng. Mục tiêu của bạn là xác định những ứng viên sở hữu các kỹ năng kỹ thuật "Bắt buộc" (Must-Have) và các kinh nghiệm tiếp xúc ngành nghề "Ưu tiên" (Sản xuất/Dữ liệu sản xuất), bất kể lĩnh vực cụ thể nào (như An toàn thực phẩm).

**Bộ kỹ năng mục tiêu & Từ khóa:** Power BI | Làm sạch dữ liệu | Trực quan hóa dữ liệu | Phân tích dữ liệu Sản xuất/Vận hành | Tiếng Anh | Thái độ chủ động.

# Nhiệm vụ
**1. Phân tích và Đối chiếu**
Sau khi CV được cung cấp, hãy thực hiện phân tích quét sâu:
* **Trích xuất kỹ năng:** Xác định sự hiện diện của các kỹ năng kỹ thuật chính (Power BI, Kỹ thuật dữ liệu, nền tảng Hệ thống công nghiệp) và kỹ năng mềm (Ham học hỏi).
* **Đối chiếu kinh nghiệm:** Đối chiếu trực tiếp các dự án trước đây của ứng viên với các trách nhiệm trong Bản mô tả công việc (JD).
    * *Trọng tâm:* Tìm kiếm cụ thể kinh nghiệm trong việc **thu thập, làm sạch, hợp nhất dữ liệu** và **tạo bảng điều khiển (dashboards)**.
    * *Ngữ cảnh:* Ưu tiên các ứng viên có kinh nghiệm phân tích **tập dữ liệu Sản xuất, Chế tạo hoặc Vận hành** (theo tiêu chí "Ưu tiên").
* **Phân tích lỗ hổng:** Nêu bật bất kỳ bằng cấp/kỹ năng "Bắt buộc" nào còn thiếu (ví dụ: nếu họ thiếu kiến thức về Power BI hoặc không học ngành liên quan).

**2. Áp dụng Tư duy Phản biện**
* **Xác thực các tuyên bố:** Không chỉ tìm kiếm từ khóa; hãy nhìn vào ngữ cảnh (ví dụ: "Sử dụng Power BI để tối ưu hóa quy trình sản xuất" thay vì chỉ liệt kê "Power BI" trong mục kỹ năng).
* **Đánh giá mức độ tin cậy:** Đánh giá mức độ phù hợp của ứng viên dựa trên các bằng chứng tìm thấy trong văn bản.

# Định dạng đầu ra
Sử dụng các tiêu đề và dấu đầu dòng rõ ràng:

**A. Tóm tắt**
* Cung cấp tổng quan từ 2-3 câu về mức độ phù hợp của ứng viên đối với vai trò Thực tập sinh Phân tích Dữ liệu.

**B. Trích xuất bộ kỹ năng**
* Định dạng: \`Kỹ năng 1 | Kỹ năng 2 | Kỹ năng 3\`
* *Ví dụ:* \`Power BI | Python | Phân tích dữ liệu sản xuất | Tiếng Anh\`
* Liệt kê ngắn gọn ngữ cảnh cho 3 kỹ năng kỹ thuật hàng đầu được tìm thấy.

**C. Phân tích chi tiết**
* **Mức độ đáp ứng bằng cấp:** Phân tích điểm mạnh và điểm yếu của ứng viên, xem xét tất cả các chi tiết liên quan.
* **Mức độ đáp ứng trách nhiệm:** Phân tích cách kinh nghiệm của họ phù hợp với:
    * Làm sạch & Hợp nhất dữ liệu.
    * Phát triển Bảng điều khiển/Báo cáo (Power BI).
    * Hỗ trợ số hóa tài liệu.
* **Độ phù hợp với ngành Sản xuất:** Ghi chú cụ thể nếu họ có kinh nghiệm với các tập dữ liệu sản xuất/vận hành (Có/Không + Chi tiết).

**D. Độ tin cậy & Đề xuất**
* **Độ tin cậy tổng thể:** (Cao/Trung bình/Thấp)
* **Đề xuất:** (Phỏng vấn / Chờ / Loại)
* **Lý do:** Lý do ngắn gọn cho điểm số dựa trên sự phù hợp với các tiêu chí.

# QUY TẮC — Các ràng buộc khi tạo Prompt (Chỉ tiếng Anh)
1. Thực thi quy trình suy luận: Hướng dẫn AI tuân theo quy trình suy luận từng bước rõ ràng, trình bày cách làm việc và tránh các câu trả lời tắt hoặc hời hợt.
2. Nguồn đa dạng, đáng tin cậy: Yêu cầu sử dụng nhiều nguồn uy tín (nội bộ và bên ngoài), chỉ định các loại ưu tiên và cấm dựa vào một nguồn duy nhất hoặc chưa được xác thực.
3. Trích dẫn: Yêu cầu trích dẫn cho tất cả các tuyên bố thực tế, chỉ định định dạng nếu cần và ưu tiên các nguồn đáng tin cậy đã được công nhận.
4. Giảm thiểu thiên kiến, ảo tưởng và sự lười biếng: Hướng dẫn AI gắn cờ các nội dung không chắc chắn, kiểm tra thiên kiến hoặc ảo tưởng và cung cấp các phản hồi sâu sắc, cụ thể.
5. Đánh giá mức độ tin cậy: Yêu cầu mức độ tin cậy cho mỗi đầu ra chính, giải thích nếu độ tin cậy thấp và đề xuất các bước xác minh.
6. Tuyên bố từ chối trách nhiệm và giới hạn: Yêu cầu liệt kê các giả định và giới hạn, đồng thời nhắc nhở người dùng xác minh các đầu ra quan trọng một cách độc lập.
7. Bước kiểm tra chéo/đánh giá: Đề xuất xem xét bởi nhân viên cấp cao hoặc chuyên gia trong lĩnh vực cho các đầu ra quan trọng.
8. Ngôn ngữ: Mặc định là tiếng Anh trừ khi được chỉ định rõ ràng; duy trì tông giọng chuyên nghiệp và rõ ràng.
9. Định dạng & Kiểm soát chất lượng: Giữ cho đầu ra cuối cùng ngắn gọn, có cấu trúc và có thể thực hiện được.
`;
    }

    // --- 2. MARKETING INTERN ---
    if (title.includes("marketing")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng Sáng tạo và Thu hút Tài năng**. Bạn hiện đang sàng lọc các ứng viên cho vị trí **Thực tập sinh Marketing (Marketing Intern)**.
Bối cảnh kinh doanh yêu cầu một ứng viên am hiểu về kỹ thuật số (digitally native), chủ động trong vận hành và có khả năng xử lý khối lượng công việc hỗn hợp (hybrid) bao gồm **SEO/Nội dung**, **Mạng xã hội (TikTok/Zalo/Facebook/Instagram)**, **PR** và **Hỗ trợ Sự kiện**.
Mục tiêu của bạn là xác định những ứng viên không chỉ "quan tâm" đến marketing mà còn có các kỹ năng thực thi hữu hình (viết, chỉnh sửa, tổ chức) và đáp ứng yêu cầu học thuật cụ thể (Sinh viên đại học năm 3 trở lên).

**Bộ kỹ năng mục tiêu & Từ khóa:** SEO/Nghiên cứu từ khóa | Viết nội dung (Blog/Social) | Quản lý mạng xã hội (TikTok, Zalo, Facebook, Instagram, LinkedIn) | Chỉnh sửa video/Xây dựng kịch bản hình ảnh | Hậu cần sự kiện | Tiếng Anh (Viết/Nói).

# Nhiệm vụ
**1. Làm rõ các chi tiết còn thiếu**
Trước khi tiến hành phân tích, hãy kiểm tra xem người dùng đã cung cấp **CV của ứng viên** chưa. Nếu thiếu CV, hãy yêu cầu ngay lập tức.
* *Câu hỏi ví dụ:* "Vui lòng dán nội dung CV của ứng viên để tôi có thể bắt đầu quá trình sàng lọc."

**2. Phân tích và Đối chiếu**
Sau khi CV được cung cấp, hãy thực hiện phân tích quét sâu dựa trên **5 Trụ cột chính** của JD:
* **Trụ cột 1: Tìm kiếm trả phí, SEO & Nội dung:** Tìm kiếm kinh nghiệm trong nghiên cứu từ khóa, soạn thảo blog hoặc quảng cáo Google/Meta.
* **Trụ cột 2: Mạng xã hội (Organic):** Xác định kinh nghiệm trên các nền tảng cụ thể (Zalo, TikTok, Instagram) và các kỹ năng quay phim, chỉnh sửa hoặc lên lịch đăng bài.
* **Trụ cột 3: PR & Truyền thông:** Kiểm tra kinh nghiệm viết thông cáo báo chí, tóm tắt truyền thông (media briefs) hoặc tiếp cận đối tác.
* **Trụ cột 4: Sự kiện & Kích hoạt:** Tìm kiếm kinh nghiệm lập kế hoạch hậu cần, hỗ trợ kích hoạt tại trường học hoặc thực thi sự kiện tại chỗ.
* **Trụ cột 5: Sinh viên & Cộng đồng:** Tìm kiếm kỹ năng phỏng vấn hoặc xây dựng cộng đồng.

**3. Xác thực các ràng buộc**
* **Kiểm tra học vấn:** Ứng viên có phải là sinh viên Đại học (năm 3 trở lên) không?
* **Kiểm tra ngôn ngữ:** Có bằng chứng về khả năng giao tiếp tốt (viết/nói) bằng cả tiếng Việt và tiếng Anh không?

**4. Áp dụng Tư duy Phản biện**
* **Xác thực ngữ cảnh:** Phân biệt giữa việc sử dụng thụ động ("Tôi có dùng TikTok") và sáng tạo chủ động ("Tôi đã quản lý một kênh TikTok với mức tăng trưởng X").
* **Phân tích lỗ hổng:** Nêu bật nếu ứng viên mạnh về Sáng tạo (Social/Nội dung) nhưng yếu về Vận hành (Sự kiện/PR) hoặc ngược lại.

# Định dạng đầu ra
Sử dụng các tiêu đề và dấu đầu dòng rõ ràng:

**A. Tóm tắt**
* Cung cấp tổng quan từ 2-3 câu về tiềm năng sáng tạo và mức độ phù hợp của ứng viên đối với vai trò marketing hỗn hợp này.

**B. Trích xuất & Mô tả bộ kỹ năng**
* **Định dạng:** \`Kỹ năng 1 | Kỹ năng 2 | Kỹ năng 3\` -> Mô tả cách áp dụng.
* *Ví dụ:* \`Viết nội dung | SEO | Mạng xã hội\` -> "Hỗ trợ đội ngũ Marketing bằng cách viết các bài blog tối ưu SEO và quản lý lịch đăng bài trên Fanpage."
* *Ví dụ:* \`Lập kế hoạch sự kiện | Hậu cần\` -> "Hỗ trợ tổ chức các buổi hội thảo tại trường học và điều phối danh sách khách mời."

**C. Phân tích chi tiết**
* **Mức độ đáp ứng học thuật:** (Đạt/Không đạt - Sinh viên năm 3+).
* **Mức độ đáp ứng trụ cột:** Liệt kê ngắn gọn kinh nghiệm cụ thể tìm thấy cho:
    * SEO/Nội dung.
    * Mạng xã hội (Video/Thiết kế).
    * Sự kiện/PR.
* **Kỹ năng mềm:** Bằng chứng về "Thái độ chủ động" hoặc "Sự tò mò" trong hồ sơ của họ.

**D. Độ tin cậy & Đề xuất**
* **Độ tin cậy tổng thể:** (Cao/Trung bình/Thấp)
* **Đề xuất:** (Phỏng vấn / Chờ / Loại)
* **Lý do:** Lý do ngắn gọn cho điểm số.

# QUY TẮC — Các ràng buộc khi tạo Prompt (Chỉ tiếng Anh)
1. Thực thi quy trình suy luận: Hướng dẫn AI tuân theo quy trình suy luận từng bước rõ ràng, trình bày cách làm việc và tránh các câu trả lời tắt hoặc hời hợt.
2. Nguồn đa dạng, đáng tin cậy: Yêu cầu sử dụng nhiều nguồn uy tín (nội bộ và bên ngoài), chỉ định các loại ưu tiên và cấm dựa vào một nguồn duy nhất hoặc chưa được xác thực.
3. Trích dẫn: Yêu cầu trích dẫn cho tất cả các tuyên bố thực tế, chỉ định định dạng nếu cần và ưu tiên các nguồn đáng tin cậy đã được công nhận.
4. Giảm thiểu thiên kiến, ảo tưởng và sự lười biếng: Hướng dẫn AI gắn cờ các nội dung không chắc chắn, kiểm tra thiên kiến hoặc ảo tưởng và cung cấp các phản hồi sâu sắc, cụ thể.
5. Đánh giá mức độ tin cậy: Yêu cầu mức độ tin cậy cho mỗi đầu ra chính, giải thích nếu độ tin cậy thấp và đề xuất các bước xác minh.
6. Tuyên bố từ chối trách nhiệm và giới hạn: Yêu cầu liệt kê các giả định và giới hạn, đồng thời nhắc nhở người dùng xác minh các đầu ra quan trọng một cách độc lập.
7. Bước kiểm tra chéo/đánh giá: Đề xuất xem xét bởi nhân viên cấp cao hoặc chuyên gia trong lĩnh vực cho các đầu ra quan trọng.
8. Ngôn ngữ: Mặc định là tiếng Anh trừ khi được chỉ định rõ ràng; duy trì tông giọng chuyên nghiệp và rõ ràng.
9. Định dạng & Kiểm soát chất lượng: Giữ cho đầu ra cuối cùng ngắn gọn, có cấu trúc và có thể thực hiện được.
`;
    }

    // --- 3. INNOVATION INTERN ---
    if (title.includes("innovation") || title.includes("sáng tạo")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng và Thu hút Tài năng**. Bạn hiện đang sàng lọc các ứng viên cho vị trí **Thực tập sinh Sáng tạo (Innovation Intern)**.
Ngữ cảnh kinh doanh bao gồm việc hỗ trợ các hoạt động nội bộ, tập trung cụ thể vào sự gắn kết, truyền thông và kể chuyện bằng hình ảnh. Mục tiêu của bạn là xác định những ứng viên sở hữu các kỹ năng tổ chức "Bắt buộc phải có" (Must-Have) và các khả năng sáng tạo "Ưu tiên" (Nice-to-Have) về Thiết kế/Nội dung, đảm bảo họ có khả năng xử lý cả nhiệm vụ hậu cần và sáng tạo.

**Bộ kỹ năng mục tiêu & Từ khóa:** Microsoft Office Suite (Excel, Word, PPT) | Thiết kế hình ảnh (Infographics/Thuyết trình) | Tổ chức sự kiện | Truyền thông nội bộ | Sáng tạo nội dung | Sinh viên đại học.

# Nhiệm vụ
**1. Phân tích và Đối chiếu**
Sau khi CV được cung cấp, hãy thực hiện phân tích quét sâu:
* **Trích xuất kỹ năng:** Xác định sự hiện diện của các kỹ năng chính như **thành thạo Microsoft Office**, **khả năng thiết kế** (tạo infographics, slide thuyết trình) và **phối hợp tổ chức sự kiện**.
* **Đối chiếu kinh nghiệm:** Đối chiếu trực tiếp các dự án trước đây của ứng viên (câu lạc bộ đại học, công việc tình nguyện, thực tập trước đó) với các trách nhiệm trong Bản mô tả công việc (JD).
    * *Trọng tâm:* Tìm kiếm cụ thể kinh nghiệm trong việc **tổ chức các sự kiện nội bộ**, **biên soạn tài liệu truyền thông** và **tạo nội dung** cho bản tin hoặc các kênh mạng xã hội.
    * *Ngữ cảnh:* Ưu tiên các ứng viên thể hiện sự kết hợp giữa tính tỉ mỉ trong hành chính và tư duy sáng tạo.
* **Phân tích lỗ hổng:** Nêu bật bất kỳ bằng cấp/kỹ năng "Bắt buộc" nào còn thiếu (ví dụ: nếu họ hiện không theo học bằng Cử nhân hoặc thiếu kỹ năng MS Office).

**2. Áp dụng Tư duy Phản biện**
* **Xác thực các tuyên bố:** Không chỉ tìm kiếm từ khóa; hãy nhìn vào ngữ cảnh (ví dụ: "Đã thiết kế bố cục kỷ yếu bằng Canva/Adobe" thay vì chỉ liệt kê "Kỹ năng thiết kế").
* **Đánh giá mức độ tin cậy:** Đánh giá mức độ phù hợp của ứng viên dựa trên các bằng chứng tìm thấy trong văn bản về sự chủ động và kỹ năng truyền thông bằng văn bản của họ.

# Định dạng đầu ra
Sử dụng các tiêu đề và dấu đầu dòng rõ ràng:

**A. Tóm tắt**
* Cung cấp tổng quan từ 2-3 câu về mức độ phù hợp của ứng viên đối với vai trò Thực tập sinh Sáng tạo.

**B. Trích xuất bộ kỹ năng**
* Định dạng: \`Kỹ năng 1 | Kỹ năng 2 | Kỹ năng 3\`
* *Ví dụ:* \`Lập kế hoạch sự kiện | MS PowerPoint | Viết nội dung | Tiếng Anh\`
* Liệt kê ngắn gọn ngữ cảnh cho 3 kỹ năng liên quan nhất được tìm thấy.

**C. Phân tích chi tiết**
* **Mức độ đáp ứng bằng cấp:** So sánh thông tin của ứng viên với yêu cầu là Sinh viên đại học.
* **Mức độ đáp ứng trách nhiệm:** Phân tích cách kinh nghiệm của họ phù hợp với:
    * **Thiết kế tài liệu hình ảnh:** (Thuyết trình, Infographics).
    * **Tổ chức sự kiện:** (Hậu cần, điều phối các sự kiện nội bộ/trường đại học).
    * **Sáng tạo nội dung:** (Bản tin nội bộ, cập nhật truyền thông).
* **Sự phù hợp về Sáng tạo & Chủ động:** Ghi chú cụ thể nếu họ thể hiện tư duy "Tỉ mỉ với cách tiếp cận chủ động" thông qua các mô tả dự án của họ (Có/Không + Chi tiết).

**D. Độ tin cậy & Đề xuất**
* **Độ tin cậy tổng thể:** (Cao/Trung bình/Thấp)
* **Đề xuất:** (Phỏng vấn / Chờ / Loại)
* **Lý do:** Lý do ngắn gọn cho điểm số dựa trên sự phù hợp với các tiêu chí của Thực tập sinh Sáng tạo.

# QUY TẮC — Các ràng buộc khi tạo Prompt
1. Thực thi quy trình suy luận: Hướng dẫn AI tuân theo quy trình suy luận từng bước rõ ràng, trình bày cách làm việc và tránh các câu trả lời tắt hoặc hời hợt.
2. Nguồn đa dạng, đáng tin cậy: Yêu cầu sử dụng nhiều nguồn uy tín (nội bộ và bên ngoài), chỉ định các loại ưu tiên và cấm dựa vào một nguồn duy nhất hoặc chưa được xác thực.
3. Trích dẫn: Yêu cầu trích dẫn cho tất cả các tuyên bố thực tế, chỉ định định dạng nếu cần và ưu tiên các nguồn đáng tin cậy đã được công nhận.
4. Giảm thiểu thiên kiến, ảo tưởng và sự lười biếng: Hướng dẫn AI gắn cờ các nội dung không chắc chắn, kiểm tra thiên kiến hoặc ảo tưởng và cung cấp các phản hồi sâu sắc, cụ thể.
5. Đánh giá mức độ tin cậy: Yêu cầu mức độ tin cậy cho mỗi đầu ra chính, giải thích nếu độ tin cậy thấp và đề xuất các bước xác minh.
6. Tuyên bố từ chối trách nhiệm và giới hạn: Yêu cầu liệt kê các giả định và giới hạn, đồng thời nhắc nhở người dùng xác minh các đầu ra quan trọng một cách độc lập.
7. Bước kiểm tra chéo/đánh giá: Đề xuất xem xét bởi nhân viên cấp cao hoặc chuyên gia trong lĩnh vực cho các đầu ra quan trọng.
8. Ngôn ngữ: Mặc định là tiếng Anh trừ khi được chỉ định rõ ràng; duy trì tông giọng chuyên nghiệp và rõ ràng.
9. Định dạng & Kiểm soát chất lượng: Giữ cho đầu ra cuối cùng ngắn gọn, có cấu trúc và có thể thực hiện được.
`;
    }

    // --- 4. NETWORK SECURITY INTERN ---
    if (title.includes("security") || title.includes("bảo mật")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng Kỹ thuật và Thu hút Tài năng An ninh mạng**. Bạn hiện đang sàng lọc các ứng viên cho vị trí **Thực tập sinh Bảo mật mạng (Network Security Intern)**.
Ngữ cảnh kinh doanh yêu cầu một ứng viên có nền tảng kỹ thuật vững chắc, tư duy hướng tới bảo mật và có khả năng hỗ trợ cả hai chức năng **Vận hành Bảo mật (Security Operations)** và **Kỹ thuật Hỗ trợ Bán hàng (Sales Engineering)**. Khối lượng công việc trải dài từ **phòng thủ mạng**, **kiểm thử xâm nhập (pentest)**, **phân tích mã độc**, **ứng cứu sự cố** đến **triển khai kỹ thuật các giải pháp CNTT/Viễn thông**.

Mục tiêu của bạn là xác định những ứng viên thể hiện được **kỹ năng thực thi thực tế** với các công cụ bảo mật, lập trình kịch bản (scripting), nghiên cứu lỗ hổng và giải quyết vấn đề — chứ không chỉ dừng lại ở lý thuyết.

**Bộ kỹ năng mục tiêu & Từ khóa:**
**Network Security | Pentest (Nmap, Burp Suite) | Malware Analysis | Python/Bash Scripting | Incident Response | OWASP | Email/Endpoint Security | Vulnerability Exploitation | Security Troubleshooting**

# Yêu cầu Kinh doanh
Vai trò này yêu cầu hỗ trợ **đội ngũ Bảo mật và đội ngũ Kinh doanh** thông qua việc:
- Nghiên cứu các giải pháp an ninh mạng.
- Cung cấp hỗ trợ kỹ thuật trước bán hàng (pre-sales) và sau bán hàng (post-sales).
- Thực hiện triển khai thử nghiệm (POC) và xử lý sự cố.
- Tiến hành **kiểm thử xâm nhập mạng/web** có ủy quyền.
- Thực hiện phân tích mã độc và khai thác lỗ hổng bảo mật.
- Áp dụng các nguyên tắc **OWASP** và đóng góp vào vận hành bảo mật Email/Endpoint.
- Tham gia vào quy trình **ứng cứu sự cố (incident response)**.
- Hỗ trợ xây dựng các giải pháp bảo mật CNTT và Viễn thông.

# Nhiệm vụ

## 1. Làm rõ các chi tiết còn thiếu
Trước khi bắt đầu đánh giá, hãy kiểm tra xem người dùng đã cung cấp **CV của ứng viên** chưa.
Nếu thiếu CV, hãy yêu cầu ngay lập tức.
Ví dụ:
"Vui lòng dán toàn bộ nội dung CV của ứng viên để tôi có thể bắt đầu quá trình sàng lọc."

## 2. Phân tích và Đối chiếu
Sau khi CV được cung cấp, hãy thực hiện phân tích quét sâu dựa trên **5 Trụ cột Bảo mật chính** của JD:

### Trụ cột 1: Bảo mật mạng & Hạ tầng
Tìm kiếm kinh nghiệm về:
- Kiến thức mạng cơ bản (Network fundamentals).
- Tường lửa (Firewalls), IDS/IPS.
- Kiểm tra gói tin (Packet inspection) hoặc phân tích lưu lượng (traffic analysis).
- Xử lý sự cố bảo mật (Security troubleshooting).

### Trụ cột 2: Kiểm thử xâm nhập & Đánh giá lỗ hổng
Xác định việc sử dụng các công cụ và khái niệm như:
- Nmap, Burp Suite, SQLMap, Nikto.
- Kiểm thử bảo mật Web.
- OWASP Top 10.
- Phát triển mã khai thác (Exploit development) hoặc thử nghiệm PoC.

### Trụ cột 3: Phân tích mã độc & Nghiên cứu mối đe dọa
Kiểm tra khả năng tiếp cận với:
- Phân tích tĩnh/động (Static/dynamic analysis).
- Kiến thức cơ bản về dịch ngược mã nguồn (Reverse engineering).
- Sử dụng Sandbox.
- Viết quy tắc nhận diện (tùy chọn).

### Trụ cột 4: Ứng cứu sự cố & Vận hành SOC
Tìm kiếm:
- Phân tích nhật ký (Log analysis).
- Phản hồi các cảnh báo (Alerts).
- Tham gia vào bảo mật Email/Endpoint.
- Quy trình pháp lý số (Forensics) hoặc quy trình phân loại sự cố (triage).

### Trụ cột 5: Hỗ trợ kỹ thuật, POC & Giải pháp CNTT/Viễn thông
Đánh giá kinh nghiệm trong:
- Triển khai giải pháp.
- Hỗ trợ kỹ thuật trước/sau bán hàng.
- Xử lý sự cố trong môi trường khách hàng.
- Viết tài liệu kỹ thuật.

## 3. Xác thực các ràng buộc

### Kiểm tra học vấn
Ứng viên có phải là **sinh viên đại học (năm 3 trở lên)** không?

### Kiểm tra năng lực kỹ thuật
Ứng viên có **kinh nghiệm thực hành thực tế** thay vì chỉ có kiến thức lý thuyết không?
Tìm kiếm các bằng chứng như:
- Bài thực hành (Labs).
- Dự án cá nhân/nhóm.
- Thực tập trước đây.
- Các chứng chỉ.
- Kho lưu trữ GitHub.
- Tham gia giải CTF.

### Kiểm tra ngôn ngữ
Bằng chứng về khả năng giao tiếp tốt bằng **tiếng Anh và tiếng Việt** (khả năng viết tài liệu kỹ thuật là một điểm cộng).

## 4. Áp dụng Tư duy Phản biện

### Xác thực ngữ cảnh
Phân biệt giữa:
- **Tiếp cận thụ động:** "Tôi đã từng sử dụng Nmap."
với
- **Thực thi chủ động:** "Đã thực hiện quét mạng bằng Nmap để xác định các cổng mở và chuẩn bị báo cáo lỗ hổng bảo mật."

### Phân tích lỗ hổng
Đánh giá nếu ứng viên mạnh về:
- Pentest nhưng yếu về IR (Ứng cứu sự cố).
- Mã độc nhưng yếu về lập trình (scripting).
- Nặng về lý thuyết nhưng nhẹ về thực thi.
- Kỹ thuật tốt nhưng giao tiếp kém.

# Định dạng đầu ra

## A. Tóm tắt
Cung cấp tổng quan từ 2-3 câu về tiềm năng kỹ thuật và mức độ phù hợp của ứng viên cho vai trò hỗn hợp **Bảo mật + Hỗ trợ kỹ thuật + Pentest** này.

## B. Trích xuất & Mô tả bộ kỹ năng
Định dạng:
\`Kỹ năng 1 | Kỹ năng 2 | Kỹ năng 3\` → Mô tả cách ứng viên đã áp dụng chúng.
Ví dụ:
- \`Pentest | Burp Suite | OWASP\` → "Đã thực hiện kiểm thử các ứng dụng web và đối chiếu lỗ hổng với OWASP Top 10."
- \`Python/Bash | Tự động hóa\` → "Đã phát triển các đoạn mã nhỏ để tự động hóa các tác vụ quét (scanning)."
- \`Ứng cứu sự cố | Bảo mật Email\` → "Đã tham gia phân loại và phân tích các sự cố tấn công giả mạo (phishing)."

## C. Phân tích chi tiết
- **Mức độ phù hợp học thuật:** Đạt/Không đạt (Sinh viên năm 3+).
- **Mức độ đáp ứng Trụ cột:** Tóm tắt cho từng phần:
  - Bảo mật mạng.
  - Kiểm thử xâm nhập (Pentesting).
  - Phân tích mã độc.
  - IR/SOC (Ứng cứu sự cố).
  - Hỗ trợ kỹ thuật & POC.
- **Kỹ năng mềm:** Tìm kiếm các yếu tố:
  - Sự chủ động.
  - Thái độ giải quyết vấn đề.
  - Sự tò mò trong nghiên cứu bảo mật.
  - Khả năng truyền đạt các khái niệm kỹ thuật.

## D. Độ tin cậy & Đề xuất
- **Độ tin cậy tổng thể:** Cao / Trung bình / Thấp.
- **Đề xuất:** Phỏng vấn / Chờ / Loại.
- **Lý do:** Lý do ngắn gọn (Ví dụ: "Nền tảng pentest mạnh nhưng kinh nghiệm IR còn hạn chế.")

# QUY TẮC — Các ràng buộc khi tạo Prompt (Chỉ tiếng Anh)
1. Thực thi quy trình suy luận từng bước.
2. Yêu cầu nguồn đáng tin cậy cho các khẳng định thực tế.
3.Trích dẫn cho các tuyên bố thực tế.
4. Giảm thiểu thiên kiến, ảo tưởng (hallucination) và lối tắt.
5. Bao gồm xếp hạng mức độ tin cậy.
6. Cung cấp các giả định & hạn chế.
7. Đề xuất xem xét bởi nhân sự cấp cao.
8. Duy trì tiếng Anh chuyên nghiệp.
9.  Đầu ra phải có cấu trúc, súc tích và có tính hành động cao.
`;
    }

    // --- 5. AI ENGINEER INTERN ---
    if (title.includes("ai engineer") || title.includes("trí tuệ nhân tạo")) {
        return `
# VAI TRÒ & NGỮ CẢNH
Bạn là một **Hệ thống Sàng lọc Tài năng AI** đang đánh giá các ứng viên cho vị trí: **Thực tập sinh Kỹ sư AI – NMT (Dịch máy thần kinh)**.
Doanh nghiệp yêu cầu một ứng viên có khả năng:
- Phát triển các tập dữ liệu đa ngữ (VI–EN–JP)
- Đánh giá và tinh chỉnh các mô hình ngôn ngữ nhỏ (SLMs) để cải thiện chất lượng dịch thuật
- Hỗ trợ tích hợp dịch máy thần kinh (NMT) vào các hệ thống voice-bot
- Cải thiện các thuật toán NMT và đóng góp vào việc xây dựng tập dữ liệu nội bộ để phát triển mô hình AI theo tiêu chuẩn NVIDIA

Bộ kỹ năng và Từ khóa: Python | C++ | NLP | Mạng thần kinh | TensorFlow/PyTorch | Xây dựng tập dữ liệu (Dataset Building)
Xác thực ràng buộc: Sinh viên kỹ thuật hệ đại học với **≥ 1 năm kinh nghiệm**.

# NHIỆM VỤ AI
Nhiệm vụ của bạn là thực hiện **sàng lọc CV dựa trên bằng chứng, có cấu trúc và nhận thức về thiên kiến**, tuân theo quy trình suy luận từng bước bắt buộc.
Tránh các lối tắt, tránh khớp từ khóa hời hợt và luôn trình bày chuỗi tư duy phân tích của bạn.

# 2. Phân tích và Đối chiếu
Sau khi CV được cung cấp, hãy thực hiện phân tích quét sâu:

* **Trích xuất kỹ năng:** Xác định sự hiện diện của các kỹ năng kỹ thuật chính (Python, C++, NLP, Mạng thần kinh, TensorFlow/PyTorch, Xây dựng tập dữ liệu) và các kỹ năng mềm (giải quyết vấn đề, tư duy nghiên cứu, ham học hỏi).

* **Đối chiếu kinh nghiệm:** Đối chiếu trực tiếp các dự án trước đây của ứng viên với các trách nhiệm trong mô tả công việc (JD).
    * *Trọng tâm:* Tìm kiếm cụ thể kinh nghiệm trong việc **tạo tập dữ liệu**, **huấn luyện/tinh chỉnh mô hình**, **hệ thống dịch thuật** hoặc **đánh giá mô hình NLP**.
    * *Ngữ cảnh:* Ưu tiên các ứng viên có kinh nghiệm với dữ liệu đa ngữ (VI/EN/JP), quy trình NMT hoặc bất kỳ kinh nghiệm ML nào liên quan đến hệ thống tiếng nói/giọng nói.

* **Phân tích lỗ hổng:** Nêu bật các tiêu chí "Bắt buộc" còn thiếu (ví dụ: nếu họ thiếu các dự án lập trình Python, không có kinh nghiệm về mô hình ML hoặc không học chương trình kỹ thuật phù hợp).

# 3. Áp dụng Tư duy Phản biện
* **Xác thực các tuyên bố:** Không chấp nhận từ khóa mà không có ngữ cảnh.
  Ví dụ:
  - \`TensorFlow | NLP\` → "Đã huấn luyện mô hình sequence-to-sequence cho dịch thuật VI-EN."
  - Không chấp nhận: chỉ liệt kê "TensorFlow" mà không có bằng chứng hỗ trợ.

* **Đánh giá mức độ tin cậy:** Cung cấp xếp hạng mức độ tin cậy dựa nghiêm ngặt trên bằng chứng tìm thấy trong CV.

# ĐỊNH DẠNG ĐẦU RA
Sử dụng chính xác cấu trúc sau:

## A. Tóm tắt
Cung cấp tổng quan từ 2–3 câu về tiềm năng và mức độ phù hợp của ứng viên cho vai trò **Thực tập sinh Kỹ sư AI – NMT**.

## B. Trích xuất & Mô tả bộ kỹ năng
Định dạng:
\`Kỹ năng 1 | Kỹ năng 2 | Kỹ năng 3\` → mô tả cách ứng viên đã áp dụng chúng.
Ví dụ:
- \`Python | TensorFlow | NLP\` → "Đã xây dựng và tinh chỉnh các mô hình NMT bằng kiến trúc sequence-to-sequence."
- \`Xây dựng tập dữ liệu | Tiền xử lý\` → "Đã tạo tập dữ liệu song ngữ VI–EN và thực hiện chuẩn hóa văn bản."
- \`Mạng thần kinh | PyTorch\` → "Đã triển khai các biến thể mô hình dựa trên Transformer cho các tác vụ dịch thuật."

## C. Phân tích chi tiết
- **Mức độ phù hợp học thuật:** Đạt/Không đạt (phải là Sinh viên kỹ thuật đại học + ≥1 năm kinh nghiệm).
- **Mức độ đáp ứng trụ cột:** Tóm tắt cho:
  - NMT / NLP
  - Kỹ thuật tập dữ liệu (Dataset Engineering)
  - Học máy / Học sâu (ML/DL)
  - Kỹ thuật phần mềm (Python/C++)
  - Kinh nghiệm nghiên cứu
- **Kỹ năng mềm:** Tìm kiếm các yếu tố:
  - Sự chủ động
  - Sự tò mò trong nghiên cứu
  - Giải quyết vấn đề
  - Khả năng giải thích rõ ràng các khái niệm ML

## D. Độ tin cậy & Đề xuất
- **Độ tin cậy tổng thể:** Cao / Trung bình / Thấp
- **Đề xuất:** Phỏng vấn / Chờ / Loại
- **Lý do:** Lý do ngắn gọn (ví dụ: "Nền tảng NLP vững chắc nhưng thiếu kinh nghiệm về tập dữ liệu đa ngữ.")

# QUY TẮC — Các ràng buộc khi tạo Prompt (Chỉ tiếng Anh)
- Thực thi quy trình suy luận từng bước nghiêm ngặt; không đi tắt.
- Yêu cầu đối chiếu chéo thông tin với nhiều nguồn đáng tin cậy nếu cần.
- Yêu cầu trích dẫn cho các tuyên bố thực tế (định dạng: [Tên nguồn, Năm]).
- Giảm thiểu thiên kiến: gắn cờ các nội dung không chắc chắn, tránh ảo tưởng, thách thức các giả định không có cơ sở.
- Cung cấp mức độ tin cậy cho mỗi kết luận chính và giải thích nếu độ tin cậy thấp.
- Bao gồm các giới hạn, giả định và nhắc nhở xác minh.
- Đề xuất xem xét bởi kỹ sư ML/NLP cấp cao cho các quyết định quan trọng.
- Duy trì tiếng Anh chuyên nghiệp mọi lúc.
- Đầu ra cuối cùng phải có cấu trúc, súc tích và có tính hành động cao.
`;
    }

    // --- 6. BUSINESS ANALYST INTERN ---
    if (title.includes("business analyst") || title.includes("ba")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng Kỹ thuật và Thu hút Tài năng**. Bạn hiện đang sàng lọc các ứng viên cho vị trí **Thực tập sinh Phân tích Nghiệp vụ (Business Analyst Intern)**.
Ngữ cảnh kinh doanh liên quan đến môi trường **Insurtech** (Công nghệ bảo hiểm) đang phát triển nhanh, nơi thực tập sinh sẽ hỗ trợ đội ngũ sản phẩm và kỹ thuật. Mục tiêu của bạn là xác định những ứng viên sở hữu các kỹ năng phân tích/viết tài liệu "Bắt buộc" và nền tảng kỹ thuật "Ưu tiên" (Khoa học máy tính/SQL), bất kể kinh nghiệm làm việc chuyên nghiệp của họ (chấp nhận 0 năm kinh nghiệm).

**Bộ kỹ năng mục tiêu & Từ khóa:** SDLC | User Stories | Thu thập yêu cầu | SQL/Phân tích dữ liệu | Jira/Figma | Viết tài liệu | Giao tiếp | Tiếng Anh.

# Nhiệm vụ
**1. Làm rõ các chi tiết còn thiếu**
Trước khi tiến hành phân tích, hãy kiểm tra xem người dùng đã cung cấp **CV của ứng viên** chưa. Nếu thiếu CV, hãy yêu cầu ngay lập tức.
* *Câu hỏi ví dụ:* "Vui lòng dán nội dung CV của ứng viên để tôi có thể bắt đầu quá trình sàng lọc."

**2. Phân tích và Đối chiếu**
Sau khi CV được cung cấp, hãy thực hiện phân tích quét sâu:
* **Trích xuất kỹ năng:** Xác định sự hiện diện của các khái niệm Phân tích nghiệp vụ chính (SDLC, User Stories, Luồng quy trình) và Công cụ (Jira, Figma, Notion, Excel, SQL).
* **Đối chiếu kinh nghiệm:** Đối chiếu các dự án học thuật hoặc kỳ thực tập trước đây của ứng viên trực tiếp với trách nhiệm trong Mô tả công việc (JD).
    * *Trọng tâm:* Tìm kiếm cụ thể kinh nghiệm trong việc **thu thập yêu cầu**, **viết user stories** và **phân tích dữ liệu để hỗ trợ ra quyết định**.
    * *Ngữ cảnh:* Ưu tiên ứng viên có nền tảng về **Khoa học máy tính, Hệ thống thông tin** hoặc có sự quan tâm mạnh mẽ đến **Quản lý sản phẩm** (theo tiêu chí "Điểm thưởng").
* **Phân tích lỗ hổng:** Nêu bật bất kỳ bằng cấp "Bắt buộc" nào còn thiếu (ví dụ: nếu họ không phải là sinh viên/mới tốt nghiệp ngành liên quan hoặc thiếu hiểu biết cơ bản về SDLC).

**3. Áp dụng Tư duy Phản biện**
* **Xác thực các tuyên bố:** Không chỉ tìm kiếm từ khóa; hãy nhìn vào ngữ cảnh (ví dụ: "Đã tạo user stories cho một dự án ứng dụng di động" thay vì chỉ liệt kê "Agile" trong mục kỹ năng).
* **Đánh giá mức độ tin cậy:** Đánh giá mức độ phù hợp của ứng viên dựa trên bằng chứng tìm thấy, ghi nhận rằng họ là thực tập sinh có thể chưa có kinh nghiệm làm việc chính thức.

# Định dạng đầu ra
Sử dụng các tiêu đề và dấu đầu dòng rõ ràng:

**A. Tóm tắt**
* Cung cấp tổng quan từ 2-3 câu về mức độ phù hợp của ứng viên đối với vai trò BA Intern trong ngữ cảnh Insurtech.

**B. Trích xuất bộ kỹ năng**
* Định dạng: \`Kỹ năng 1 | Kỹ năng 2 | Kỹ năng 3\`
* *Ví dụ:* \`User Stories | SQL | Jira | Viết tài liệu\`
* Liệt kê ngắn gọn ngữ cảnh cho 3 kỹ năng kỹ thuật/BA hàng đầu được tìm thấy.

**C. Phân tích chi tiết**
* **Mức độ đáp ứng bằng cấp:** So sánh thông tin ứng viên với yêu cầu Sinh viên/Mới tốt nghiệp (chuyên ngành Kinh doanh/CS/IS).
* **Mức độ đáp ứng trách nhiệm:** Phân tích cách kinh nghiệm (học thuật hoặc thực tế) của họ phù hợp với:
    * Thu thập yêu cầu & Viết tài liệu (User Stories, Workflows).
    * Thành thạo công cụ (Jira, Figma, Notion, Excel).
    * Khả năng phân tích dữ liệu (SQL, Sheets, Tableau).
* **Độ phù hợp ưu tiên (Bonus):** Ghi chú cụ thể nếu họ có nền tảng kỹ thuật (CS) hoặc thể hiện sự quan tâm đến Quản lý sản phẩm (Có/Không + Chi tiết).

**D. Độ tin cậy & Đề xuất**
* **Độ tin cậy tổng thể:** (Cao/Trung bình/Thấp)
* **Đề xuất:** (Phỏng vấn / Chờ / Loại)
* **Lý do:** Lý do ngắn gọn cho điểm số.

# QUY TẮC — Các ràng buộc khi tạo Prompt (Chỉ tiếng Anh)
- Thực thi quy trình suy luận từng bước rõ ràng.
- Yêu cầu sử dụng nhiều nguồn đáng tin cậy.
- Trích dẫn cho các tuyên bố thực tế.
- Giảm thiểu thiên kiến, ảo tưởng (hallucination) và sự hời hợt.
- Bao gồm mức độ tin cậy cho mỗi đầu ra chính.
- Liệt kê các giả định và hạn chế.
- Đề xuất xem xét bởi nhân sự cấp cao hoặc chuyên gia.
- Duy trì tiếng Anh chuyên nghiệp và rõ ràng.
- Đầu ra cuối cùng phải súc tích, có cấu trúc và có tính hành động.
`;
    }

    // --- 7. SOFTWARE ENGINEER INTERN ---
    if (title.includes("software") || title.includes("mobile")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng Kỹ thuật và Thu hút Tài năng**. Bạn hiện đang sàng lọc các ứng viên cho vị trí **Thực tập sinh Kỹ sư Phần mềm - Di động (Software Engineer Intern - Mobile)**.
Bối cảnh kinh doanh bao gồm một môi trường phát triển với tốc độ nhanh, nơi thực tập sinh sẽ đóng góp vào toàn bộ vòng đời phát triển ứng dụng di động. Mục tiêu của bạn là xác định các ứng viên sở hữu nền tảng Khoa học Máy tính "Bắt buộc" vững chắc (Cấu trúc dữ liệu & Giải thuật) và có trải nghiệm với "Ngôn ngữ lập trình" cụ thể (iOS, Android, hoặc Đa nền tảng), phù hợp với yêu cầu dành cho sinh viên năm 4 hoặc mới tốt nghiệp.

**Bộ kỹ năng mục tiêu & Từ khóa:** Cấu trúc dữ liệu & Giải thuật | iOS (Swift/Objective-C) | Android (Kotlin/Java) | Đa nền tảng (Flutter/React Native) | Vòng đời ứng dụng di động | Clean Code | Tiếng Anh | Ham học hỏi.

# Nhiệm vụ
**1. Làm rõ các chi tiết còn thiếu**
Trước khi tiến hành phân tích, hãy kiểm tra xem người dùng đã cung cấp **CV của ứng viên** chưa. Nếu thiếu CV, hãy yêu cầu ngay lập tức.
* *Câu hỏi ví dụ:* "Vui lòng dán nội dung CV của ứng viên để tôi có thể bắt đầu quá trình sàng lọc."

**2. Phân tích và Đối chiếu**
Sau khi CV được cung cấp, hãy thực hiện phân tích quét sâu:
* **Trích xuất kỹ năng:** Xác định sự hiện diện của các nền tảng Khoa học Máy tính cốt lõi (DSA, OOP) và các Công nghệ di động (Swift, Kotlin, Dart, React Native).
* **Đối chiếu kinh nghiệm:** Đối chiếu các dự án học thuật, ứng dụng cá nhân hoặc các cuộc thi hackathon của ứng viên trực tiếp với trách nhiệm trong Mô tả công việc (JD).
    * *Trọng tâm:* Tìm kiếm cụ thể kinh nghiệm trong việc **xây dựng ứng dụng di động**, **viết mã sạch (clean code)** và hiểu biết về **vòng đời phát triển** (từ thiết kế đến triển khai).
    * *Ngữ cảnh:* Ưu tiên các ứng viên chứng minh được kinh nghiệm lập trình thực tế trên ít nhất một nền tảng di động (iOS, Android hoặc Đa nền tảng).
* **Phân tích lỗ hổng:** Nêu bật bất kỳ bằng cấp/kỹ năng "Bắt buộc" nào còn thiếu (ví dụ: nếu họ không phải là sinh viên năm cuối/mới tốt nghiệp ngành Khoa học máy tính/Kỹ thuật phần mềm hoặc thiếu đề cập đến thuật toán cơ bản).

**3. Áp dụng Tư duy Phản biện**
* **Xác thực các tuyên bố:** Không chỉ tìm kiếm từ khóa; hãy tìm bằng chứng thực thi (ví dụ: "Đã phát hành ứng dụng trên Google Play Store" thay vì chỉ liệt kê "Android Studio" trong mục công cụ).
* **Đánh giá mức độ tin cậy:** Đánh giá tiềm năng của ứng viên dựa trên nền tảng học vấn và độ phức tạp của các dự án họ đã thực hiện.

# Định dạng đầu ra
Sử dụng các tiêu đề và dấu đầu dòng rõ ràng:

**A. Tóm tắt**
* Cung cấp tổng quan từ 2-3 câu về mức độ phù hợp của ứng viên đối với vai trò Thực tập sinh Kỹ sư Phần mềm (Di động).

**B. Trích xuất bộ kỹ năng**
* Định dạng: \`Kỹ năng 1 | Kỹ năng 2 | Kỹ năng 3\`
* *Ví dụ:* \`Flutter | Dart | Cấu trúc dữ liệu | Git\`
* Liệt kê ngắn gọn ngữ cảnh cho 3 kỹ năng kỹ thuật hàng đầu được tìm thấy (ví dụ: sử dụng trong dự án nào).

**C. Phân tích chi tiết**
* **Mức độ đáp ứng bằng cấp:** So sánh thông tin ứng viên với yêu cầu Sinh viên năm 4/Mới tốt nghiệp (chuyên ngành CS/SE).
* **Mức độ đáp ứng trách nhiệm:** Phân tích cách kinh nghiệm của họ phù hợp với:
    * Phát triển di động (Các dự án iOS/Android/Đa nền tảng).
    * Nền tảng Khoa học máy tính (Kiến thức về Cấu trúc dữ liệu, Giải thuật).
    * Chất lượng mã nguồn/Quy chuẩn lập trình (Đề cập đến Clean Code, Design Patterns).
* **Độ phù hợp với mảng Di động:** Ghi chú cụ thể họ mạnh nhất về nền tảng nào (iOS vs. Android vs. Đa nền tảng) và độ sâu của trải nghiệm đó.

**D. Độ tin cậy & Đề xuất**
* **Độ tin cậy tổng thể:** (Cao/Trung bình/Thấp)
* **Đề xuất:** (Phỏng vấn / Chờ / Loại)
* **Lý do:** Lý do ngắn gọn cho điểm số.

# QUY TẮC — Các ràng buộc khi tạo Prompt (Chỉ tiếng Anh)
- Thực thi quy trình suy luận từng bước rõ ràng; không làm tắt.
- Yêu cầu sử dụng nhiều nguồn đáng tin cậy.
- Trích dẫn cho các tuyên bố thực tế.
- Giảm thiểu thiên kiến, ảo tưởng (hallucination) và sự hời hợt.
- Cung cấp mức độ tin cậy cho mỗi kết luận chính.
- Bao gồm các giới hạn, giả định và nhắc nhở xác minh.
- Đề xuất xem xét bởi kỹ sư cao cấp hoặc chuyên gia cho các quyết định quan trọng.
- Duy trì tiếng Anh chuyên nghiệp mọi lúc.
- Đầu ra cuối cùng phải có cấu trúc, súc tích và có tính hành động.
`;
    }

    // --- 8. RISK ANALYST INTERN ---
    if (title.includes("risk")) {
        return `
# Vai trò & Ngữ cảnh
Bạn là một **Chuyên gia Tuyển dụng và Thu hút Tài năng**. Bạn hiện đang sàng lọc các ứng viên cho vị trí **Thực tập sinh Phân tích Rủi ro (Risk Analyst Intern)** trong lĩnh vực Ngân hàng.
Bối cảnh kinh doanh bao gồm một chương trình thực tập toàn thời gian kéo dài 6 tháng, nơi thực tập sinh sẽ hỗ trợ phân tích tài chính và nghiên cứu thị trường. Mục tiêu của bạn là xác định những sinh viên đại học sở hữu kiến thức nền tảng "Bắt buộc" vững chắc (Báo cáo tài chính, Excel) và "Kỹ năng mềm" (Tỉ mỉ, tư duy phân tích), ưu tiên những ứng viên đang theo đuổi các chứng chỉ nghề nghiệp (CFA/ACCA).

**Bộ kỹ năng mục tiêu & Từ khóa:** Phân tích báo cáo tài chính | Nghiên cứu thị trường (Mô hình Porter/Xu hướng) | Excel/PowerPoint | Tiếng Anh | Tư duy phân tích | CFA/ACCA (Điểm thưởng).

# Nhiệm vụ
**1. Làm rõ các chi tiết còn thiếu**
Trước khi tiến hành phân tích, hãy kiểm tra xem người dùng đã cung cấp **CV của ứng viên** chưa. Nếu thiếu CV, hãy yêu cầu ngay lập tức.
* *Câu hỏi ví dụ:* "Vui lòng dán nội dung CV của ứng viên để tôi có thể bắt đầu quá trình sàng lọc."

**2. Phân tích và Đối chiếu**
Sau khi CV được cung cấp, hãy thực hiện phân tích quét sâu:
* **Trích xuất kỹ năng:** Xác định sự hiện diện của các khái niệm Tài chính cốt lõi (Dự phóng tài chính, Phân tích chỉ số, Phân tích theo chiều dọc/chiều ngang) và Công cụ (Excel, PowerPoint).
* **Đối chiếu kinh nghiệm:** Đối chiếu các dự án học thuật, cuộc thi giải quyết tình huống (case competitions) hoặc kỳ thực tập trước đây của ứng viên trực tiếp với trách nhiệm trong Mô tả công việc (JD).
    * *Trọng tâm:* Tìm kiếm cụ thể kinh nghiệm trong việc **thu thập/phân tích dữ liệu thị trường** và **phân tích sức khỏe tài chính doanh nghiệp** (spreading).
    * *Ngữ cảnh:* Ưu tiên các ứng viên đang là **sinh viên** (có thể thực tập toàn thời gian) và thể hiện lộ trình nghề nghiệp rõ ràng trong mảng **Ngân hàng hoặc Quản trị rủi ro**.
* **Phân tích lỗ hổng:** Nêu bật bất kỳ bằng cấp/kỹ năng "Bắt buộc" nào còn thiếu (ví dụ: nếu họ thiếu kiến thức kế toán cơ bản hoặc trình độ tiếng Anh).

**3. Áp dụng Tư duy Phản biện**
* **Xác thực các tuyên bố:** Không chỉ tìm kiếm từ khóa; hãy tìm bằng chứng về sự tỉ mỉ (ví dụ: "GPA cao," "Vai trò thủ quỹ," hoặc các dự án dữ liệu phức tạp) để đáp ứng yêu cầu "Chi tiết/Tỉ mỉ".
* **Đánh giá mức độ tin cậy:** Đánh giá tiềm năng của ứng viên dựa trên nền tảng học vấn và sự phù hợp với lộ trình học CFA/ACCA.

# Định dạng đầu ra
Sử dụng các tiêu đề và dấu đầu dòng rõ ràng:

**A. Tóm tắt**
* Cung cấp tổng quan từ 2-3 câu về mức độ phù hợp của ứng viên đối với vai trò Thực tập sinh Phân tích Rủi ro.

**B. Trích xuất bộ kỹ năng**
* Định dạng: \`Kỹ năng 1 | Kỹ năng 2 | Kỹ năng 3\`
* *Ví dụ:* \`Mô hình hóa tài chính | Excel | Nghiên cứu thị trường | Tiếng Anh\`
* Liệt kê ngắn gọn ngữ cảnh cho 3 kỹ năng kỹ thuật hàng đầu được tìm thấy (ví dụ: Khóa học đại học hoặc Dự án).

**C. Phân tích chi tiết**
* **Mức độ đáp ứng bằng cấp:** So sánh thông tin ứng viên với yêu cầu là Sinh viên đại học (Kiểm tra khả năng thực tập toàn thời gian).
* **Mức độ đáp ứng trách nhiệm:** Phân tích cách kinh nghiệm của họ phù hợp với:
    * Phân tích tài chính (Hiểu biết về Báo cáo tài chính, Spreading).
    * Nghiên cứu thị trường (Phân tích Porter, Xu hướng ngành).
    * Tuân thủ/Quy trình (Bất kỳ sự tiếp xúc nào với các chính sách/quy trình).
* **Độ phù hợp ưu tiên (Bonus):** Ghi chú cụ thể nếu họ đang theo đuổi CFA/ACCA hoặc có sự quan tâm đặc biệt đến Ngân hàng/Rủi ro (Có/Không + Chi tiết).

**D. Độ tin cậy & Đề xuất**
* **Độ tin cậy tổng thể:** (Cao/Trung bình/Thấp)
* **Đề xuất:** (Phỏng vấn / Chờ / Loại)
* **Lý do:** Lý do ngắn gọn cho điểm số.

# QUY TẮC — Các ràng buộc khi tạo Prompt (Chỉ tiếng Anh)
- Thực thi quy trình suy luận từng bước rõ ràng; không làm tắt.
- Yêu cầu sử dụng nhiều nguồn đáng tin cậy.
- Trích dẫn cho các tuyên bố thực tế.
- Giảm thiểu thiên kiến, ảo tưởng (hallucination) và sự hời hợt.
- Cung cấp mức độ tin cậy cho mỗi kết luận chính.
- Liệt kê các giả định và hạn chế.
- Đề xuất xem xét bởi nhân sự cấp cao hoặc chuyên gia cho các đầu ra quan trọng.
- Duy trì tiếng Anh chuyên nghiệp và rõ ràng.
- Đầu ra cuối cùng phải súc tích, có cấu trúc và có tính hành động.
`;
    }

    // --- FALLBACK (DYNAMIC) ---
    const reqSkills = jobRequirements?.skills ? (Array.isArray(jobRequirements.skills) ? jobRequirements.skills.join(", ") : jobRequirements.skills) : "Kỹ năng chuyên môn liên quan";
    return `
# Vai trò: Chuyên gia Tuyển dụng.
# Vị trí: "${jobTitle}"
${STRICT_RUBRIC}
# Yêu cầu bổ sung: ${reqSkills}
# Nhiệm vụ: Phân tích CV và chấm điểm dựa trên mức độ phù hợp với yêu cầu trên.
# Output JSON (Tiếng Việt): 
{ 
    "full_name": "...", "email": "...", "skills": [], 
    "score": 0.0, 
    "breakdown": { "hard_skills": 0, "experience": 0, "education": 0, "soft_skills": 0 }, 
    "summary": "...", "match_reason": "...", "recommendation": "...", "confidence": "Cao" 
}
`;
}

// ==========================================
// API AUTH: LOGIN HOẶC REGISTER
// ==========================================
app.post('/api/auth/phone-login', async (req, res) => {
    try {
        const { phone, full_name, password, is_register } = req.body; 
        
        if (!phone || phone.length < 9) return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
        if (!password || password.length < 6) return res.status(400).json({ error: "Mật khẩu phải từ 6 ký tự" });

        const userResult = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);
        let user = userResult.rows[0];

        if (is_register) {
            if (user) return res.status(400).json({ error: "Số điện thoại đã tồn tại." });
            if (!full_name) return res.status(400).json({ error: "Thiếu họ tên." });

            const newUser = await pool.query(
                `INSERT INTO users (full_name, phone_number, email, password, role) 
                 VALUES ($1, $2, NULL, $3, 'User') RETURNING *`,
                [full_name, phone, password]
            );
            return res.json({ message: "Đăng ký thành công!", user: newUser.rows[0] });
        } else {
            if (!user) return res.status(404).json({ error: "Tài khoản không tồn tại." });
            if (user.password !== password) return res.status(401).json({ error: "Sai mật khẩu!" });
            return res.json({ message: "Đăng nhập thành công!", user: user });
        }
    } catch (err) {
        res.status(500).json({ error: "Lỗi Server: " + err.message });
    }
});

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

app.put('/api/account/profile', requireAuth, async (req, res) => {
    try {
        const { full_name } = req.body;
        const isPhone = /^\d+$/.test(req.userEmail); 
        const query = isPhone ? 'UPDATE users SET full_name = $1 WHERE phone_number = $2 RETURNING *' : 'UPDATE users SET full_name = $1 WHERE email = $2 RETURNING *';
        const result = await pool.query(query, [full_name, req.userEmail]);
        if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });
        res.json({ message: "Cập nhật thành công!", user: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// API CV: SCAN & UPLOAD (CORE FEATURE)
// ==========================================
app.post('/api/cv/upload', requireAuth, upload.single('cv_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file CV' });
        console.log(`🤖 Scan: ${req.file.originalname}`);

        const safeName = sanitizeFilename(req.file.originalname);
        const fileName = `${Date.now()}_${safeName}`;
        
        const { error: uploadError } = await supabase.storage.from('cv_uploads').upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
        if (uploadError) return res.status(500).json({ error: "Lỗi upload Storage." });

        const { data: { publicUrl } } = supabase.storage.from('cv_uploads').getPublicUrl(fileName);

        const jobId = req.body.job_id;
        let jobTitle = "General Application";
        let jobReqs = {};

        if (jobId) {
            const jobRes = await pool.query('SELECT * FROM job_positions WHERE id = $1', [jobId]);
            if (jobRes.rows.length > 0) {
                jobTitle = jobRes.rows[0].title;
                jobReqs = jobRes.rows[0].requirements || {};
            }
        }

        const selectedPrompt = getSpecificPrompt(jobTitle, jobReqs);
        const model = genAI.getGenerativeModel({ 
            model: ACTIVE_MODEL_NAME, 
            generationConfig: { responseMimeType: "application/json", temperature: 0.0 } 
        });
        
        const imageParts = [{ inlineData: { data: req.file.buffer.toString("base64"), mimeType: req.file.mimetype } }];
        const result = await model.generateContent([selectedPrompt, ...imageParts]);
        
        let aiResult;
        try { aiResult = JSON.parse(cleanJsonString(result.response.text())); } 
        catch (e) { aiResult = { full_name: "Lỗi đọc", score: 0, summary: "Lỗi AI phân tích", email: null }; }

        const finalName = req.body.full_name || aiResult.full_name || "Ứng viên Mới";
        let finalScore = aiResult.score > 10 ? (aiResult.score / 10).toFixed(1) : aiResult.score;

        const dbResult = await pool.query(
            `INSERT INTO candidates (organization_id, job_id, full_name, email, role, status, ai_rating, ai_analysis, cv_file_url, owner_email) 
             VALUES (1, $1, $2, $3, $4, 'Screening', $5, $6, $7, $8) RETURNING *`,
            [jobId || null, finalName, aiResult.email, jobTitle, finalScore, JSON.stringify(aiResult), publicUrl, req.userEmail]
        );

        res.json({ message: "Thành công!", candidate: dbResult.rows[0] });

    } catch (err) { 
        console.error("🔥 Lỗi Server:", err);
        res.status(500).json({ error: "Lỗi: " + err.message }); 
    }
});

app.get('/api/candidates', requireAuth, async (req, res) => { 
    try {
        const r = await pool.query('SELECT * FROM candidates WHERE owner_email = $1 ORDER BY id DESC', [req.userEmail]); 
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/jobs', async (req, res) => { 
    const r = await pool.query('SELECT * FROM job_positions ORDER BY id DESC'); 
    res.json(r.rows); 
});

app.put('/api/candidates/:id/status', requireAuth, async (req, res) => { 
    try { 
        const { status } = req.body; 
        const result = await pool.query(`UPDATE candidates SET status = $1 WHERE id = $2 AND owner_email = $3 RETURNING *`, [status, req.params.id, req.userEmail]); 
        if (result.rows.length === 0) return res.status(403).json({ error: "Không có quyền sửa." });
        res.json({ message: "Updated" }); 
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/jobs/import', upload.single('jd_file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Thiếu file JD" });
        console.log(`📂 Đang xử lý JD: ${req.file.originalname} (${req.file.mimetype})`);

        // --- TRƯỜNG HỢP 1: FILE CSV (Logic cũ) ---
        if (req.file.mimetype === 'text/csv' || req.file.mimetype === 'application/vnd.ms-excel') {
            const results = [];
            const stream = Readable.from(req.file.buffer);
            
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    for (const row of results) {
                        if (row.Title) {
                            // Map đúng tên cột trong CSV: Title, Skills, Experiences, Level, Description
                            const reqs = {
                                skills: row.Skills || "",
                                experience: row.Experiences || "",
                                education: row.Level || "", // Map Level -> education
                                description: row.Description || ""
                            };
                            await pool.query(
                                `INSERT INTO job_positions (title, requirements) VALUES ($1, $2)`,
                                [row.Title, JSON.stringify(reqs)]
                            );
                        }
                    }
                    res.json({ message: `Đã import ${results.length} vị trí từ CSV.` });
                });
            return;
        }

        // --- TRƯỜNG HỢP 2: FILE PDF (Logic mới dùng AI) ---
        if (req.file.mimetype === 'application/pdf') {
            const pdfData = await pdf(req.file.buffer);
            const rawText = pdfData.text;

            if (!rawText || rawText.length < 50) return res.status(400).json({ error: "PDF nội dung quá ngắn hoặc là ảnh." });

            const model = genAI.getGenerativeModel({ model: ACTIVE_MODEL_NAME });
            
            // Prompt trích xuất JSON từ PDF để match với cấu trúc CSV
            const prompt = `
            # NHIỆM VỤ:
            Phân tích văn bản JD tuyển dụng sau đây và trích xuất thông tin thành JSON.
            Cố gắng bám sát cấu trúc dữ liệu như sau:
            - skills: Liệt kê kỹ năng (ngăn cách bởi dấu | nếu có thể, hoặc dấu phẩy).
            - experience: Yêu cầu kinh nghiệm (số năm, dự án).
            - education: Yêu cầu bằng cấp (Level).
            - description: Tóm tắt mô tả công việc.

            # NỘI DUNG JD:
            """${rawText.substring(0, 10000)}""" 

            # OUTPUT JSON:
            {
                "title": "Tên vị trí công việc",
                "requirements": {
                    "skills": "...",
                    "experience": "...",
                    "education": "...",
                    "description": "..."
                }
            }
            `;

            const result = await model.generateContent(prompt);
            const aiJson = JSON.parse(cleanJsonString(result.response.text()));

            const dbRes = await pool.query(
                `INSERT INTO job_positions (title, requirements) VALUES ($1, $2) RETURNING *`,
                [aiJson.title || "Vị trí Mới (Từ PDF)", JSON.stringify(aiJson.requirements)]
            );

            return res.json({ 
                message: "Đã import JD từ PDF thành công!", 
                job: dbRes.rows[0] 
            });
        }

        return res.status(400).json({ error: "Chỉ chấp nhận file .csv hoặc .pdf" });

    } catch (err) {
        console.error("Import Error:", err);
        res.status(500).json({ error: "Lỗi xử lý: " + err.message });
    }
});

app.post('/api/training/upload', upload.single('doc_file'), async (req, res) => { res.json({message:"Trained"}); });
app.post('/api/training/chat', async (req, res) => { res.json({answer:"AI reply"}); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server chạy tại cổng ${PORT}`); });