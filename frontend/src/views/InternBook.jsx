/* FILE: frontend/src/views/InternBook.jsx (Theme Compatible Fix) */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const InternBook = () => {
  const [interns, setInterns] = useState([]);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Modal
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);

  // State đánh giá
  const [ratings, setRatings] = useState({ skill: 8, attitude: 9, teamwork: 7 });
  const [reviewNote, setReviewNote] = useState('');

  // --- CSS STYLE (ĐÃ FIX MÀU CỨNG) ---
  const customStyles = `
    .glass-modal {
        background: var(--bg-tertiary); /* Sửa: Dùng biến thay màu cứng */
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--border-color);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        animation: modalFadeIn 0.3s ease-out forwards;
        color: var(--text-primary); /* Sửa: Chữ đổi màu theo theme */
    }
    @keyframes modalFadeIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .neon-range {
        -webkit-appearance: none; width: 100%; height: 6px; 
        background: var(--border-color); /* Sửa */
        border-radius: 3px; outline: none;
    }
    .neon-range::-webkit-slider-thumb {
        -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
        background: var(--accent-color); cursor: pointer; box-shadow: 0 0 10px var(--accent-glow);
        margin-top: -6px;
    }
    .neon-textarea {
        width: 100%; 
        background: var(--bg-input); /* Sửa */
        border: 1px solid var(--border-color);
        color: var(--text-primary); /* Sửa */
        padding: 15px; border-radius: 12px; resize: none; font-family: inherit; line-height: 1.6;
        transition: all 0.3s;
    }
    .neon-textarea:focus {
        border-color: var(--accent-color); outline: none;
        box-shadow: 0 0 10px var(--accent-glow);
    }
    .neon-input {
        width: 100%; padding: 12px; 
        background: var(--bg-input); /* Sửa */
        border: 1px solid var(--border-color); 
        color: var(--text-primary); /* Sửa */
        borderRadius: 8px; outline: none;
        transition: all 0.3s;
    }
    .neon-input:focus {
        border-color: var(--accent-color);
        box-shadow: 0 0 10px var(--accent-glow);
    }
  `;

  const enrichInternData = (candidate) => {
      let dept = 'General';
      let mentor = 'HR Manager';
      const role = (candidate.role || '').toLowerCase();

      if (role.includes('data')) { dept = 'Product Data'; mentor = 'Trần Data Lead'; }
      else if (role.includes('marketing')) { dept = 'Growth Marketing'; mentor = 'Lê CMO'; }
      else if (role.includes('dev') || role.includes('engineer')) { dept = 'Engineering'; mentor = 'Nguyễn Tech Lead'; }
      else if (role.includes('hr')) { dept = 'Human Resources'; mentor = 'Phạm HRD'; }

      const startDate = new Date(candidate.created_at || Date.now());
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
        const hiredList = res.data
            .filter(c => (c.status || '').toLowerCase() === 'hired')
            .map(c => enrichInternData(c));
        setInterns(hiredList);
      })
      .catch(err => console.warn("Lỗi API:", err));
  }, []);

  const handleSaveEdit = () => {
      const updatedList = interns.map(i => i.id === showEditModal.id ? showEditModal : i);
      setInterns(updatedList);
      setShowEditModal(null);
  };

  const filteredInterns = interns.filter(intern => {
      const matchFilter = filter === 'All' || (intern.status || 'Active') === filter;
      const matchSearch = intern.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          intern.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
  });

  return (
    <div className="intern-book-view" style={{ color: 'var(--text-primary)', minHeight: 'calc(100vh - 100px)' }}>
      <style>{customStyles}</style>
      
      {/* TOOLBAR */}
      <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h2 className="section-title" style={{ color: 'var(--accent-color)', textTransform: 'uppercase', margin: 0, fontSize: '20px', letterSpacing: '1px' }}>
                <i className="fa-solid fa-address-book" style={{marginRight: '10px'}}></i> Sổ Tay Thực Tập
            </h2>
            <p style={{margin:'5px 0 0', fontSize:'13px', color:'var(--text-secondary)'}}>Quản lý {interns.length} nhân sự đang làm việc</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '13px' }}></i>
                <input 
                    type="text" placeholder="Tìm kiếm..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '8px 15px 8px 35px', borderRadius: '20px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '13px', width: '250px' }}
                />
            </div>
        </div>
      </div>

      {/* --- CARD GRID (THEME FIXED) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredInterns.map(intern => (
            <div key={intern.id} style={{ 
                /* QUAN TRỌNG: Thay Gradient cứng bằng biến nền */
                background: 'var(--bg-tertiary)', 
                borderRadius: '16px', padding: '20px',
                border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: 'var(--card-shadow)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
                {/* Decorative Blob (Giữ nguyên nhưng giảm opacity để hợp Light mode) */}
                <div style={{position:'absolute', top:'-20px', right:'-20px', width:'100px', height:'100px', background:'var(--accent-color)', filter:'blur(60px)', opacity:'0.1', borderRadius:'50%'}}></div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', position:'relative', zIndex: 1 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ 
                            width: '55px', height: '55px', borderRadius: '14px', 
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)',
                            boxShadow: 'var(--card-shadow)'
                        }}>
                            {intern.avatarChar}
                        </div>
                        <div style={{position:'absolute', bottom:'-5px', right:'-5px', width:'20px', height:'20px', background:'var(--bg-tertiary)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <div style={{width:'12px', height:'12px', background:'var(--accent-color)', borderRadius:'50%', boxShadow:'0 0 5px var(--accent-glow)'}}></div>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {/* QUAN TRỌNG: Text Primary thay vì #fff */}
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{intern.full_name}</h3>
                        <p style={{ margin: '4px 0 0', color: 'var(--accent-color)', fontSize: '12px', fontWeight: '600', letterSpacing:'0.5px' }}>{intern.role}</p>
                    </div>

                    <button 
                        onClick={() => setShowEditModal(intern)}
                        style={{ 
                            background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', 
                            width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-color)'; e.currentTarget.style.color = '#000'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <i className="fa-solid fa-pen" style={{ fontSize: '12px' }}></i>
                    </button>
                </div>

                <div style={{ marginTop: '20px', background: 'var(--bg-input)', padding: '15px', borderRadius: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight:'700' }}>Phòng ban</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{intern.department}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight:'700' }}>Mentor</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{intern.mentor}</div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{flex:1}}>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'5px'}}>
                            <span style={{color:'var(--text-secondary)'}}>Tiến độ</span>
                            <span style={{color:'var(--accent-color)', fontWeight:'bold'}}>{intern.progress}%</span>
                        </div>
                        <div style={{width:'100%', height:'4px', background:'var(--border-color)', borderRadius:'2px', overflow:'hidden'}}>
                            <div style={{width:`${intern.progress}%`, height:'100%', background:'var(--accent-color)', boxShadow:'0 0 10px var(--accent-glow)'}}></div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowReviewModal(intern)}
                        style={{
                            background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)',
                            padding: '6px 15px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                            textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-color)'; e.currentTarget.style.color = '#000'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                    >
                        Đánh giá
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* --- MODAL REVIEW --- */}
      {showReviewModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)' }}>
              <div className="glass-modal" style={{ width: '500px', borderRadius: '20px', overflow: 'hidden' }}>
                  {/* Modal Header */}
                  <div style={{ padding: '25px', borderBottom: '1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>Đánh giá hiệu suất</h3>
                          <p style={{ margin: '5px 0 0', color: 'var(--accent-color)', fontSize: '13px' }}>Nhân sự: {showReviewModal.full_name}</p>
                      </div>
                      <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--bg-input)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📝</div>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '30px' }}>
                      <div style={{ display:'grid', gap:'25px' }}>
                          {['Kỹ năng chuyên môn', 'Thái độ & Kỷ luật', 'Khả năng Teamwork'].map((criteria, idx) => {
                              const key = idx === 0 ? 'skill' : idx === 1 ? 'attitude' : 'teamwork';
                              return (
                                  <div key={key}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{criteria}</span>
                                          <span style={{ fontSize: '13px', color: 'var(--accent-color)', fontWeight: 'bold' }}>{ratings[key]}/10</span>
                                      </div>
                                      <input 
                                        type="range" min="1" max="10" 
                                        value={ratings[key]} 
                                        onChange={(e) => setRatings({...ratings, [key]: parseInt(e.target.value)})}
                                        className="neon-range"
                                      />
                                  </div>
                              );
                          })}
                          
                          <div>
                              <label style={{display:'block', fontSize:'13px', color:'var(--text-secondary)', marginBottom:'10px', fontWeight:'500'}}>Nhận xét chi tiết</label>
                              <textarea 
                                className="neon-textarea" 
                                rows="3" 
                                placeholder="Ghi chú về điểm mạnh, điểm yếu..."
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                              ></textarea>
                          </div>
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div style={{ padding: '20px 30px', background: 'var(--bg-input)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                      <button onClick={() => setShowReviewModal(null)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize:'13px', fontWeight:'600' }}>Hủy bỏ</button>
                      <button onClick={() => { alert("Đã lưu đánh giá thành công!"); setShowReviewModal(null); }} style={{ 
                          background: 'var(--accent-color)', color: '#000', padding: '10px 25px', borderRadius: '10px', 
                          border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize:'13px',
                          boxShadow: '0 0 20px var(--accent-glow)'
                      }}>
                          Lưu & Gửi
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL EDIT --- */}
      {showEditModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)' }}>
              <div className="glass-modal" style={{ width: '420px', borderRadius: '20px', padding:'30px' }}>
                  <h3 style={{ margin: '0 0 25px 0', color: 'var(--text-primary)', fontSize: '20px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <i className="fa-solid fa-pen-to-square" style={{color:'var(--accent-color)'}}></i> Cập nhật thông tin
                  </h3>
                  
                  <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Phòng ban / Bộ phận</label>
                      <input 
                        className="neon-input"
                        value={showEditModal.department} 
                        onChange={(e) => setShowEditModal({...showEditModal, department: e.target.value})}
                      />
                  </div>
                  <div style={{ marginBottom: '30px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Mentor hướng dẫn</label>
                      <input 
                        className="neon-input"
                        value={showEditModal.mentor} 
                        onChange={(e) => setShowEditModal({...showEditModal, mentor: e.target.value})}
                      />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button onClick={() => setShowEditModal(null)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', padding: '10px' }}>Hủy</button>
                      <button onClick={handleSaveEdit} style={{ background: 'var(--accent-color)', color: '#000', padding: '10px 25px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Lưu thay đổi</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default InternBook;