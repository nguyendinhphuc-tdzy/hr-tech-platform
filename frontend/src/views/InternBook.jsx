/* FILE: frontend/src/views/InternBook.jsx (Compact & Editable Version) */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const InternBook = () => {
  const [interns, setInterns] = useState([]);
  const [filter, setFilter] = useState('All');
  
  // State quản lý Modal
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null); // Modal chỉnh sửa thông tin

  // --- HÀM LÀM GIÀU DỮ LIỆU ---
  const enrichInternData = (candidate) => {
      let dept = 'General';
      let mentor = 'HR Manager';
      const role = (candidate.role || '').toLowerCase();

      if (role.includes('data')) { dept = 'Product Team'; mentor = 'Trần Data Lead'; }
      else if (role.includes('marketing')) { dept = 'Marketing'; mentor = 'Lê CMO'; }
      else if (role.includes('dev')) { dept = 'Tech Hub'; mentor = 'Nguyễn Tech Lead'; }

      const startDate = new Date(candidate.created_at || Date.now());
      // Random progress demo
      let progress = Math.floor(Math.random() * 80) + 10; 

      return {
          ...candidate,
          department: candidate.department || dept,
          mentor: candidate.mentor || mentor,
          startDate: startDate.toLocaleDateString('vi-VN'),
          progress: progress
      };
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/candidates`)
      .then(res => {
        const hiredList = res.data
            .filter(c => (c.status || '').toLowerCase() === 'hired')
            .map(c => enrichInternData(c));
        setInterns(hiredList);
      })
      .catch(err => console.warn("Lỗi API:", err));
  }, []);

  // Xử lý Lưu chỉnh sửa
  const handleSaveEdit = () => {
      // Cập nhật lại danh sách local (Ở đây bạn có thể gọi API PUT để lưu thật)
      const updatedList = interns.map(i => 
          i.id === showEditModal.id ? showEditModal : i
      );
      setInterns(updatedList);
      setShowEditModal(null);
      alert("Đã cập nhật thông tin thành công!");
  };

  return (
    <div className="intern-book-view" style={{ color: 'var(--text-white)', minHeight: 'calc(100vh - 100px)' }}>
      
      {/* HEADER NHỎ GỌN */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom:'1px solid #2D3B4E', paddingBottom:'15px' }}>
        <h2 className="section-title" style={{ color: 'var(--neon-green)', textTransform: 'uppercase', margin: 0, fontSize: '18px' }}>
            <i className="fa-solid fa-address-book" style={{marginRight: '10px'}}></i> Sổ Tay Thực Tập ({interns.length})
        </h2>
        
        <div style={{background: '#131F2E', padding: '3px', borderRadius: '6px', border: '1px solid #2D3B4E', display:'flex', gap:'5px'}}>
            {['All', 'Active', 'Onboarding'].map(f => (
                <button key={f} onClick={() => setFilter(f)} 
                    style={{
                        background: filter === f ? 'rgba(46, 255, 123, 0.15)' : 'transparent',
                        color: filter === f ? 'var(--neon-green)' : '#9CA3AF',
                        border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '11px'
                    }}>
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* --- GRID VIEW (COMPACT CARD) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
        {interns.map(intern => (
            <div key={intern.id} style={{ 
                background: '#131F2E', borderRadius: '10px', padding: '15px',
                border: '1px solid #2D3B4E', position: 'relative',
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '12px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--neon-green)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D3B4E'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
                {/* 1. Header Card: Avatar + Tên + Nút Edit */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ 
                        width: '45px', height: '45px', borderRadius: '50%', 
                        background: '#0D1825', border: '2px solid var(--neon-green)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', fontWeight: 'bold', color: '#fff'
                    }}>
                        {intern.full_name ? intern.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{flex: 1, overflow: 'hidden'}}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{intern.full_name}</h3>
                        <p style={{ margin: '2px 0 0', color: 'var(--neon-green)', fontSize: '11px' }}>{intern.role}</p>
                    </div>
                    <button 
                        onClick={() => setShowEditModal(intern)}
                        style={{ background: 'transparent', border: '1px solid #2D3B4E', color: '#9CA3AF', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                        title="Chỉnh sửa thông tin"
                    >
                        <i className="fa-solid fa-pen" style={{fontSize: '12px'}}></i>
                    </button>
                </div>

                {/* 2. Info Grid (Nhỏ gọn) */}
                <div style={{ background: '#0D1825', padding: '10px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontSize:'10px', color:'#6B7280'}}>PHÒNG BAN</span>
                        <span style={{fontSize:'12px', color:'#E0E0E0', fontWeight:'500'}}>{intern.department}</span>
                    </div>
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{fontSize:'10px', color:'#6B7280'}}>MENTOR</span>
                        <span style={{fontSize:'12px', color:'#E0E0E0', fontWeight:'500'}}>{intern.mentor}</span>
                    </div>
                </div>

                {/* 3. Progress & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px', color: '#9CA3AF' }}>
                            <span>Tiến độ</span>
                            <span>{intern.progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: '#2D3B4E', borderRadius: '2px' }}>
                            <div style={{ width: `${intern.progress}%`, height: '100%', background: 'var(--neon-green)' }}></div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowReviewModal(intern)}
                        style={{ background: 'rgba(46, 255, 123, 0.1)', border: '1px solid var(--neon-green)', color: 'var(--neon-green)', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        Đánh giá
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* --- MODAL CHỈNH SỬA THÔNG TIN (EDIT) --- */}
      {showEditModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter:'blur(5px)' }}>
              <div style={{ background: '#131F2E', width: '400px', padding: '25px', borderRadius: '12px', border: '1px solid #2D3B4E' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px' }}>Chỉnh sửa: {showEditModal.full_name}</h3>
                  
                  <div style={{marginBottom:'15px'}}>
                      <label style={{display:'block', fontSize:'12px', color:'#9CA3AF', marginBottom:'5px'}}>Phòng ban</label>
                      <input 
                        value={showEditModal.department} 
                        onChange={(e) => setShowEditModal({...showEditModal, department: e.target.value})}
                        style={{width:'100%', padding:'8px', background:'#0D1825', border:'1px solid #2D3B4E', color:'#fff', borderRadius:'6px'}} 
                      />
                  </div>
                  <div style={{marginBottom:'20px'}}>
                      <label style={{display:'block', fontSize:'12px', color:'#9CA3AF', marginBottom:'5px'}}>Mentor hướng dẫn</label>
                      <input 
                        value={showEditModal.mentor} 
                        onChange={(e) => setShowEditModal({...showEditModal, mentor: e.target.value})}
                        style={{width:'100%', padding:'8px', background:'#0D1825', border:'1px solid #2D3B4E', color:'#fff', borderRadius:'6px'}} 
                      />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button onClick={() => setShowEditModal(null)} style={{ background: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'pointer' }}>Hủy</button>
                      <button onClick={handleSaveEdit} style={{ background: 'var(--neon-green)', color: '#000', padding: '8px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Lưu thay đổi</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL ĐÁNH GIÁ (REVIEW) --- */}
      {showReviewModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter:'blur(5px)' }}>
              <div style={{ background: '#131F2E', width: '450px', padding: '30px', borderRadius: '16px', border: '1px solid var(--neon-green)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--neon-green)' }}>Đánh giá hiệu suất</h3>
                  <p style={{fontSize:'13px', color:'#9CA3AF', marginBottom:'20px'}}>Nhân sự: <b>{showReviewModal.full_name}</b></p>
                  
                  {['Kỹ năng chuyên môn', 'Thái độ & Kỷ luật', 'Teamwork'].map(c => (
                      <div key={c} style={{marginBottom:'15px'}}>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#fff', marginBottom:'5px'}}>
                              <span>{c}</span><span style={{color:'var(--neon-green)'}}>Tốt</span>
                          </div>
                          <input type="range" style={{width:'100%', accentColor:'var(--neon-green)'}} />
                      </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop:'20px' }}>
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