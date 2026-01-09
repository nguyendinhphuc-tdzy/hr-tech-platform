/* FILE: frontend/src/views/CVScanView.jsx */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const CVScanView = () => {
    const [file, setFile] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/jobs`)
            .then(res => setJobs(res.data))
            .catch(err => console.error(err));
    }, []);

    // Xử lý chọn file để preview ngay lập tức
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        if (selectedFile) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setResult(null); // Reset kết quả cũ
        }
    };

    const handleScan = async () => {
        if (!file) return alert("Vui lòng chọn CV!");
        
        const formData = new FormData();
        formData.append('cv_file', file);
        if (selectedJob) formData.append('job_id', selectedJob);

        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/cv/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data.candidate);
        } catch (err) {
            alert("Lỗi Scan: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cv-scan-view" style={{ color: 'var(--text-white)', minHeight: 'calc(100vh - 100px)' }}>
            
            {/* HEADER */}
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="section-title" style={{ 
                        color: 'var(--neon-green)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px',
                        textShadow: '0 0 10px rgba(46, 255, 123, 0.4)'
                    }}>
                        <i className="fa-solid fa-radar" style={{marginRight: '10px'}}></i>
                        AI Candidate Scanner
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Phân tích hồ sơ ứng viên bằng trí tuệ nhân tạo chuyên sâu.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 180px)' }}>
                
                {/* --- CỘT TRÁI: UPLOAD & PREVIEW --- */}
                <div style={{ 
                    flex: '0 0 400px', 
                    display: 'flex', flexDirection: 'column', gap: '20px'
                }}>
                    {/* 1. Control Panel */}
                    <div className="card-dark" style={{ padding: '20px', borderRadius: '12px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                1. Chọn vị trí tuyển dụng (JD)
                            </label>
                            <select 
                                value={selectedJob} 
                                onChange={(e) => setSelectedJob(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#09121D' }}
                            >
                                <option value="">-- Phân tích tự do (General) --</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                2. Tải lên CV (PDF)
                            </label>
                            <input 
                                type="file" 
                                accept=".pdf" 
                                onChange={handleFileChange}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#09121D' }}
                            />
                        </div>

                        <button 
                            onClick={handleScan}
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: 'var(--neon-green)',
                                color: '#000',
                                padding: '12px',
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                boxShadow: loading ? 'none' : '0 0 15px rgba(46, 255, 123, 0.4)',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.3s'
                            }}
                        >
                            {loading ? <span><i className="fa-solid fa-circle-notch fa-spin"></i> Đang Phân Tích...</span> : <span><i className="fa-solid fa-bolt"></i> SCAN NGAY</span>}
                        </button>
                    </div>

                    {/* 2. PDF Preview Mini */}
                    <div className="card-dark" style={{ 
                        flex: 1, 
                        borderRadius: '12px', 
                        overflow: 'hidden', 
                        border: '1px solid var(--border-color)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '10px 15px', background: '#0D1825', borderBottom: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            <i className="fa-regular fa-eye"></i> XEM TRƯỚC TÀI LIỆU
                        </div>
                        <div style={{ flex: 1, background: '#525659', position: 'relative' }}>
                            {previewUrl ? (
                                <iframe src={previewUrl} width="100%" height="100%" style={{ border: 'none' }} title="Preview"></iframe>
                            ) : (
                                <div style={{ 
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                                    color: 'rgba(255,255,255,0.3)', textAlign: 'center' 
                                }}>
                                    <i className="fa-solid fa-file-pdf" style={{ fontSize: '40px', marginBottom: '10px' }}></i>
                                    <p>Chưa có file</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: KẾT QUẢ PHÂN TÍCH (SCROLLABLE) --- */}
                <div className="card-dark" style={{ 
                    flex: 1, 
                    borderRadius: '12px', 
                    padding: '30px', 
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-background)',
                    position: 'relative'
                }}>
                    {!result ? (
                        <div style={{ 
                            height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                            color: 'var(--text-secondary)', opacity: 0.6 
                        }}>
                            <i className="fa-solid fa-microchip" style={{ fontSize: '60px', marginBottom: '20px', color: 'var(--border-color)' }}></i>
                            <p style={{ fontSize: '16px' }}>Vui lòng chọn Job, tải CV và bấm SCAN để AI làm việc.</p>
                        </div>
                    ) : (
                        <div className="analysis-result fade-in">
                            {/* 1. Header Kết quả */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '28px', color: 'var(--text-white)' }}>{result.full_name}</h1>
                                    <p style={{ margin: '5px 0', color: 'var(--neon-green)', fontSize: '14px' }}>
                                        <i className="fa-solid fa-envelope"></i> {result.email || 'Email not found'}
                                    </p>
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                        <span className="tag" style={{ background: 'rgba(46, 255, 123, 0.1)', color: 'var(--neon-green)', border: '1px solid var(--neon-green)' }}>
                                            {result.role}
                                        </span>
                                        <span className="tag" style={{ background: '#1A2736', color: 'var(--text-secondary)' }}>
                                            {new Date().toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* SCORE CIRCLE */}
                                <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1A2736" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                            fill="none" stroke={result.ai_rating >= 8 ? '#2EFF7B' : (result.ai_rating >= 5 ? '#FCD34D' : '#FF4D4D')} 
                                            strokeWidth="3" 
                                            strokeDasharray={`${result.ai_rating * 10}, 100`} 
                                        />
                                    </svg>
                                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-white)' }}>{result.ai_rating}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Score</div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. AI Analysis Content (Vietnamese Style) */}
                            <div style={{ display: 'grid', gap: '25px' }}>
                                
                                {/* SUMMARY CARD */}
                                <div style={{ 
                                    background: 'rgba(46, 255, 123, 0.03)', 
                                    padding: '20px', 
                                    borderRadius: '8px', 
                                    borderLeft: '3px solid var(--neon-green)' 
                                }}>
                                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--neon-green)', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-wand-magic-sparkles"></i> TỔNG QUAN
                                    </h3>
                                    <p style={{ margin: 0, lineHeight: '1.6', color: '#2b2a2aff', fontSize: '14px', fontStyle: 'italic' }}>
                                        "{result.ai_analysis?.summary || "Không có tóm tắt."}"
                                    </p>
                                </div>

                                {/* SKILLS CARD */}
                                <div>
                                    <h3 style={{ fontSize: '16px', color: '#FFFFFF', marginBottom: '15px', fontWeight: '600' }}>
                                        <i className="fa-solid fa-microchip" style={{ color: '#FCD34D', marginRight: '8px' }}></i> KỸ NĂNG NHẬN DIỆN
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {result.ai_analysis?.skills?.map((skill, idx) => (
                                            <span key={idx} style={{ 
                                                background: '#1A2736', 
                                                color: '#E0E0E0', 
                                                padding: '6px 14px', 
                                                borderRadius: '20px', 
                                                fontSize: '13px', 
                                                border: '1px solid #2D3B4E',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                            }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* DETAILED ANALYSIS (QUAN TRỌNG NHẤT) */}
                                <div style={{ 
                                    background: '#0D1825', 
                                    padding: '25px', 
                                    borderRadius: '12px', 
                                    border: '1px solid var(--border-color)' 
                                }}>
                                    <h3 style={{ margin: '0 0 20px 0', color: '#A5B4FC', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-file-signature"></i> PHÂN TÍCH CHI TIẾT
                                    </h3>
                                    
                                    {/* Vùng nội dung chính - Giữ format xuống dòng */}
                                    <div style={{ 
                                        color: '#D1D5DB', // Màu xám nhạt dễ đọc
                                        fontSize: '14px', 
                                        lineHeight: '1.8', 
                                        whiteSpace: 'pre-wrap', // Chìa khóa để giữ format
                                        fontFamily: "'Roboto', sans-serif"
                                    }}>
                                        {result.ai_analysis?.match_reason || "Chưa có phân tích chi tiết."}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CVScanView;
