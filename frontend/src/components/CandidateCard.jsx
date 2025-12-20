/* FILE: frontend/src/components/CandidateCard.jsx */
import React from 'react';

const CandidateCard = ({ data, onClick }) => {
  
  // Hàm chọn màu tag theo trạng thái
  const getTagStyle = (status) => {
     const s = (status || '').toLowerCase();
     if (s.includes('screen')) return { bg: 'rgba(165, 180, 252, 0.1)', color: '#A5B4FC', border: '#A5B4FC' };
     if (s.includes('inter')) return { bg: 'rgba(252, 211, 77, 0.1)', color: '#FCD34D', border: '#FCD34D' };
     if (s.includes('offer')) return { bg: 'rgba(46, 255, 123, 0.1)', color: '#2EFF7B', border: '#2EFF7B' };
     if (s.includes('reject')) return { bg: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', border: '#FCA5A5' };
     return { bg: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '#4B5563' };
  };

  const tagStyle = getTagStyle(data.status);

  return (
    <div 
        className="candidate-card" 
        onClick={onClick} 
        style={{
            background: 'var(--card-background)', // Nền #131F2E
            padding: '15px', 
            borderRadius: '10px', 
            marginBottom: '15px', 
            border: '1px solid var(--border-color)',
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.borderColor = 'var(--neon-green)'; // Hover sáng viền
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
      {/* Thông tin chính */}
      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
        <div style={{
            width: '40px', height: '40px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, #1A2736, #09121D)',
            border: '1px solid var(--border-color)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            fontWeight: '700', color: 'var(--text-white)', fontSize: '16px'
        }}>
          {data.full_name ? data.full_name.charAt(0).toUpperCase() : '?'}
        </div>
        <div style={{overflow: 'hidden'}}>
          <p style={{margin: 0, fontWeight: '600', fontSize: '14px', color: 'var(--text-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
              {data.full_name}
          </p>
          <p style={{margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)'}}>
              {data.role || 'Ứng viên'}
          </p>
        </div>
      </div>
      
      {/* 3 Kỹ năng đầu tiên (Chips nhỏ) */}
      {data.ai_analysis && data.ai_analysis.skills && (
          <div style={{display: 'flex', gap: '5px', marginBottom: '12px', flexWrap: 'wrap'}}>
             {Array.isArray(data.ai_analysis.skills) && data.ai_analysis.skills.slice(0, 2).map((s, i) => (
                 <span key={i} style={{
                     fontSize: '10px', background: '#09121D', color: 'var(--text-gray)', 
                     padding: '3px 8px', borderRadius: '4px', border: '1px solid #2D3B4E'
                 }}>
                     {s}
                 </span>
             ))}
             {data.ai_analysis.skills.length > 2 && <span style={{fontSize: '10px', color: 'var(--text-secondary)', alignSelf: 'center'}}>+{data.ai_analysis.skills.length - 2}</span>}
          </div>
      )}

      {/* Footer: Trạng thái & Điểm số */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)'}}>
        <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', textTransform: 'uppercase',
            background: tagStyle.bg, color: tagStyle.color, border: `1px solid ${tagStyle.border}40`
        }}>
            {data.status || 'Mới'}
        </span>
        
        {data.ai_rating > 0 && (
          <span style={{color: 'var(--neon-green)', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px'}}>
            <i className="fa-solid fa-bolt" style={{fontSize: '10px'}}></i>
            {data.ai_rating}
          </span>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;