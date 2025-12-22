/* FILE: frontend/src/views/InternBook.jsx (Aesthetic Upgrade) */
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

  // State đánh giá (Review)
  const [ratings, setRatings] = useState({ skill: 8, attitude: 9, teamwork: 7 });
  const [reviewNote, setReviewNote] = useState('');

  // --- STYLE CSS NÂNG CAO (Custom Slider & Animations) ---
  const customStyles = `
    .glass-modal {
        background: rgba(13, 24, 37, 0.85);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(46, 255, 123, 0.2);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        animation: modalFadeIn 0.3s ease-out forwards;
    }
    @keyframes modalFadeIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }
    /* Custom Range Slider */
    .neon-range {
        -webkit-appearance: none; width: 100%; height: 6px; background: #1A2736; border-radius: 3px; outline: none;
    }
    .neon-range::-webkit-slider-thumb {
        -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
        background: var(--neon-green); cursor: pointer; box-shadow: 0 0 10px var(--neon-green);
        margin-top: -6px; /* Căn giữa thumb */
    }
    .neon-range::-webkit-slider-runnable-track {
        width: 100%; height: 6px; cursor: pointer; background: #2D3B4E; border-radius: 3px;
    }
    /* Textarea đẹp */
    .neon-textarea {
        width: 100%; background: rgba(255,255,255,0.03); border: 1px solid #2D3B4E;
        color: #fff; padding: 15px; border-radius: 12px; resize: none; font-family: inherit; line-height: 1.6;
        transition: all 0.3s;
    }
    .neon-textarea:focus {
        border-color: var(--neon-green); outline: none; background: rgba(46,255,123,0.02);
        box-shadow: 0 0 15px rgba(46, 255, 123, 0.1);
    }
  `;

  // Logic làm giàu dữ liệu (Giữ nguyên logic thông minh cũ)
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

  // Filter
  const filteredInterns = interns.filter(intern => {
      const matchFilter = filter === 'All' || (intern.status || 'Active') === filter;
      const matchSearch = intern.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          intern.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
  });

  return (
    <div className="intern-book-view" style={{ color: 'var(--text-white)', minHeight: 'calc(100vh - 100px)' }}>
      <style>{customStyles}</style>
      
      {/* TOOLBAR */}
      <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h2 className="section-title" style={{ color: 'var(--neon-green)', textTransform: 'uppercase', margin: 0, fontSize: '20px', letterSpacing: '1px' }}>
                <i className="fa-solid fa-address-book" style={{marginRight: '10px'}}></i> Sổ Tay Thực Tập
            </h2>
            <p style={{margin:'5px 0 0', fontSize:'13px', color:'#9CA3AF'}}>Quản lý {interns.length} nhân sự đang làm việc</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: '13px' }}></i>
                <input 
                    type="text" placeholder="Tìm kiếm..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '8px 15px 8px 35px', borderRadius: '20px', background: '#0D1825', border: '1px solid #2D3B4E', color: '#fff', fontSize: '13px', width: '250px' }}
                />
            </div>
        </div>
      </div>

      {/* --- CARD GRID (Modern UI) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredInterns.map(intern => (
            <div key={intern.id} style={{ 
                background: 'linear-gradient(145deg, #131F2E 0%, #0D1825 100%)', borderRadius: '16px', padding: '20px',
                border: '1px solid #2D3B4E', position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--neon-green)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#2D3B4E'; e.currentTarget.style.boxShadow = 'none'; }}
            >
                {/* Decorative Blob */}
                <div style={{position:'absolute', top:'-20px', right:'-20px', width:'100px', height:'100px', background:'var(--neon-green)', filter:'blur(60px)', opacity:'0.1', borderRadius:'50%'}}></div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', position:'relative', zIndex: 1 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ 
                            width: '55px', height: '55px', borderRadius: '14px', 
                            background: '#09121D', border: '1px solid #2D3B4E',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '22px', fontWeight: '800', color: '#fff',
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                        }}>
                            {intern.avatarChar}
                        </div>
                        <div style={{position:'absolute', bottom:'-5px', right:'-5px', width:'20px', height:'20px', background:'#0D1825', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <div style={{width:'12px', height:'12px', background:'var(--neon-green)', borderRadius:'50%', boxShadow:'0 0 5px var(--neon-green)'}}></div>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{intern.full_name}</h3>
                        <p style={{ margin: '4px 0 0', color: 'var(--neon-green)', fontSize: '12px', fontWeight: '600', letterSpacing:'0.5px' }}>{intern.role}</p>
                    </div>

                    {/* Edit Button (Fixed Visibility) */}
                    <button 
                        onClick={() => setShowEditModal(intern)}
                        style={{ 
                            background: 'rgba(255,255,255,0.05)', border: '1px solid #2D3B4E', color: '#9CA3AF', 
                            width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--neon-green)'; e.currentTarget.style.color = '#000'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#9CA3AF'; }}
                    >
                        <i className="fa-solid fa-pen" style={{ fontSize: '12px' }}></i>
                    </button>
                </div>

                <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', fontWeight:'700' }}>Phòng ban</div>
                            <div style={{ fontSize: '13px', color: '#E0E0E0', marginTop: '4px' }}>{intern.department}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase', fontWeight:'700' }}>Mentor</div>
                            <div style={{ fontSize: '13px', color: '#E0E0E0', marginTop: '4px' }}>{intern.mentor}</div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{flex:1}}>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'5px'}}>
                            <span style={{color:'#9CA3AF'}}>Tiến độ</span>
                            <span style={{color:'var(--neon-green)', fontWeight:'bold'}}>{intern.progress}%</span>
                        </div>
                        <div style={{width:'100%', height:'4px', background:'#2D3B4E', borderRadius:'2px', overflow:'hidden'}}>
                            <div style={{width:`${intern.progress}%`, height:'100%', background:'var(--neon-green)', boxShadow:'0 0 10px var(--neon-green)'}}></div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowReviewModal(intern)}
                        style={{
                            background: 'transparent', border: '1px solid var(--neon-green)', color: 'var(--neon-green)',
                            padding: '6px 15px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                            textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--neon-green)'; e.currentTarget.style.color = '#000'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--neon-green)'; }}
                    >
                        Đánh giá
                    </button>
                </div>
            </div>
        ))}
      </div>

      {/* --- AESTHETIC MODAL: REVIEW --- */}
      {showReviewModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)' }}>
              <div className="glass-modal" style={{ width: '500px', borderRadius: '20px', overflow: 'hidden' }}>
                  {/* Modal Header */}
                  <div style={{ padding: '25px', background: 'linear-gradient(90deg, rgba(46,255,123,0.1) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                          <h3 style={{ margin: 0, color: '#fff', fontSize: '20px' }}>Đánh giá hiệu suất</h3>
                          <p style={{ margin: '5px 0 0', color: 'var(--neon-green)', fontSize: '13px' }}>Nhân sự: {showReviewModal.full_name}</p>
                      </div>
                      <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📝</div>
                  </div>

                  {/* Modal Body */}
                  <div style={{ padding: '30px' }}>
                      <div style={{ display:'grid', gap:'25px' }}>
                          {['Kỹ năng chuyên môn', 'Thái độ & Kỷ luật', 'Khả năng Teamwork'].map((criteria, idx) => {
                              const key = idx === 0 ? 'skill' : idx === 1 ? 'attitude' : 'teamwork';
                              return (
                                  <div key={key}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                          <span style={{ fontSize: '13px', color: '#E0E0E0', fontWeight: '500' }}>{criteria}</span>
                                          <span style={{ fontSize: '13px', color: 'var(--neon-green)', fontWeight: 'bold' }}>{ratings[key]}/10</span>
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
                              <label style={{display:'block', fontSize:'13px', color:'#E0E0E0', marginBottom:'10px', fontWeight:'500'}}>Nhận xét chi tiết</label>
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
                  <div style={{ padding: '20px 30px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                      <button onClick={() => setShowReviewModal(null)} style={{ background: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'pointer', fontSize:'13px', fontWeight:'600' }}>Hủy bỏ</button>
                      <button onClick={() => { alert("Đã lưu đánh giá thành công!"); setShowReviewModal(null); }} style={{ 
                          background: 'var(--neon-green)', color: '#000', padding: '10px 25px', borderRadius: '10px', 
                          border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize:'13px',
                          boxShadow: '0 0 20px rgba(46, 255, 123, 0.3)'
                      }}>
                          Lưu & Gửi
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- AESTHETIC MODAL: EDIT (Similar Style) --- */}
      {showEditModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(5px)' }}>
              <div className="glass-modal" style={{ width: '420px', borderRadius: '20px', padding:'30px' }}>
                  <h3 style={{ margin: '0 0 25px 0', color: '#fff', fontSize: '20px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <i className="fa-solid fa-pen-to-square" style={{color:'var(--neon-green)'}}></i> Cập nhật thông tin
                  </h3>
                  
                  <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>Phòng ban / Bộ phận</label>
                      <input 
                        value={showEditModal.department} 
                        onChange={(e) => setShowEditModal({...showEditModal, department: e.target.value})}
                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid #2D3B4E', color: '#fff', borderRadius: '8px', outline:'none' }} 
                      />
                  </div>
                  <div style={{ marginBottom: '30px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>Mentor hướng dẫn</label>
                      <input 
                        value={showEditModal.mentor} 
                        onChange={(e) => setShowEditModal({...showEditModal, mentor: e.target.value})}
                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid #2D3B4E', color: '#fff', borderRadius: '8px', outline:'none' }} 
                      />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button onClick={() => setShowEditModal(null)} style={{ background: 'transparent', color: '#9CA3AF', border: 'none', cursor: 'pointer', padding: '10px' }}>Hủy</button>
                      <button onClick={handleSaveEdit} style={{ background: 'var(--neon-green)', color: '#000', padding: '10px 25px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Lưu thay đổi</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default InternBook;