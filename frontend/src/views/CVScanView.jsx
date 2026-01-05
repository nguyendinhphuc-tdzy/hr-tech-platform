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

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        if (selectedFile) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setResult(null);
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
        <div className="cv-scan-view" style={{ minHeight: 'calc(100vh - 100px)' }}>
            
            {/* HEADER */}
            <div style={{ marginBottom: '30px' }}>
                <h2 className="section-title">
                    <i className="fa-solid fa-radar" style={{color: 'var(--neon-green)'}}></i>
                    AI Candidate Scanner
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '5px' }}>
                    Phân tích hồ sơ ứng viên tự động với độ chính xác cao.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexDirection: 'row', flexWrap: 'wrap' }}>
                
                {/* --- CỘT TRÁI: CONTROL --- */}
                <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card-box">
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                1. Vị trí tuyển dụng (JD)
                            </label>
                            <select 
                                className="form-input"
                                value={selectedJob} 
                                onChange={(e) => setSelectedJob(e.target.value)}
                            >
                                <option value="">-- Phân tích tự do (General) --</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                2. Upload CV (PDF)
                            </label>
                            <input 
                                type="file" 
                                className="form-input"
                                accept=".pdf" 
                                onChange={handleFileChange}
                            />
                        </div>

                        <button 
                            className="btn-primary"
                            onClick={handleScan}
                            disabled={loading}
                            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                        >
                            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-bolt"></i>}
                            {loading ? 'ĐANG PHÂN TÍCH...' : 'SCAN NGAY'}
                        </button>
                    </div>

                    {/* PREVIEW BOX */}
                    <div className="card-box" style={{ flex: 1, padding: 0, overflow: 'hidden', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <i className="fa-regular fa-eye"></i> PREVIEW
                        </div>
                        <div style={{ flex: 1, position: 'relative', background: '#525659' }}>
                            {previewUrl ? (
                                <iframe src={previewUrl} width="100%" height="100%" style={{ border: 'none', height: '400px' }} title="Preview"></iframe>
                            ) : (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                                    <i className="fa-solid fa-file-pdf" style={{ fontSize: '40px', marginBottom: '10px' }}></i>
                                    <p>Chưa có file</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: KẾT QUẢ --- */}
                <div className="card-box" style={{ flex: 1, minHeight: '500px' }}>
                    {!result ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-placeholder)' }}>
                            <i className="fa-solid fa-microchip" style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.5 }}></i>
                            <p>Vui lòng chọn Job và tải CV để bắt đầu.</p>
                        </div>
                    ) : (
                        <div className="fade-in">
                            {/* HEADER RESULT */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{result.full_name}</h2>
                                    <p style={{ color: 'var(--neon-green)', margin: '5px 0' }}>{result.email}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '32px', fontWeight: '800', color: result.ai_rating >= 8 ? 'var(--neon-green)' : 'var(--warning)' }}>
                                        {result.ai_rating}/10
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>AI SCORE</span>
                                </div>
                            </div>

                            {/* CONTENT RESULT */}
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ background: 'rgba(46, 255, 123, 0.1)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--neon-green)' }}>
                                    <strong style={{ color: 'var(--neon-green)' }}>TỔNG QUAN: </strong>
                                    <span style={{ color: 'var(--text-primary)' }}>{result.ai_analysis?.summary}</span>
                                </div>

                                <div>
                                    <h4 style={{ color: 'var(--text-secondary)', marginTop: 0 }}>KỸ NĂNG:</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {result.ai_analysis?.skills?.map((s, i) => (
                                            <span key={i} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '5px 12px', borderRadius: '15px', fontSize: '13px', color: 'var(--text-primary)' }}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ color: 'var(--text-secondary)' }}>CHI TIẾT ĐÁNH GIÁ:</h4>
                                    <div style={{ 
                                        whiteSpace: 'pre-wrap', 
                                        lineHeight: '1.6', 
                                        color: 'var(--text-primary)', 
                                        fontSize: '14px',
                                        background: 'var(--bg-input)',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        {result.ai_analysis?.match_reason}
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