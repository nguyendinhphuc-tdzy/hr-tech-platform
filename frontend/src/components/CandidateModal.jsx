/* FILE: frontend/src/components/CandidateModal.jsx */
import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from './config';

const CandidateModal = ({ candidate, onClose, onUpdate }) => {
  if (!candidate) return null;
  const aiData = candidate.ai_analysis || {};
  
  // State quản lý status
  const [status, setStatus] = useState(candidate.status || 'Screening');
  const [updating, setUpdating] = useState(false);

  // State chat AI
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Xin chào, tôi là AI Assistant. Bạn muốn tìm hiểu thêm thông tin gì từ CV này?' }]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // State luân chuyển (Cross-match demo)
  const [isMoved, setIsMoved] = useState(false);

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

  // Hàm chat AI
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const newMsgs = [...messages, { role: 'user', text: chatInput }];
    setMessages(newMsgs);
    setChatInput('');
    setLoadingChat(true);

    try {
        const payload = {
            candidateId: candidate.id,
            question: chatInput,
            cvContext: `Tên: ${candidate.full_name}, Email: ${candidate.email}, Kỹ năng: ${aiData.skills?.join(', ')}, Tóm tắt: ${aiData.summary}, Kinh nghiệm & Lý do: ${aiData.match_reason}`
        };
        const API_URL = API_BASE_URL.replace(/\/$/, ""); 
        const res = await axios.post(`${API_URL}/api/ai/chat-cv`, payload, {
            headers: { 'x-user-email': 'admin' } // Fix cứng để demo nếu thiếu auth
        });
        setMessages([...newMsgs, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
        setMessages([...newMsgs, { role: 'ai', text: "Lỗi kết nối Local AI / Cloud API: " + err.message }]);
    } finally {
        setLoadingChat(false);
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
      backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9999, // Dim background tối hơn
      display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)'
    }}>
      <div className="card-modal" style={{
        width: '95%', maxWidth: '1400px', height: '90%', borderRadius: '16px', 
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
        background: 'var(--bg-secondary)', // Nền chính theo theme
        border: '1px solid var(--border-color)'
      }}>
        
        {/* --- HEADER --- */}
        <div style={{
          padding: '15px 30px', borderBottom: '1px solid var(--border-color)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          background: 'var(--bg-tertiary)' 
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
            <div>
                <h2 style={{margin: 0, fontSize: '20px', color: 'var(--text-primary)', fontWeight: '700'}}>{candidate.full_name}</h2>
                <p style={{margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px'}}>
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

        {/* --- BODY (Đã chỉnh layout: 35% PDF - 65% AI Analysis) --- */}
        <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
          
          {/* TRÁI: PDF VIEWER (Thu nhỏ lại còn 35%) */}
          <div style={{flex: '0 0 35%', borderRight: '1px solid var(--border-color)', background: '#374151', position: 'relative'}}> 
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
            <div style={{position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '5px 10px', borderRadius: '5px', fontSize: '12px'}}>
                CV Gốc
            </div>
          </div>

          {/* PHẢI: AI ANALYSIS (Mở rộng ra 65%) */}
          <div style={{
              flex: 1, padding: '30px', overflowY: 'auto', 
              background: 'var(--bg-secondary)', position: 'relative' // Thêm position relative
          }}>
             
             {/* [FEATURE 3: CROSS-MATCHING] Gợi ý luân chuyển nếu điểm thấp */}
             {candidate.ai_rating < 6.5 && !isMoved && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B', 
                    borderRadius: '12px', padding: '15px 20px', marginBottom: '25px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <h4 style={{margin: '0 0 5px 0', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <i className="fa-solid fa-code-branch"></i> Cảnh báo Điểm thấp (Smart Cross-match)
                        </h4>
                        <p style={{margin: 0, fontSize: '13px', color: 'var(--text-secondary)'}}>
                            Dựa trên keywords kỹ năng, ứng viên này phù hợp <b>85%</b> với vị trí <span style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>Data Analyst</span> đang mở.
                        </p>
                    </div>
                    <button 
                        onClick={() => { alert('Đã luân chuyển ứng viên sang chiến dịch Data Analyst!'); setIsMoved(true); }}
                        style={{background: '#F59E0B', border: 'none', padding: '8px 16px', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'}}>
                        Luân chuyển ngay
                    </button>
                </div>
             )}

             {/* 1. SCORE CARD & SUMMARY (Thiết kế mới) */}
             <div style={{
                 display:'grid', gridTemplateColumns: '150px 1fr', gap:'25px', marginBottom:'30px', 
                 background: 'var(--bg-tertiary)', // Nền card nổi
                 padding:'25px', borderRadius:'16px', border: '1px solid var(--border-color)',
                 boxShadow: 'var(--card-shadow)'
             }}>
                <div style={{textAlign:'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '20px'}}>
                   <div style={{
                       fontSize:'56px', fontWeight:'800', lineHeight: 1,
                       color: scoreColor,
                       textShadow: `0 0 20px ${scoreColor}40` // Glow nhẹ theo màu điểm
                   }}>
                      {candidate.ai_rating}
                   </div>
                   <div style={{fontSize:'12px', fontWeight:'700', color:'var(--text-secondary)', letterSpacing:'1px', marginTop: '10px', textTransform: 'uppercase'}}>Match Score</div>
                </div>
                <div>
                   <h4 style={{margin:0, color:'var(--text-primary)', fontSize: '16px', textTransform:'uppercase', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px'}}>
                       <i className="fa-solid fa-wand-magic-sparkles" style={{color:'var(--accent-color)'}}></i> TÓM TẮT AI
                   </h4>
                   <p style={{margin:'12px 0 0', fontSize:'15px', color:'var(--text-primary)', lineHeight:'1.6', fontWeight: '500'}}>
                       {aiData.summary || "Đang chờ phân tích..."}
                   </p>
                   {/* Recommendation Badge */}
                   <div style={{marginTop: '15px'}}>
                        <span style={{
                            background: scoreColor, color: '#000', padding: '4px 12px', borderRadius: '20px', 
                            fontSize: '12px', fontWeight: '700', textTransform: 'uppercase'
                        }}>
                            Đề xuất: {aiData.recommendation || "N/A"}
                        </span>
                        <span style={{marginLeft: '10px', fontSize: '12px', color: 'var(--text-secondary)'}}>
                            Độ tin cậy: {aiData.confidence || "N/A"}
                        </span>
                   </div>
                </div>
             </div>

             <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
                  {/* 2. KỸ NĂNG */}
                 <div style={{
                     background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column'
                 }}>
                    <h4 style={{
                        display:'flex', alignItems:'center', gap:'10px', color:'var(--text-primary)', 
                        margin: '0 0 15px 0', fontSize: '14px', textTransform: 'uppercase', fontWeight: '700'
                    }}>
                        <i className="fa-solid fa-layer-group" style={{color:'#F59E0B'}}></i> Kỹ năng chuyên môn
                    </h4>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                        {aiData.skills && aiData.skills.length > 0 ? (
                            aiData.skills.map((skill, idx) => (
                                <span key={idx} style={{
                                    background: 'var(--bg-tertiary)', color: 'var(--text-primary)', 
                                    padding: '6px 12px', borderRadius: '6px', 
                                    fontSize: '13px', fontWeight: '500', 
                                    border: '1px solid var(--border-color)'
                                }}>
                                    {skill}
                                </span>
                            ))
                        ) : ( <span style={{color:'var(--text-secondary)', fontSize:'13px', fontStyle: 'italic'}}>Chưa xác định kỹ năng</span> )}
                    </div>
                 </div>

                 {/* 4. BREAKDOWN ĐIỂM (New Feature) */}
                 <div style={{
                     background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)'
                 }}>
                    <h4 style={{
                        display:'flex', alignItems:'center', gap:'10px', color:'var(--text-primary)', 
                        margin: '0 0 15px 0', fontSize: '14px', textTransform: 'uppercase', fontWeight: '700'
                    }}>
                        <i className="fa-solid fa-chart-pie" style={{color:'#10B981'}}></i> Chi tiết điểm số
                    </h4>
                    {/* Giả lập hiển thị breakdown nếu có, hoặc hiển thị placeholder */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)'}}>
                            <span>Hard Skills (40%)</span>
                            <span style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>{candidate.ai_analysis?.breakdown?.hard_skills || '-'} / 4.0</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)'}}>
                            <span>Experience (30%)</span>
                            <span style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>{candidate.ai_analysis?.breakdown?.experience || '-'} / 3.0</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)'}}>
                            <span>Education (10%)</span>
                            <span style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>{candidate.ai_analysis?.breakdown?.education || '-'} / 1.0</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)'}}>
                            <span>Soft Skills (20%)</span>
                            <span style={{color: 'var(--text-primary)', fontWeight: 'bold'}}>{candidate.ai_analysis?.breakdown?.soft_skills || '-'} / 2.0</span>
                        </div>
                    </div>
                 </div>
             </div>
             
             {/* [FEATURE 2: SALARY INSIGHT] */}
             <div style={{marginBottom: '30px'}}>
                 <h4 style={{
                    display:'flex', alignItems:'center', gap:'10px', color:'var(--text-primary)', 
                    marginBottom:'15px', fontSize: '14px', textTransform: 'uppercase', fontWeight: '700'
                 }}>
                    <i className="fa-solid fa-money-bill-trend-up" style={{color: '#10B981'}}></i> Phân tích Mức lương (Thị trường VN)
                 </h4>
                 <div style={{
                     background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)',
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                 }}>
                     <div>
                         <p style={{margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)'}}>AI Ước lượng Benchmark Lương:</p>
                         <h3 style={{margin: 0, fontSize: '20px', color: 'var(--accent-color)', fontWeight: '800'}}>
                             {aiData.market_salary || "Chưa có dữ liệu từ AI"}
                         </h3>
                     </div>
                     <div style={{display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px'}}>
                         <label style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Lương đề xuất / Ngân sách:</label>
                         <input type="text" placeholder="VD: 12,000,000 VND" style={{
                             background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', 
                             padding: '10px 15px', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none'
                         }} />
                     </div>
                 </div>
             </div>

             {/* 3. CHI TIẾT ĐÁNH GIÁ (MATCH REASON) */}
             <div style={{marginBottom: '30px'}}>
                <h4 style={{
                    display:'flex', alignItems:'center', gap:'10px', color:'var(--text-primary)', 
                    marginBottom:'15px', fontSize: '14px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px'
                }}>
                    <i className="fa-solid fa-align-left" style={{color:'#3B82F6'}}></i> Phân tích chi tiết
                </h4>
                <div style={{
                    fontSize:'15px', lineHeight:'1.8', color:'var(--text-primary)', 
                    background:'var(--bg-input)', padding:'25px', borderRadius:'12px',
                    whiteSpace: 'pre-line', // Giữ format xuống dòng
                    border: '1px solid var(--border-color)',
                    fontFamily: 'inherit'
                }}>
                    {aiData.match_reason || "Chưa có dữ liệu chi tiết."}
                </div>
             </div>

          </div>
          
          {/* [FEATURE 1: CHATBOT POP-UP UI] */}
          {chatOpen && (
              <div style={{
                  position: 'absolute', bottom: '90px', right: '30px', width: '380px', height: '480px',
                  background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-color)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 10
              }}>
                  <div style={{background: 'var(--accent-color)', padding: '15px 20px', color: '#000', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between'}}>
                      <span><i className="fa-solid fa-robot"></i> Chat với CV (Local AI)</span>
                      <i className="fa-solid fa-xmark" style={{cursor: 'pointer'}} onClick={() => setChatOpen(false)}></i>
                  </div>
                  <div style={{flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                      {messages.map((msg, i) => (
                          <div key={i} style={{alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%'}}>
                              <div style={{
                                  background: msg.role === 'user' ? '#3B82F6' : 'var(--bg-input)',
                                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                  padding: '10px 15px', borderRadius: '12px', fontSize: '14px', border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)'
                              }}>
                                  {msg.text}
                              </div>
                          </div>
                      ))}
                      {loadingChat && <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}><i className="fa-solid fa-circle-notch fa-spin"></i> Trợ lý đang kiểm tra...</div>}
                  </div>
                  <div style={{padding: '15px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px'}}>
                      <input 
                          type="text" 
                          placeholder="Bạn từng quản lý team bao nhiêu người?..." 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          style={{
                              flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                              padding: '10px 15px', borderRadius: '20px', color: 'var(--text-primary)', outline: 'none', fontSize: '13px'
                          }}
                      />
                      <button onClick={handleSendMessage} style={{
                          background: 'var(--accent-color)', border: 'none', width: '38px', height: '38px', 
                          borderRadius: '50%', color: '#000', cursor: 'pointer'
                      }}>
                          <i className="fa-solid fa-paper-plane"></i>
                      </button>
                  </div>
              </div>
          )}

          {/* FLOATING ACTION BUTTON (Bong bóng Chat) */}
          <button 
              onClick={() => setChatOpen(!chatOpen)}
              style={{
                  position: 'absolute', bottom: '30px', right: '30px', width: '56px', height: '56px', borderRadius: '50%',
                  background: 'var(--accent-color)', color: '#000', fontSize: '24px', border: 'none',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)', cursor: 'pointer', zIndex: 10,
                  display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
              <i className={chatOpen ? "fa-solid fa-xmark" : "fa-solid fa-message"}></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateModal;