/* FILE: frontend/src/components/CandidateCard.jsx (Final Quick Status) */
import React from 'react';

const CandidateCard = ({ data, onClick, onStatusChange }) => {
    // Màu sắc theo điểm số AI
    const getScoreStyle = (score) => {
        if (score >= 8) return { color: 'var(--accent-color)', icon: 'fa-bolt' }; // Xanh Neon
        if (score >= 5) return { color: '#FCD34D', icon: 'fa-star-half-stroke' }; // Vàng
        return { color: '#FF4D4D', icon: 'fa-triangle-exclamation' }; // Đỏ
    };

    const scoreStyle = getScoreStyle(data.ai_rating);
    const dateStr = new Date(data.created_at || Date.now()).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});

    const handleDropdownClick = (e) => {
        e.stopPropagation(); // Ngăn mở Modal khi bấm vào dropdown
    };

    return (
        <div 
            onClick={onClick}
            style={{
                background: 'var(--bg-tertiary)', // Nền theo theme
                borderRadius: '12px', 
                padding: '12px',
                border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', gap: '10px',
                cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                boxShadow: 'var(--card-shadow)', overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px -5px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--card-shadow)';
            }}
        >
            {/* Status Color Bar (Thanh màu bên trái) */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: scoreStyle.color, opacity: 0.8 }}></div>

            {/* HEADER: Avatar & Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'var(--bg-input)', border: `1px solid ${scoreStyle.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 'bold', color: scoreStyle.color, flexShrink: 0
                }}>
                    {data.full_name ? data.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {data.full_name}
                    </h4>
                    <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {data.role}
                    </p>
                </div>
            </div>

            {/* FOOTER: Score & STATUS DROPDOWN (NEW) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '8px', paddingTop: '5px' }}>
                
                {/* AI Score Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className={`fa-solid ${scoreStyle.icon}`} style={{ fontSize: '10px', color: scoreStyle.color }}></i>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: scoreStyle.color }}>{data.ai_rating}</span>
                </div>

                {/* --- QUICK STATUS DROPDOWN --- */}
                <div 
                    onClick={handleDropdownClick}
                    style={{ 
                        position: 'relative', 
                        background: 'var(--bg-input)', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-color)', 
                        padding: '2px 8px', 
                        display: 'flex', alignItems: 'center', gap: '5px', 
                        cursor: 'pointer', transition: 'background 0.2s'
                    }}
                    title="Đổi trạng thái nhanh"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                >
                    <span style={{fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase'}}>
                        {data.status}
                    </span>
                    <i className="fa-solid fa-caret-down" style={{fontSize: '10px', color: 'var(--text-secondary)'}}></i>
                    
                    {/* Native Select (Ẩn nhưng hoạt động) */}
                    <select 
                        value={data.status}
                        onChange={(e) => onStatusChange && onStatusChange(data.id, e.target.value)}
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                            opacity: 0, cursor: 'pointer'
                        }}
                    >
                        <option value="Screening">Screening</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Hired">Hired</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

            </div>
        </div>
    );
};

export default CandidateCard;