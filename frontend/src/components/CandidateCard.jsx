/* FILE: frontend/src/components/CandidateCard.jsx (Theme Aware) */
import React from 'react';

const CandidateCard = ({ data, onClick, onStatusChange }) => {
    // Màu sắc theo điểm số
    const getScoreColor = (score) => {
        if (score >= 8) return 'var(--accent-color)'; // Xanh lá (Sáng/Tối tự đổi)
        if (score >= 5) return '#FCD34D'; // Vàng
        return '#FF4D4D'; // Đỏ
    };

    const handleMove = (e) => {
        e.stopPropagation(); // Ngăn click vào card
    };

    return (
        <div 
            className="candidate-card-compact"
            onClick={onClick}
            style={{
                background: 'var(--bg-tertiary)', // SỬA: Dùng biến nền
                borderRadius: '12px', // Bo tròn hơn chút cho hiện đại
                padding: '12px',
                border: '1px solid var(--border-color)', // SỬA: Dùng biến viền
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                boxShadow: 'var(--card-shadow)' // SỬA: Shadow theo theme
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-color)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'var(--bg-input)'; // Sáng hơn chút khi hover
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
        >
            {/* 1. Avatar Nhỏ (Left) */}
            <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--bg-secondary)', // SỬA: Biến nền
                border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 'bold', 
                color: 'var(--text-primary)', // SỬA: Chữ theo theme
                flexShrink: 0
            }}>
                {data.full_name ? data.full_name.charAt(0).toUpperCase() : 'U'}
            </div>

            {/* 2. Info (Middle) */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ 
                    margin: '0 0 2px 0', 
                    color: 'var(--text-primary)', // SỬA: Chữ chính
                    fontSize: '13px', 
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                }}>
                    {data.full_name}
                </h4>
                <p style={{ 
                    margin: 0, 
                    color: 'var(--text-secondary)', // SỬA: Chữ phụ
                    fontSize: '11px',
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
                    background: 'var(--bg-input)', // SỬA: Nền badge
                    padding: '2px 6px', borderRadius: '4px',
                    border: '1px solid var(--border-color)'
                }}>
                    {data.ai_rating}
                </div>

                {/* Quick Move Dropdown (Native Select ẩn) */}
                <div 
                    onClick={handleMove} 
                    style={{ position: 'relative', width: '20px', height: '20px' }}
                    title="Chuyển nhanh"
                >
                    <i className="fa-solid fa-ellipsis-vertical" style={{ 
                        color: 'var(--text-secondary)', // SỬA: Màu icon
                        fontSize: '14px', position: 'absolute', right: 0, top: 3, pointerEvents: 'none' 
                    }}></i>
                    
                    <select 
                        onChange={(e) => onStatusChange && onStatusChange(data.id, e.target.value)}
                        value={data.status}
                        style={{
                            position: 'absolute', top: 0, right: 0, width: '100%', height: '100%',
                            opacity: 0, cursor: 'pointer', appearance: 'none' // Đảm bảo ẩn trên mọi trình duyệt
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