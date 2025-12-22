/* FILE: frontend/src/views/InternBook.jsx (Ultimate Version) */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const InternBook = () => {
  const [interns, setInterns] = useState([]);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State quản lý Modal
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);

  // --- HÀM LÀM GIÀU DỮ LIỆU (Tự động điền thông tin nếu DB thiếu) ---
  const enrichInternData = (candidate) => {
      let dept = 'General';
      let mentor = 'HR Manager';
      const role = (candidate.role || '').toLowerCase();

      // Logic đoán phòng ban thông minh
      if (role.includes('data')) { dept = 'Product Data'; mentor = 'Trần Data Lead'; }
      else if (role.includes('marketing')) { dept = 'Growth Marketing'; mentor = 'Lê CMO'; }
      else if (role.includes('dev') || role.includes('engineer')) { dept = 'Engineering'; mentor = 'Nguyễn Tech Lead'; }
      else if (role.includes('hr') || role.includes('human')) { dept = 'Human Resources'; mentor = 'Phạm HRD'; }

      const startDate = new Date(candidate.created_at || Date.now());
      // Random progress demo (trong thực tế sẽ lấy từ DB)
      let progress = candidate.progress || Math.floor(Math.random() * 70) + 20; 

      return {
          ...candidate,
          department: candidate.department || dept,
          mentor: candidate.mentor || mentor,
          startDate: startDate.toLocaleDateString('vi-VN'),
          progress: progress,
          avatarChar: candidate.full_name ? candidate.full_name.charAt(0).toUpperCase() : 'U'
      };
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/candidates`)
      .then(res => {
        // Chỉ lấy những người đã HIRED
        const hiredList = res.data
            .filter(c => (c.status || '').toLowerCase() === 'hired')
            .map(c => enrichInternData(c));
        setInterns(hiredList);
      })
      .catch(err => console.warn("Lỗi API:", err));
  }, []);

  // Xử lý Lưu chỉnh sửa (Cập nhật UI ngay lập tức)
  const handleSaveEdit = () => {
      const updatedList = interns.map(i => 
          i.id === showEditModal.id ? showEditModal : i
      );
      setInterns(updatedList);
      setShowEditModal(null);
      // TODO: Sau này bạn cần gọi API PUT để lưu vào DB thật ở đây
      alert(`Đã cập nhật thông tin cho ${showEditModal.full_name}!`);
  };

  // Filter & Search Logic
  const filteredInterns = interns.filter(intern => {
      const matchFilter = filter === 'All' || (intern.status || 'Active') === filter;
      const matchSearch = intern.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          intern.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
  });

  return (
    <div className="intern-book-view" style={{ color: 'var(--text-white)', minHeight: 'calc(100vh - 100px)' }}>
      
      {/* 1. TOP STATS (Thống kê nhanh) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          {[
              { label: 'Tổng nhân sự', val: interns.length, icon: 'fa-users', color: '#fff' },
              { label: 'Đang Onboarding', val: interns.filter(i => i.progress < 30).length, icon: 'fa-seedling', color: '#FCD34D' },
              { label: 'Sắp tốt nghiệp', val: interns.filter(i => i.progress > 80).length, icon: 'fa-graduation-cap', color: '#A5B4FC' },
              { label: 'Hiệu suất cao', val: interns.filter(i => parseFloat(i.ai_rating) > 8).length, icon: 'fa-bolt', color: 'var(--neon-green)' },
          ].map((stat, idx) => (
              <div key={idx} style={{ background: '#131F2E', padding: '15px 20px', borderRadius: '12px', border: '1px solid #2D3B4E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '5px' }}>{stat.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>{stat.val}</div>
                  </div>
                  <div style={{ fontSize: '20px', color: stat.color, opacity: 0.8 }}><i className={`fa-solid ${stat.icon}`}></i></div>
              </div>
          ))}
      </div>

      {/* 2. TOOLBAR (Search & Filter) */}
      <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <h2 className="section-title" style={{ color: 'var(--neon-green)', textTransform: 'uppercase', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-address-book"></i> Danh Sách Thực Tập
        </h2>
        
        <div style={{ display: 'flex', gap: '15px', flex: 1, justifyContent: 'flex-end' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', width: '300px' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: '14px' }}></i>
                <input 
                    type="text" 
                    placeholder="Tìm kiếm theo tên hoặc email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                        width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', 
                        background: '#0D1825', border: '1px solid #2D3B4E', color: '#fff', fontSize: '13px' 
                    }}
                />
            </div>
            
            {/* Filter Tabs */}
            <div style={{ background: '#131F2E', padding: '4px', borderRadius: '8px', border: '1px solid #2D3B4E', display: 'flex', gap: '5px' }}>
                {['All', 'Active', 'Onboarding'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} 
                        style={{
                            background: filter === f ? 'rgba(46, 255, 123, 0.15)' : 'transparent',
                            color: filter === f ? 'var(--neon-green)' : '#9CA3AF',
                            border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', transition: 'all 0.2s'
                        }}>
                        {f}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* 3. GRID VIEW (IMPROVED CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredInterns.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', border: '2px dashed #2D3B4E', borderRadius: '12px', color: '#6B7280' }}>
                <i className="fa-solid fa-user-slash" style={{ fontSize: '40px', marginBottom: '15px' }}></i>
                <p>Không tìm thấy nhân sự phù hợp.</p>
            </div>
        ) : (
            filteredInterns.map(intern => (
                <div key={intern.id} style={{ 
                    background: '#131F2E', borderRadius: '12px', padding: '20px',
                    border: '1px solid #2D3B4E', position: 'relative',
                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '15px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--neon-green)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D3B4E'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    {/* Header: Avatar + Info + Edit Button */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                        <div style={{ 
                            width: '50px', height: '50px', borderRadius: '12px', flexShrink: 0,
                            background: 'linear-gradient(135deg, #0D1825, #1A2736)', border: '1px solid var(--neon-green)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '20px', fontWeight: 'bold', color: '#fff',
                            boxShadow: '0 0 10px rgba(46, 255, 123, 0.2)'
                        }}>
                            {intern.avatarChar}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{intern.full_name}</h3>
                            <p style={{ margin: '3px 0 0', color: 'var(--neon-green)', fontSize: '12px', fontWeight: '500' }}>{intern.role}</p>
                        </div>
                        
                        {/* NÚT CHỈNH SỬA (Đã làm nổi bật) */}
                        <button 
                            onClick={() => setShowEditModal(intern)}
                            title="Chỉnh sửa thông tin"
                            style={{ 
                                background: 'rgba(46, 255, 123, 0.1)', border: '1px solid var(--neon-green)', 
                                color: 'var(--neon-green)', width: '32px', height: '32px', borderRadius: '8px', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--neon-green)'; e.currentTarget.style.color = '#000'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(46, 255, 123, 0.1)'; e.currentTarget.style.color = 'var(--neon-green)'; }}
                        >
                            <i className="fa-solid fa-pen" style={{ fontSize: '14px' }}></i>
                        </button>
                    </div>

                    {/* Data Grid */}
                    <div style={{ background: '#0D1825', padding: '12px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', border: '1px solid #1F2937' }}>
                        <div>
                            <span style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>Phòng ban</span>
                            <div style={{ fontSize: '13px', color: '#E0E0E0', fontWeight: '500', marginTop: '2px' }}>{intern.department}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>Mentor</span>
                            <div style={{ fontSize: '13px', color: '#E0E0E0', fontWeight: '500', marginTop: '2px' }}>{intern.mentor}</div>
                        </div>
                        <div style={{ gridColumn: '1/-1', borderTop: '1px dashed #2D3B4E', paddingTop: '8px', marginTop: '5px' }}>
                            <span style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>Email liên hệ</span>
                            <div style={{ fontSize: '13px', color: '#E0E0E0', marginTop: '2px' }}>{intern.email}</div>
                        </div>
                    </div>

                    {/* Footer: Progress & Review */}
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: '#9CA3AF' }}>
                                <span>Tiến độ</span>
                                <span style={{ color: 'var(--neon-green)' }}>{intern.progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '5px', background: '#2D3B4E', borderRadius: '3px' }}>
                                <div style={{ width: `${intern.progress}%`, height: '100%', background: 'var(--neon-green)', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowReviewModal(intern)}
                            style={{ 
                                background: '#2D3B4E', border: 'none', color: '#fff', 
                                padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#4B5563'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#2D3B4E'; }}
                        >
                            Đánh giá
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* --- MODAL EDIT (Chỉnh sửa thông tin) --- */}
      {showEditModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
              <div style={{ background: '#131F2E', width: '400px', padding: '25px', borderRadius: '12px', border: '1px solid #2D3B4E', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', borderBottom: '1px solid #2D3B4E', paddingBottom: '10px' }}>
                      <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--neon-green)', marginRight: '10px' }}></i>
                      Cập nhật thông tin
                  </h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '5px' }}>Họ và tên</label>
                      <input 
                        value={showEditModal.full_name} disabled
                        style={{ width: '100%', padding: '10px', background: '#0D1825', border: '1px solid #2D3B4E', color: '#6B7280', borderRadius: '6px', cursor: 'not-allowed' }} 
                      />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#fff', marginBottom: '5px' }}>Phòng ban / Bộ phận</label>
                      <input 
                        value={showEditModal.department} 
                        onChange={(e) => setShowEditModal({...showEditModal, department: e.target.value})}
                        style={{ width: '100%', padding: '10px', background: '#0D1825', border: '1px solid #2D3B4E', color: '#fff', borderRadius: '6px', fontSize: '14px' }} 
                      />
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#fff', marginBottom: '5px' }}>Mentor hướng dẫn</label>
                      <input 
                        value={showEditModal.mentor} 
                        onChange={(e) => setShowEditModal({...showEditModal, mentor: e.target.value})}
                        style={{ width: '100%', padding: '10px', background: '#0D1825', border: '1px solid #2D3B4E', color: '#fff', borderRadius: '6px', fontSize: '14px' }} 
                      />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button onClick={() => setShowEditModal(null)} style={{ background: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'pointer', padding: '8px 15px' }}>Hủy bỏ</button>
                      <button onClick={handleSaveEdit} style={{ background: 'var(--neon-green)', color: '#000', padding: '10px 25px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Lưu thay đổi</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL REVIEW (Đánh giá) --- */}
      {showReviewModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
              <div style={{ background: '#131F2E', width: '450px', padding: '30px', borderRadius: '16px', border: '1px solid var(--neon-green)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--neon-green)' }}>Đánh giá hiệu suất</h3>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px' }}>Nhân sự: <b>{showReviewModal.full_name}</b></p>
                  
                  {['Kỹ năng chuyên môn', 'Thái độ & Kỷ luật', 'Teamwork'].map(c => (
                      <div key={c} style={{ marginBottom: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff', marginBottom: '5px' }}>
                              <span>{c}</span><span style={{ color: 'var(--neon-green)' }}>Tốt</span>
                          </div>
                          <input type="range" style={{ width: '100%', accentColor: 'var(--neon-green)' }} />
                      </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                      <button onClick={() => setShowReviewModal(null)} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>Đóng</button>
                      <button onClick={() => { alert("Đã lưu!"); setShowReviewModal(null); }} style={{ background: 'var(--neon-green)', color: '#000', padding: '8px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Gửi đánh giá</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default InternBook;