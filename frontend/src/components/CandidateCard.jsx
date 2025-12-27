/* FILE: frontend/src/components/CandidateCard.jsx (Final Aesthetic & Theme Aware) */
import React from 'react';

const CandidateCard = ({ data, onClick, onStatusChange }) => {
    // Màu sắc theo điểm số AI (Thang điểm 10)
    const getScoreStyle = (score) => {
        if (score >= 8) return { color: 'var(--accent-color)', icon: 'fa-bolt' }; // Xanh Neon (Xuất sắc)
        if (score >= 5) return { color: '#FCD34D', icon: 'fa-star-half-stroke' }; // Vàng (Khá)
        return { color: '#FF4D4D', icon: 'fa-triangle-exclamation' }; // Đỏ (Yếu)
    };

    const scoreStyle = getScoreStyle(data.ai_rating);
    const dateStr = new Date(data.created_at || Date.now()).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'});

    const handleMove = (e) => {
        e.stopPropagation(); // Ngăn click vào card khi bấm menu
    };

    return (
        <div 
            className="candidate-card-modern"
            onClick={onClick}
            style={{
                background: 'var(--bg-tertiary)', // Nền theo theme (Trắng/Đen)
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                position: 'relative',
                boxShadow: 'var(--card-shadow)',
                overflow: 'hidden'
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
            {/* Thanh trạng thái màu nhỏ bên trái */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                background: scoreStyle.color, opacity: 0.8
            }}></div>

            {/* HEADER: Avatar + Name + Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'var(--bg-input)', // Nền avatar nhạt
                    border: `1px solid ${scoreStyle.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 'bold', 
                    color: scoreStyle.color, flexShrink: 0
                }}>
                    {data.full_name ? data.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{ 
                        margin: 0, color: 'var(--text-primary)', fontSize: '13px', fontWeight: '700',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                    }}>
                        {data.full_name}
                    </h4>
                    <p style={{ 
                        margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '11px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                    }}>
                        {data.role}
                    </p>
                </div>

                {/* Quick Move Menu (Ẩn hiện đại) */}
                <div 
                    onClick={handleMove} 
                    style={{ position: 'relative', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Chuyển trạng thái nhanh"
                >
                    <i className="fa-solid fa-ellipsis" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}></i>
                    <select 
                        onChange={(e) => onStatusChange && onStatusChange(data.id, e.target.value)}
                        value={data.status}
                        style={{
                            position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
                            opacity: 0, cursor: 'pointer', appearance: 'none'
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

            {/* BODY: AI Score & Date Tag */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '8px' }}>
                
                {/* AI Score Badge - Điểm nhấn chính */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'var(--bg-input)', padding: '4px 8px', borderRadius: '6px',
                    border: `1px solid ${scoreStyle.color}40` // Màu viền mờ 40%
                }}>
                    <i className={`fa-solid ${scoreStyle.icon}`} style={{ fontSize: '10px', color: scoreStyle.color }}></i>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: scoreStyle.color }}>
                        {data.ai_rating}<span style={{fontSize:'9px', opacity:0.7}}>/10</span>
                    </span>
                </div>

                {/* Date Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
                    <i className="fa-regular fa-clock" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}></i>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{dateStr}</span>
                </div>
            </div>
        </div>
    );
};

export default CandidateCard;