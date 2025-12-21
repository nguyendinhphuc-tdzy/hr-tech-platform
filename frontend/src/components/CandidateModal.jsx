/* FILE: frontend/src/components/CandidateModal.jsx (Đã thêm trạng thái Hired) */
import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from './config';

const CandidateModal = ({ candidate, onClose, onUpdate }) => {
  if (!candidate) return null;
  const aiData = candidate.ai_analysis || {};
  
  // State quản lý status trong modal
  const [status, setStatus] = useState(candidate.status || 'Screening');
  const [updating, setUpdating] = useState(false);

  // Hàm đổi trạng thái thủ công
  const handleStatusChange = async (e) => {
      const newStatus = e.target.value;
      setStatus(newStatus);
      setUpdating(true);
      try {
          await axios.put(`${API_BASE_URL}/api/candidates/${candidate.id}/status`, { status: newStatus });
          if (onUpdate) onUpdate(); // Refresh dashboard
      } catch (err) {
          alert("Lỗi cập nhật: " + err.message);
      } finally {
          setUpdating(false);
      }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(9, 18, 29, 0.85)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)'
    }}>
      <div className="card-dark" style={{
        width: '95%', height: '92%', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 0 40px rgba(46, 255, 123, 0.15)', background: '#0D1825', border: '1px solid var(--border-color)'
      }}>
        
        {/* --- HEADER --- */}
        <div style={{
          padding: '15px 25px', borderBottom: '1px solid var(--border-color)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-background)'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
            <div>
                <h2 style={{margin: 0, fontSize: '20px', color: 'var(--text-white)'}}>{candidate.full_name}</h2>
                <p style={{margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)'}}>
                    <i className="fa-solid fa-briefcase" style={{marginRight:'5px'}}></i> {candidate.role}
                </p>
            </div>

            {/* COMBOBOX CHUYỂN TRẠNG THÁI */}
            <div style={{display:'flex', alignItems:'center', gap:'10px', background:'#1A2736', padding:'5px 15px', borderRadius:'30px', border:'1px solid var(--border-color)'}}>
                <span style={{fontSize:'12px', color:'var(--text-secondary)'}}>Giai đoạn:</span>
                <select 
                    value={status} 
                    onChange={handleStatusChange}
                    disabled={updating}
                    style={{
                        background:'transparent', border:'none', color:'var(--neon-green)', fontWeight:'700', cursor:'pointer', fontSize:'14px', outline:'none', padding: 0
                    }}
                >
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Hired">✅ Hired (Tuyển dụng)</option> {/* Thêm option Hired */}
                    <option value="Rejected">Rejected</option>
                </select>
                {updating && <i className="fa-solid fa-circle-notch fa-spin" style={{fontSize:'12px', color:'var(--text-white)'}}></i>}
            </div>
          </div>
          
          <button onClick={onClose} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', 
                fontSize: '20px', cursor: 'pointer', color: 'var(--text-white)', 
                width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'
            }}>
            &times;
          </button>
        </div>

        {/* --- BODY --- */}
        <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
          
          {/* TRÁI: PDF VIEWER */}
          <div style={{flex: 1, borderRight: '1px solid var(--border-color)', background: '#1A2736'}}>
            {candidate.cv_file_url ? (
              <iframe src={candidate.cv_file_url} width="100%" height="100%" style={{border: 'none'}} title="CV Preview"></iframe>
            ) : (
              <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'}}>
                 <div style={{textAlign:'center'}}>
                    <i className="fa-solid fa-file-pdf" style={{fontSize: '60px', marginBottom: '15px', opacity: 0.5}}></i>
                    <p>Không có file CV gốc</p>
                 </div>
              </div>
            )}
          </div>

          {/* PHẢI: AI ANALYSIS */}
          <div style={{flex: '0 0 480px', padding: '25px', overflowY: 'auto', background: 'var(--bg-deep-black)'}}>
             
             {/* 1. SCORE CARD */}
             <div style={{
                 display:'flex', alignItems: 'center', gap:'20px', marginBottom:'25px', 
                 background: 'linear-gradient(135deg, rgba(46,255,123,0.05), transparent)', 
                 padding:'20px', borderRadius:'12px', border: '1px solid rgba(46, 255, 123, 0.2)'
             }}>
                <div style={{textAlign:'center', minWidth:'80px'}}>
                   <div style={{
                       fontSize:'42px', fontWeight:'800', 
                       color: candidate.ai_rating >= 8 ? 'var(--neon-green)' : (candidate.ai_rating >= 5 ? '#FCD34D' : '#FF4D4D'),
                       textShadow: '0 0 15px rgba(0,0,0,0.5)'
                   }}>
                      {candidate.ai_rating}
                   </div>
                   <div style={{fontSize:'11px', fontWeight:'600', color:'var(--text-secondary)', letterSpacing:'1px'}}>MATCH</div>
                </div>
                <div style={{paddingLeft:'20px', borderLeft:'1px solid var(--border-color)'}}>
                   <h4 style={{margin:0, color:'var(--text-white)', fontSize: '14px', textTransform:'uppercase'}}>
                       <i className="fa-solid fa-robot" style={{marginRight:'8px', color:'#A5B4FC'}}></i> AI Summary
                   </h4>
                   <p style={{margin:'8px 0 0', fontSize:'13px', color:'var(--text-gray)', fontStyle:'italic', lineHeight:'1.5'}}>
                       "{aiData.summary || "Đang chờ phân tích..."}"
                   </p>
                </div>
             </div>

             {/* 2. KỸ NĂNG */}
             <div style={{marginBottom: '25px'}}>
                <h4 style={{display:'flex', alignItems:'center', gap:'10px', color:'var(--text-white)', marginBottom:'15px', fontSize: '14px', textTransform: 'uppercase'}}>
                    <i className="fa-solid fa-bolt" style={{color:'#F59E0B'}}></i> Kỹ năng nổi bật
                </h4>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {aiData.skills && aiData.skills.length > 0 ? (
                        aiData.skills.map((skill, idx) => (
                            <span key={idx} style={{
                                background: '#131F2E', color: 'var(--text-white)', 
                                padding: '6px 12px', borderRadius: '4px', 
                                fontSize: '12px', fontWeight: '500', 
                                border: '1px solid var(--border-color)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                {skill}
                            </span>
                        ))
                    ) : ( <span style={{color:'var(--text-secondary)', fontSize:'13px', fontStyle: 'italic'}}>Chưa xác định kỹ năng</span> )}
                </div>
             </div>
             
             {/* 3. CHI TIẾT ĐÁNH GIÁ */}
             <div>
                <h4 style={{display:'flex', alignItems:'center', gap:'10px', color:'var(--text-white)', marginBottom:'15px', fontSize: '14px', textTransform: 'uppercase'}}>
                    <i className="fa-solid fa-list-check" style={{color:'#3B82F6'}}></i> Chi tiết đánh giá
                </h4>
                <div style={{
                    fontSize:'13px', lineHeight:'1.8', color:'var(--text-gray)', 
                    background:'rgba(255,255,255,0.03)', padding:'15px', borderRadius:'8px',
                    whiteSpace: 'pre-line', // Quan trọng để xuống dòng
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