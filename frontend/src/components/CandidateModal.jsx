/* FILE: frontend/src/components/CandidateModal.jsx (Professional & Theme Aware) */
import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from './config';

const CandidateModal = ({ candidate, onClose, onUpdate }) => {
  if (!candidate) return null;
  const aiData = candidate.ai_analysis || {};
  
  // State quản lý status
  const [status, setStatus] = useState(candidate.status || 'Screening');
  const [updating, setUpdating] = useState(false);

  // Hàm đổi trạng thái
  const handleStatusChange = async (e) => {
      const newStatus = e.target.value;
      setStatus(newStatus);
      setUpdating(true);
      try {
          await axios.put(`${API_BASE_URL}/api/candidates/${candidate.id}/status`, { status: newStatus });
          if (onUpdate) onUpdate(); 
      } catch (err) {
          alert("Lỗi cập nhật: " + err.message);
      } finally {
          setUpdating(false);
      }
  };

  // Màu sắc điểm số
  const getScoreColor = (score) => {
      if (score >= 8) return 'var(--accent-color)';
      if (score >= 5) return '#FCD34D';
      return '#FF4D4D';
  };
  const scoreColor = getScoreColor(candidate.ai_rating);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 9999, // Dim background tối hơn để tập trung
      display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)'
    }}>
      <div className="card-modal" style={{
        width: '90%', maxWidth: '1200px', height: '90%', borderRadius: '16px', 
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
        background: 'var(--bg-secondary)', // Nền chính theo theme
        border: '1px solid var(--border-color)'
      }}>
        
        {/* --- HEADER --- */}
        <div style={{
          padding: '20px 30px', borderBottom: '1px solid var(--border-color)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          background: 'var(--bg-tertiary)' // Nền header đậm hơn chút
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
            <div>
                <h2 style={{margin: 0, fontSize: '22px', color: 'var(--text-primary)', fontWeight: '700'}}>{candidate.full_name}</h2>
                <p style={{margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <i className="fa-solid fa-briefcase" style={{color: 'var(--accent-color)'}}></i> {candidate.role}
                    <span style={{fontSize: '12px', opacity: 0.5}}>|</span>
                    <i className="fa-solid fa-envelope" style={{fontSize: '12px'}}></i> {candidate.email}
                </p>
            </div>

            {/* STATUS CHANGER */}
            <div style={{
                display:'flex', alignItems:'center', gap:'10px', 
                background: 'var(--bg-input)', padding: '6px 15px', borderRadius: '30px', 
                border: '1px solid var(--border-color)'
            }}>
                <span style={{fontSize:'12px', color:'var(--text-secondary)', fontWeight: '500'}}>TRẠNG THÁI:</span>
                <select 
                    value={status} 
                    onChange={handleStatusChange}
                    disabled={updating}
                    style={{
                        background:'transparent', border:'none', color: scoreColor, 
                        fontWeight:'700', cursor:'pointer', fontSize:'14px', outline:'none', padding: 0
                    }}
                >
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Hired">✅ HIRED</option>
                    <option value="Rejected">Rejected</option>
                </select>
                {updating && <i className="fa-solid fa-circle-notch fa-spin" style={{fontSize:'12px', color:'var(--text-primary)'}}></i>}
            </div>
          </div>
          
          <button onClick={onClose} style={{
                background: 'transparent', border: '1px solid var(--border-color)', 
                fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)', 
                width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            &times;
          </button>
        </div>

        {/* --- BODY --- */}
        <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
          
          {/* TRÁI: PDF VIEWER (Giữ nguyên nền tối để dễ đọc PDF) */}
          <div style={{flex: 1, borderRight: '1px solid var(--border-color)', background: '#374151'}}> 
            {candidate.cv_file_url ? (
              <iframe src={candidate.cv_file_url} width="100%" height="100%" style={{border: 'none'}} title="CV Preview"></iframe>
            ) : (
              <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB'}}>
                 <div style={{textAlign:'center'}}>
                    <i className="fa-solid fa-file-pdf" style={{fontSize: '60px', marginBottom: '15px', opacity: 0.5}}></i>
                    <p>Không có file CV gốc</p>
                 </div>
              </div>
            )}
          </div>

          {/* PHẢI: AI ANALYSIS (THEME AWARE) */}
          <div style={{
              flex: '0 0 450px', padding: '30px', overflowY: 'auto', 
              background: 'var(--bg-secondary)' // Nền sidebar phải theo theme
          }}>
             
             {/* 1. SCORE CARD (Thiết kế mới) */}
             <div style={{
                 display:'flex', alignItems: 'center', gap:'20px', marginBottom:'30px', 
                 background: 'var(--bg-tertiary)', // Nền card nổi
                 padding:'25px', borderRadius:'16px', border: '1px solid var(--border-color)',
                 boxShadow: 'var(--card-shadow)'
             }}>
                <div style={{textAlign:'center', minWidth:'90px'}}>
                   <div style={{
                       fontSize:'48px', fontWeight:'800', lineHeight: 1,
                       color: scoreColor,
                       textShadow: `0 0 20px ${scoreColor}40` // Glow nhẹ theo màu điểm
                   }}>
                      {candidate.ai_rating}
                   </div>
                   <div style={{fontSize:'11px', fontWeight:'700', color:'var(--text-secondary)', letterSpacing:'1px', marginTop: '5px'}}>MATCH SCORE</div>
                </div>
                <div style={{paddingLeft:'20px', borderLeft:'1px solid var(--border-color)'}}>
                   <h4 style={{margin:0, color:'var(--text-primary)', fontSize: '15px', textTransform:'uppercase', fontWeight: '700'}}>
                       <i className="fa-solid fa-wand-magic-sparkles" style={{marginRight:'8px', color:'var(--accent-color)'}}></i> AI NHẬN XÉT
                   </h4>
                   <p style={{margin:'8px 0 0', fontSize:'14px', color:'var(--text-secondary)', fontStyle:'italic', lineHeight:'1.5'}}>
                       "{aiData.summary || "Đang chờ phân tích..."}"
                   </p>
                </div>
             </div>

             {/* 2. KỸ NĂNG */}
             <div style={{marginBottom: '30px'}}>
                <h4 style={{
                    display:'flex', alignItems:'center', gap:'10px', color:'var(--text-primary)', 
                    marginBottom:'15px', fontSize: '14px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px'
                }}>
                    <i className="fa-solid fa-layer-group" style={{color:'#F59E0B'}}></i> Kỹ năng chuyên môn
                </h4>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                    {aiData.skills && aiData.skills.length > 0 ? (
                        aiData.skills.map((skill, idx) => (
                            <span key={idx} style={{
                                background: 'var(--bg-input)', color: 'var(--text-primary)', 
                                padding: '8px 14px', borderRadius: '8px', 
                                fontSize: '13px', fontWeight: '500', 
                                border: '1px solid var(--border-color)'
                            }}>
                                {skill}
                            </span>
                        ))
                    ) : ( <span style={{color:'var(--text-secondary)', fontSize:'13px', fontStyle: 'italic'}}>Chưa xác định kỹ năng</span> )}
                </div>
             </div>
             
             {/* 3. CHI TIẾT ĐÁNH GIÁ */}
             <div>
                <h4 style={{
                    display:'flex', alignItems:'center', gap:'10px', color:'var(--text-primary)', 
                    marginBottom:'15px', fontSize: '14px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px'
                }}>
                    <i className="fa-solid fa-align-left" style={{color:'#3B82F6'}}></i> Chi tiết phân tích
                </h4>
                <div style={{
                    fontSize:'14px', lineHeight:'1.8', color:'var(--text-primary)', 
                    background:'var(--bg-input)', padding:'20px', borderRadius:'12px',
                    whiteSpace: 'pre-line', // Giữ format xuống dòng
                    border: '1px solid var(--border-color)'
                }}>
                    {aiData.match_reason || "Chưa có dữ liệu chi tiết."}
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateModal;