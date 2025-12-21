/* FILE: frontend/src/views/InternBook.jsx */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const InternBook = () => {
  const [interns, setInterns] = useState([]);
  const [filter, setFilter] = useState('All');
  const [showReviewModal, setShowReviewModal] = useState(null);

  // 1. KẾT NỐI DỮ LIỆU THẬT TỪ DATABASE
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/candidates`)
      .then(res => {
        // --- LOGIC MỚI: CHỈ LẤY TRẠNG THÁI 'HIRED' ---
        const hiredInterns = res.data.filter(c => 
            (c.status || '').toLowerCase() === 'hired'
        ).map(c => ({
            ...c,
            // Nếu thiếu thông tin thì điền mặc định để giao diện không bị lỗi
            department: c.department || 'Chưa phân bổ',
            mentor: c.mentor || 'Chưa có Mentor',
            progress: c.progress || 0, 
            startDate: c.created_at || new Date().toISOString()
        }));
        
        setInterns(hiredInterns);
      })
      .catch(err => console.warn("Lỗi API:", err));
  }, []);

  const getStatusStyle = (status) => {
      // Vì đã vào đây thì mặc định là đang làm việc hoặc sắp làm
      return { color: 'var(--neon-green)', bg: 'rgba(46, 255, 123, 0.1)', border: 'var(--neon-green)' };
  };

  return (
    <div className="intern-book-view" style={{ color: 'var(--text-white)', minHeight: 'calc(100vh - 100px)' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '30px' }}>
        <h2 className="section-title" style={{ color: 'var(--neon-green)', textTransform: 'uppercase' }}>
            <i className="fa-solid fa-users-viewfinder" style={{marginRight: '10px'}}></i> Quản lý Thực Tập Sinh (Hired)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Danh sách nhân sự đã tuyển dụng chính thức.
        </p>
      </div>

      {/* NẾU KHÔNG CÓ DỮ LIỆU */}
      {interns.length === 0 && (
          <div style={{textAlign: 'center', padding: '50px', color: '#6B7280', border: '1px dashed #2D3B4E', borderRadius: '12px'}}>
              <i className="fa-solid fa-user-plus" style={{fontSize: '40px', marginBottom: '15px'}}></i>
              <p>Chưa có nhân sự nào được chuyển sang trạng thái <b>"Hired"</b>.</p>
              <p style={{fontSize: '12px'}}>Hãy vào Dashboard và kéo ứng viên sang cột Hired.</p>
          </div>
      )}

      {/* DANH SÁCH INTERN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {interns.map(intern => (
            <div key={intern.id} className="card-dark" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#131F2E' }}>
                
                {/* Header Card */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #1A2736, #09121D)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'var(--neon-green)' }}>
                        {intern.full_name ? intern.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#fff' }}>{intern.full_name}</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--neon-green)' }}>{intern.role}</p>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase', height: 'fit-content', color: 'var(--neon-green)', background: 'rgba(46, 255, 123, 0.1)', border: '1px solid var(--neon-green)' }}>
                        HIRED
                    </span>
                </div>

                {/* Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9CA3AF', marginBottom: '15px' }}>
                    <span><i className="fa-solid fa-building-user"></i> {intern.department}</span>
                    <span>Mentor: {intern.mentor}</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '15px', borderTop: '1px dashed #2D3B4E' }}>
                    <button style={{ flex: 1, background: 'transparent', border: '1px solid #2D3B4E', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>Hồ sơ</button>
                    <button 
                        onClick={() => setShowReviewModal(intern)}
                        style={{ flex: 1, background: 'var(--neon-green)', border: 'none', color: '#000', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Đánh giá
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* MODAL ĐÁNH GIÁ (Giữ nguyên như cũ) */}
      {showReviewModal && (
          <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
              <div style={{ background: '#131F2E', width: '500px', padding: '30px', borderRadius: '12px', border: '1px solid var(--neon-green)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--neon-green)' }}>Đánh giá: {showReviewModal.full_name}</h3>
                  <textarea placeholder="Nhận xét chi tiết..." style={{ width: '100%', height: '100px', background: '#09121D', border: '1px solid #2D3B4E', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}></textarea>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button onClick={() => setShowReviewModal(null)} style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>Hủy</button>
                      <button onClick={() => { alert("Đã lưu!"); setShowReviewModal(null); }} style={{ background: 'var(--neon-green)', color: '#000', padding: '8px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Lưu</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InternBook;