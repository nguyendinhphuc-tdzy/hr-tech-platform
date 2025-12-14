import React from 'react';

const CandidateModal = ({ candidate, onClose }) => {
  if (!candidate) return null;

  // Phân tích dữ liệu AI (nếu có)
  const aiData = candidate.ai_analysis || {};
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#131F2E', width: '95%', height: '90%', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* --- HEADER --- */}
        <div style={{
          padding: '15px 25px', borderBottom: '1px solid #E5E7EB', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#fff'
        }}>
          <div>
            <h2 style={{margin: 0, fontSize: '20px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '10px'}}>
               {candidate.full_name} 
               <span style={{fontSize:'12px', background:'#E0E7FF', color:'#4338CA', padding:'2px 8px', borderRadius:'12px'}}>{candidate.role}</span>
            </h2>
            <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#6B7280'}}>
              Email: {candidate.email || 'Chưa cập nhật'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{background: '#F3F4F6', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#4B5563', width:'36px', height:'36px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}
          >
            &times;
          </button>
        </div>

        {/* --- BODY (SPLIT SCREEN) --- */}
        <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
          
          {/* CỘT TRÁI: PDF VIEWER */}
          <div style={{flex: 1, borderRight: '1px solid #E5E7EB', background: '#F3F4F6', position: 'relative'}}>
            {candidate.cv_file_url ? (
              <iframe 
                src={candidate.cv_file_url} 
                width="100%" 
                height="100%" 
                style={{border: 'none'}}
                title="CV Preview"
              ></iframe>
            ) : (
              <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6B7280'}}>
                 <i className="fa-solid fa-file-pdf" style={{fontSize: '48px', marginBottom: '15px'}}></i>
                 <p>Không tìm thấy file CV gốc.</p>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: AI ANALYSIS */}
          <div style={{flex: 1, padding: '25px', overflowY: 'auto', background: '#fff', maxWidth: '600px'}}>
             
             {/* 1. Điểm số tổng quan */}
             <div style={{display:'flex', gap:'20px', marginBottom:'30px', background:'#09121D', padding:'20px', borderRadius:'12px'}}>
                <div style={{textAlign:'center', minWidth:'100px'}}>
                   <div style={{fontSize:'36px', fontWeight:'800', color: candidate.ai_rating >= 8 ? '#059669' : (candidate.ai_rating >= 5 ? '#D97706' : '#DC2626')}}>
                      {candidate.ai_rating}<span style={{fontSize:'16px', color:'#9CA3AF'}}>/10</span>
                   </div>
                   <div style={{fontSize:'12px', fontWeight:'600', color:'#4B5563', textTransform:'uppercase'}}>Độ phù hợp</div>
                </div>
                <div style={{borderLeft:'1px solid #E5E7EB', paddingLeft:'20px'}}>
                   <h4 style={{marginTop:0, marginBottom:'5px', color:'#111827'}}>🤖 Nhận xét từ AI:</h4>
                   <p style={{margin:0, fontSize:'14px', color:'#4B5563', fontStyle:'italic', lineHeight:'1.5'}}>
                      "{aiData.match_reason || aiData.summary || "Chưa có đánh giá chi tiết"}"
                   </p>
                </div>
             </div>

             {/* 2. Kỹ năng chuyên môn */}
             <div style={{marginBottom: '25px'}}>
                <h4 style={{display:'flex', alignItems:'center', gap:'8px', color:'#111827', marginBottom:'10px'}}>
                    <i className="fa-solid fa-bolt" style={{color:'#F59E0B'}}></i> Kỹ năng phát hiện được
                </h4>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {aiData.skills && aiData.skills.length > 0 ? (
                        aiData.skills.map((skill, idx) => (
                            <span key={idx} style={{
                                background: '#EFF6FF', color: '#1D4ED8', 
                                padding: '6px 12px', borderRadius: '20px', 
                                fontSize: '13px', fontWeight: '500', border: '1px solid #DBEAFE'
                            }}>
                                {skill}
                            </span>
                        ))
                    ) : ( <span style={{color:'#9CA3AF', fontSize:'14px'}}>Không tìm thấy kỹ năng cụ thể</span> )}
                </div>
             </div>

             {/* 3. Thông tin chi tiết JSON */}
             {aiData.summary && (
                 <div style={{marginBottom: '25px'}}>
                    <h4 style={{display:'flex', alignItems:'center', gap:'8px', color:'#111827', marginBottom:'10px'}}>
                        <i className="fa-solid fa-file-lines" style={{color:'#6B7280'}}></i> Tóm tắt hồ sơ
                    </h4>
                    <p style={{fontSize:'14px', lineHeight:'1.6', color:'#374151', background:'#F9FAFB', padding:'15px', borderRadius:'8px'}}>
                        {aiData.summary}
                    </p>
                 </div>
             )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateModal;