/* FILE: frontend/src/views/InternBook.jsx (Pro UI Upgrade) */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const InternBook = () => {
  const [interns, setInterns] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showReviewModal, setShowReviewModal] = useState(null);

  // --- HÀM GIẢ LẬP THÔNG TIN (Dùng để lấp đầy dữ liệu thiếu từ DB) ---
  const enrichInternData = (candidate) => {
      // Tự động đoán phòng ban dựa trên vị trí
      let dept = 'General Dept';
      let mentor = 'HR Manager';
      const role = (candidate.role || '').toLowerCase();

      if (role.includes('data')) { dept = 'Product Data Team'; mentor = 'Trần Văn Senior'; }
      else if (role.includes('marketing')) { dept = 'Marketing & Growth'; mentor = 'Lê Thị CMO'; }
      else if (role.includes('engineer') || role.includes('dev')) { dept = 'Engineering Hub'; mentor = 'Nguyễn Tech Lead'; }
      else if (role.includes('security')) { dept = 'Cyber Security Center'; mentor = 'Phạm CISO'; }

      // Giả lập ngày bắt đầu là ngày tạo hồ sơ
      const startDate = new Date(candidate.created_at || Date.now());
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3); // Kỳ thực tập 3 tháng

      // Tính % tiến độ giả định (dựa trên ngày hiện tại)
      const totalTime = endDate - startDate;
      const elapsedTime = new Date() - startDate;
      let progress = Math.round((elapsedTime / totalTime) * 100);
      if (progress < 0) progress = 0; if (progress > 100) progress = 100;

      return {
          ...candidate,
          department: dept,
          mentor: mentor,
          startDate: startDate.toLocaleDateString('vi-VN'),
          endDate: endDate.toLocaleDateString('vi-VN'),
          progress: progress
      };
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/candidates`)
      .then(res => {
        // Chỉ lấy trạng thái 'Hired' và bổ sung thông tin
        const hiredList = res.data
            .filter(c => (c.status || '').toLowerCase() === 'hired')
            .map(c => enrichInternData(c));
        setInterns(hiredList);
      })
      .catch(err => console.warn("Lỗi API:", err));
  }, []);

  return (
    <div className="intern-book-view" style={{ color: 'var(--text-white)', minHeight: 'calc(100vh - 100px)' }}>
      
      {/* HEADER & STATS */}
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
            <h2 className="section-title" style={{ color: 'var(--neon-green)', textTransform: 'uppercase', marginBottom: '5px' }}>
                <i className="fa-solid fa-address-card" style={{marginRight: '10px'}}></i> Hồ Sơ Thực Tập Sinh
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                Danh sách nhân sự HIRED ({interns.length})
            </p>
        </div>
        
        {/* Bộ lọc nhanh */}
        <div style={{background: '#131F2E', padding: '5px', borderRadius: '8px', border: '1px solid #2D3B4E'}}>
            {['All', 'Active', 'Onboarding'].map(f => (
                <button key={f} onClick={() => setFilter(f)} 
                    style={{
                        background: filter === f ? 'var(--neon-green)' : 'transparent',
                        color: filter === f ? '#000' : '#fff',
                        border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px'
                    }}>
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* --- GRID VIEW (THẺ NHÂN VIÊN) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '25px' }}>
        {interns.length === 0 ? (
            <div style={{gridColumn: '1/-1', textAlign:'center', padding:'50px', border:'2px dashed #2D3B4E', borderRadius:'12px', color:'#6B7280'}}>
                <i className="fa-solid fa-user-slash" style={{fontSize:'40px', marginBottom:'15px'}}></i>
                <p>Chưa có nhân sự nào. Hãy vào Dashboard kéo ứng viên sang cột <b>HIRED</b>.</p>
            </div>
        ) : (
            interns.map(intern => (
                <div key={intern.id} className="intern-card" style={{ 
                    background: '#131F2E', borderRadius: '16px', overflow: 'hidden', 
                    border: '1px solid #2D3B4E', position: 'relative',
                    transition: 'transform 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--neon-green)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#2D3B4E'; }}
                >
                    {/* Header Card (Màu Gradient) */}
                    <div style={{ height: '80px', background: 'linear-gradient(90deg, rgba(46,255,123,0.1) 0%, rgba(13,24,37,1) 100%)', borderBottom: '1px solid #2D3B4E' }}></div>
                    
                    {/* Avatar & Info */}
                    <div style={{ padding: '0 25px 25px', marginTop: '-40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '15px' }}>
                            <div style={{ 
                                width: '80px', height: '80px', borderRadius: '50%', 
                                background: '#0D1825', border: '3px solid var(--neon-green)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '30px', fontWeight: 'bold', color: '#fff',
                                boxShadow: '0 0 20px rgba(46,255,123,0.2)'
                            }}>
                                {intern.full_name ? intern.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span style={{ 
                                background: 'rgba(46, 255, 123, 0.15)', color: 'var(--neon-green)', 
                                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', 
                                border: '1px solid var(--neon-green)', textTransform: 'uppercase', marginBottom: '5px'
                            }}>
                                Active Intern
                            </span>
                        </div>

                        <h3 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '18px' }}>{intern.full_name}</h3>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', display:'flex', alignItems:'center', gap:'5px' }}>
                            <i className="fa-solid fa-briefcase" style={{color: 'var(--neon-green)'}}></i> {intern.role}
                        </p>

                        {/* Thông tin chi tiết (Grid 2 cột) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px', padding: '15px', background: '#0D1825', borderRadius: '10px', border: '1px solid #2D3B4E' }}>
                            <div>
                                <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 3px' }}>PHÒNG BAN</p>
                                <p style={{ fontSize: '13px', color: '#E0E0E0', fontWeight: '500', margin: 0 }}>{intern.department}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 3px' }}>MENTOR</p>
                                <p style={{ fontSize: '13px', color: '#E0E0E0', fontWeight: '500', margin: 0 }}>{intern.mentor}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 3px' }}>NGÀY BẮT ĐẦU</p>
                                <p style={{ fontSize: '13px', color: '#E0E0E0', fontWeight: '500', margin: 0 }}>{intern.startDate}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '11px', color: '#6B7280', margin: '0 0 3px' }}>EMAIL</p>
                                <p style={{ fontSize: '13px', color: '#E0E0E0', fontWeight: '500', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{intern.email}</p>
                            </div>
                        </div>

                        {/* Thanh Tiến Độ */}
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px', color: '#9CA3AF' }}>
                                <span>Tiến độ thực tập</span>
                                <span style={{ color: 'var(--neon-green)' }}>{intern.progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#2D3B4E', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${intern.progress}%`, height: '100%', background: 'var(--neon-green)', boxShadow: '0 0 10px var(--neon-green)' }}></div>
                            </div>
                        </div>

                        {/* Nút hành động */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                            <button onClick={() => setShowReviewModal(intern)} style={{ flex: 1, padding: '10px', background: 'var(--neon-green)', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', color: '#000' }}>
                                <i className="fa-regular fa-star"></i> Đánh giá
                            </button>
                            <button style={{ width: '40px', background: 'transparent', border: '1px solid #2D3B4E', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>
                                <i className="fa-solid fa-ellipsis"></i>
                            </button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* MODAL ĐÁNH GIÁ (GIỮ NGUYÊN) */}
      {showReviewModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter:'blur(5px)' }}>
              <div style={{ background: '#131F2E', width: '500px', padding: '30px', borderRadius: '16px', border: '1px solid var(--neon-green)', boxShadow: '0 0 50px rgba(46,255,123,0.1)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--neon-green)', fontSize: '20px' }}>Đánh giá: {showReviewModal.full_name}</h3>
                  <p style={{fontSize:'13px', color:'#9CA3AF', marginBottom:'20px'}}>Đánh giá hiệu suất định kỳ tháng này.</p>
                  
                  {['Kỹ năng chuyên môn', 'Thái độ & Kỷ luật', 'Khả năng Teamwork'].map(c => (
                      <div key={c} style={{marginBottom:'15px'}}>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#fff', marginBottom:'5px'}}>
                              <span>{c}</span>
                              <span style={{color:'var(--neon-green)'}}>8/10</span>
                          </div>
                          <input type="range" style={{width:'100%', accentColor:'var(--neon-green)'}} />
                      </div>
                  ))}
                  
                  <textarea placeholder="Nhận xét chi tiết của Mentor..." style={{ width: '100%', height: '100px', background: '#0D1825', border: '1px solid #2D3B4E', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '20px', resize:'none' }}></textarea>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button onClick={() => setShowReviewModal(null)} style={{ background: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'pointer' }}>Hủy bỏ</button>
                      <button onClick={() => { alert("Đã lưu đánh giá!"); setShowReviewModal(null); }} style={{ background: 'var(--neon-green)', color: '#000', padding: '10px 25px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Lưu Kết Quả</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InternBook;