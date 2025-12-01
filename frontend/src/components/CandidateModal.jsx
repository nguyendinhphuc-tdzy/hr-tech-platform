import React from 'react';

const CandidateModal = ({ candidate, onClose }) => {
  if (!candidate) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: 'white', width: '90%', height: '90%', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* HEADER */}
        <div style={{padding: '15px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{margin: 0, fontSize: '18px', color: '#111827'}}>
             👤 {candidate.full_name} - <span style={{color: '#4F46E5'}}>{candidate.role}</span>
          </h2>
          <button onClick={onClose} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7280'}}>&times;</button>
        </div>

        {/* BODY (SPLIT SCREEN) */}
        <div style={{display: 'flex', flex: 1, overflow: 'hidden'}}>
          
          {/* TRÁI: PDF VIEWER */}
          <div style={{flex: 1, borderRight: '1px solid #E5E7EB', background: '#525659'}}>
            {candidate.cv_file_url ? (
              <iframe 
                src={candidate.cv_file_url} 
                width="100%" 
                height="100%" 
                style={{border: 'none'}}
                title="CV Preview"
              ></iframe>
            ) : (
              <div style={{color: 'white', padding: '50px', textAlign: 'center'}}>Không có file CV gốc</div>
            )}
          </div>

          {/* PHẢI: AI ANALYSIS */}
          <div style={{flex: 1, padding: '20px', overflowY: 'auto', background: '#F9FAFB'}}>
             {/* Điểm số */}
             <div style={{marginBottom: '20px', textAlign: 'center', padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
                <div style={{fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600}}>Mức độ phù hợp</div>
                <div style={{fontSize: '36px', fontWeight: 700, color: candidate.ai_rating >= 8 ? '#10B981' : '#F59E0B'}}>
                   {candidate.ai_rating}/10
                </div>
                <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#374151'}}>
                    {candidate.ai_analysis?.match_reason || "Chưa có đánh giá chi tiết"}
                </p>
             </div>

             {/* Tóm tắt */}
             <div style={{marginBottom: '20px'}}>
                <h4 style={{borderBottom: '2px solid #E5E7EB', paddingBottom: '5px', color: '#4B5563'}}>📝 Tóm tắt hồ sơ</h4>
                <p style={{fontSize: '14px', lineHeight: '1.6', color: '#374151'}}>
                    {candidate.ai_analysis?.summary}
                </p>
             </div>

             {/* Kỹ năng */}
             <div style={{marginBottom: '20px'}}>
                <h4 style={{borderBottom: '2px solid #E5E7EB', paddingBottom: '5px', color: '#4B5563'}}>⚡ Kỹ năng chuyên môn</h4>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {candidate.ai_analysis?.skills?.map((skill, idx) => (
                        <span key={idx} style={{background: '#E0E7FF', color: '#4338CA', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 500}}>
                            {skill}
                        </span>
                    ))}
                </div>
             </div>

             {/* Thông tin liên hệ */}
             <div style={{marginBottom: '20px'}}>
                <h4 style={{borderBottom: '2px solid #E5E7EB', paddingBottom: '5px', color: '#4B5563'}}>📞 Liên hệ</h4>
                <p style={{fontSize: '14px'}}><strong>Email:</strong> {candidate.email || 'Không rõ'}</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CandidateModal;