/* FILE: frontend/src/views/InternBook.jsx (Eco-Futuristic Style) */
import { useState } from 'react';

const InternBook = () => {
  // Mock Data - Nội dung sổ tay (Bạn có thể thay bằng API sau này)
  const chapters = [
    { 
      id: 1, 
      title: 'Văn hóa Doanh nghiệp', 
      icon: 'fa-building',
      content: `
        # Chào mừng bạn đến với Công ty!
        
        Chúng tôi xây dựng môi trường làm việc dựa trên 3 giá trị cốt lõi:
        
        **1. Sáng tạo (Innovation):**
        Luôn tìm kiếm giải pháp mới, không ngại thử nghiệm và chấp nhận thất bại để trưởng thành.
        
        **2. Minh bạch (Transparency):**
        Mọi thông tin đều được chia sẻ cởi mở. Chúng tôi tin rằng sự tin tưởng bắt nguồn từ sự rõ ràng.
        
        **3. Tốc độ (Speed):**
        Trong kỷ nguyên số, chậm trễ là thất bại. Hãy hành động nhanh, phản hồi nhanh và học hỏi nhanh.
      ` 
    },
    { 
      id: 2, 
      title: 'Quy trình Làm việc (Workflow)', 
      icon: 'fa-diagram-project',
      content: `
        # Quy trình Agile & Scrum
        
        Chúng ta làm việc theo mô hình Sprint 2 tuần:
        
        - **Daily Standup:** 9:00 AM mỗi sáng (15 phút). Báo cáo: Hôm qua làm gì? Hôm nay làm gì? Có vướng mắc gì không?
        - **Sprint Planning:** Đầu mỗi Sprint để chốt task.
        - **Review & Retrospective:** Cuối Sprint để demo sản phẩm và rút kinh nghiệm.
        
        **Công cụ sử dụng:**
        - Jira: Quản lý Task.
        - Slack/Discord: Giao tiếp nhanh.
        - Notion: Tài liệu hóa (Documentation).
      ` 
    },
    { 
      id: 3, 
      title: 'Chế độ & Quyền lợi', 
      icon: 'fa-gift',
      content: `
        # Quyền lợi Thực tập sinh
        
        - **Trợ cấp:** Theo năng lực và thời gian làm việc thực tế.
        - **Đào tạo:** Được tham gia các buổi Workshop nội bộ về AI, Data, và Product Management.
        - **Cơ hội:** 80% thực tập sinh có cơ hội trở thành nhân viên chính thức sau 3 tháng.
        
        **Lưu ý:**
        Vui lòng chấm công đúng giờ qua hệ thống FaceID tại cửa ra vào.
      ` 
    },
    { 
      id: 4, 
      title: 'Hướng dẫn Bảo mật', 
      icon: 'fa-shield-halved',
      content: `
        # An toàn thông tin là số 1
        
        1. Không chia sẻ tài khoản nội bộ cho người ngoài.
        2. Khóa màn hình máy tính khi rời khỏi chỗ ngồi.
        3. Không upload dữ liệu khách hàng lên các công cụ AI công cộng chưa được phê duyệt.
        4. Báo cáo ngay cho IT nếu thấy dấu hiệu đáng ngờ (Phishing email, máy chậm bất thường).
      ` 
    }
  ];

  const [selectedChapter, setSelectedChapter] = useState(chapters[0]);

  return (
    <div className="intern-book-view" style={{ 
        color: 'var(--text-white)', 
        minHeight: 'calc(100vh - 100px)',
        display: 'flex', flexDirection: 'column'
    }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '30px' }}>
        <h2 className="section-title" style={{ 
            color: 'var(--neon-green)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px',
            textShadow: '0 0 10px rgba(46, 255, 123, 0.4)'
        }}>
            <i className="fa-solid fa-book-open-reader" style={{marginRight: '10px'}}></i>
            Sổ Tay Thực Tập Sinh
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Cẩm nang hội nhập và kiến thức nền tảng cho nhân sự mới.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '25px', flex: 1 }}>
        
        {/* --- CỘT TRÁI: DANH MỤC (MENU) --- */}
        <div className="card-dark" style={{ 
            flex: '0 0 300px', 
            borderRadius: '12px', 
            padding: '20px',
            border: '1px solid var(--border-color)',
            background: 'var(--card-background)',
            height: 'fit-content'
        }}>
            <h3 style={{
                color: 'var(--text-white)', fontSize: '14px', textTransform: 'uppercase', 
                borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px'
            }}>
                Mục lục
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {chapters.map(chapter => (
                    <div 
                        key={chapter.id}
                        onClick={() => setSelectedChapter(chapter)}
                        style={{
                            padding: '12px 15px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            transition: 'all 0.2s',
                            background: selectedChapter.id === chapter.id ? 'rgba(46, 255, 123, 0.1)' : 'transparent',
                            color: selectedChapter.id === chapter.id ? 'var(--neon-green)' : 'var(--text-secondary)',
                            border: selectedChapter.id === chapter.id ? '1px solid var(--neon-green)' : '1px solid transparent'
                        }}
                        onMouseEnter={(e) => {
                            if(selectedChapter.id !== chapter.id) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = 'var(--text-white)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if(selectedChapter.id !== chapter.id) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }
                        }}
                    >
                        <i className={`fa-solid ${chapter.icon}`} style={{width: '20px', textAlign: 'center'}}></i>
                        <span style={{fontSize: '14px', fontWeight: '500'}}>{chapter.title}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* --- CỘT PHẢI: NỘI DUNG (READER) --- */}
        <div className="card-dark" style={{ 
            flex: 1, 
            borderRadius: '12px', 
            padding: '40px',
            border: '1px solid var(--border-color)',
            background: '#0D1825', // Nền tối hơn nền card một chút để làm nổi nội dung
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)', // Đổ bóng trong tạo chiều sâu
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Hiệu ứng trang trí góc */}
            <div style={{position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(46,255,123,0.1) 0%, transparent 70%)', pointerEvents: 'none'}}></div>

            <div className="content-reader fade-in">
                {/* Header Bài viết */}
                <div style={{marginBottom: '30px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '20px'}}>
                    <h1 style={{color: 'var(--text-white)', fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <span style={{
                            background: 'var(--neon-green)', color: '#000', width: '40px', height: '40px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '20px'
                        }}>
                            <i className={`fa-solid ${selectedChapter.icon}`}></i>
                        </span>
                        {selectedChapter.title}
                    </h1>
                </div>

                {/* Nội dung bài viết */}
                <div style={{
                    color: '#D1D5DB', // Màu chữ xám bạc dễ đọc
                    fontSize: '15px',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-line', // Quan trọng: giữ xuống dòng
                    fontFamily: "'Roboto', sans-serif"
                }}>
                    {selectedChapter.content}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default InternBook;