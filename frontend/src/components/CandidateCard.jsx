import React from 'react';

const CandidateCard = ({ data }) => {
  // Xác định màu tag dựa trên trạng thái
  const getTagClass = (status) => {
      const s = (status || '').toLowerCase();
      if (s.includes('screen')) return 'tag-screening';
      if (s.includes('inter')) return 'tag-interview';
      if (s.includes('offer')) return 'tag-offer';
      if (s.includes('reject')) return 'tag-rejected';
      return 'tag-screening';
  };

  return (
    <div className="candidate-card">
      <div className="candidate-info">
        <div className="candidate-avatar">
          {data.full_name ? data.full_name.charAt(0).toUpperCase() : '?'}
        </div>
        <div>
          <p className="candidate-name">{data.full_name}</p>
          <p className="candidate-role">{data.role || 'Ứng viên'}</p>
        </div>
      </div>
      
      {/* Hiển thị tóm tắt kỹ năng từ AI */}
      {data.ai_analysis && data.ai_analysis.skills && (
          <div style={{fontSize: '11px', color: '#6B7280', marginTop: '8px', marginBottom: '8px', background: '#F3F4F6', padding: '4px 8px', borderRadius: '4px'}}>
             skills: {Array.isArray(data.ai_analysis.skills) ? data.ai_analysis.skills.slice(0, 3).join(', ') : '...'}
          </div>
      )}

      <div className="candidate-details">
        <span className={`tag ${getTagClass(data.status)}`}>{data.status}</span>
        {data.ai_rating > 0 && (
          <span className="candidate-score">
            <i className="fa-solid fa-bolt" style={{marginRight:'4px', color: '#F59E0B'}}></i>
            {data.ai_rating}
          </span>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;