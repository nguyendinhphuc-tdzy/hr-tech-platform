/* FILE: frontend/src/components/CandidateCard.jsx */
import React from 'react';

const CandidateCard = ({ data, onClick, onStatusChange }) => {
    // Màu sắc theo điểm số
    const getScoreColor = (score) => {
        if (score >= 8) return 'var(--neon-green)';
        if (score >= 5) return '#FCD34D';
        return '#FF4D4D';
    };

    const handleMove = (e) => {
        e.stopPropagation(); // Ngăn click vào card
        // Logic mở menu sẽ được xử lý bằng select native cho đơn giản & hiệu quả
    };

    return (
        <div 
            className="candidate-card-compact"
            onClick={onClick}
            style={{
                background: '#131F2E',
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--neon-green)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#1A2736';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#131F2E';
            }}
        >
            {/* 1. Avatar Nhỏ (Left) */}
            <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#0D1825', border: '1px solid #2D3B4E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 'bold', color: '#fff',
                flexShrink: 0
            }}>
                {data.full_name ? data.full_name.charAt(0).toUpperCase() : 'U'}
            </div>

            {/* 2. Info (Middle) */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ 
                    margin: '0 0 2px 0', color: '#fff', fontSize: '13px', 
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                }}>
                    {data.full_name}
                </h4>
                <p style={{ 
                    margin: 0, color: '#9CA3AF', fontSize: '11px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                }}>
                    {data.role}
                </p>
            </div>

            {/* 3. Score & Action (Right) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                {/* Score Badge */}
                <div style={{
                    fontSize: '12px', fontWeight: 'bold', color: getScoreColor(data.ai_rating),
                    background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px'
                }}>
                    {data.ai_rating}
                </div>

                {/* Quick Move Dropdown (Native Select ẩn) */}
                <div 
                    onClick={(e) => e.stopPropagation()} 
                    style={{ position: 'relative', width: '20px', height: '20px' }}
                    title="Chuyển nhanh"
                >
                    <i className="fa-solid fa-ellipsis-vertical" style={{ color: '#6B7280', fontSize: '14px', position: 'absolute', right: 0, top: 3, pointerEvents: 'none' }}></i>
                    <select 
                        onChange={(e) => onStatusChange && onStatusChange(data.id, e.target.value)}
                        value={data.status}
                        style={{
                            position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
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