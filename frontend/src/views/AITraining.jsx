import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const AITraining = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [jobs, setJobs] = useState([]);

    // 1. Lấy danh sách vị trí đã có
    const fetchJobs = () => {
        axios.get(`${API_BASE_URL}/api/jobs`)
            .then(res => setJobs(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchJobs(); }, []);

    // 2. Xử lý Upload CSV
    const handleImport = async () => {
        if (!file) return alert("Vui lòng chọn file CSV!");
        
        const formData = new FormData();
        formData.append('csv_file', file);
        
        setUploading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/jobs/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`✅ ${res.data.message}`);
            setFile(null);
            fetchJobs(); // Load lại danh sách
        } catch (err) {
            alert("Lỗi Import: " + (err.response?.data?.error || err.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="ai-training-view">
            <h2 className="section-title" style={{ color: 'var(--neon-green)', textShadow: '0 0 10px rgba(46, 255, 123, 0.3)' }}>
                Quản lý Tiêu chí Tuyển dụng
            </h2>
            
            {/* Khu vực Upload */}
            <div style={{
                background: 'var(--card-background)', 
                padding: '25px', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)', 
                marginBottom: '30px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h3 style={{marginTop: 0, fontSize: '16px', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <i className="fa-solid fa-file-csv" style={{color: 'var(--neon-green)'}}></i> 
                    Nhập từ file CSV
                </h3>
                <p style={{color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px'}}>
                    Upload file CSV chứa danh sách vị trí, kỹ năng yêu cầu, kinh nghiệm để AI học tiêu chí chấm điểm.
                </p>
                <div style={{display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap'}}>
                    <input 
                        type="file" 
                        accept=".csv"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{
                            border: '1px solid var(--border-color)', 
                            padding: '10px', 
                            borderRadius: '6px',
                            background: '#09121D',
                            color: 'var(--text-white)',
                            flex: 1,
                            minWidth: '250px'
                        }}
                    />
                    <button 
                        onClick={handleImport}
                        disabled={uploading}
                        style={{
                            background: 'var(--neon-green)', 
                            color: '#000', /* Chữ đen trên nền Neon */
                            border: 'none', 
                            padding: '12px 25px', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            boxShadow: '0 0 15px rgba(46, 255, 123, 0.4)',
                            opacity: uploading ? 0.7 : 1
                        }}
                    >
                        {uploading ? <i className="fa-solid fa-spinner fa-spin"></i> : <><i className="fa-solid fa-cloud-arrow-up"></i> Import Ngay</>}
                    </button>
                </div>
            </div>

            {/* Danh sách Vị trí */}
            <h3 className="section-title" style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px'}}>
                Danh sách Vị trí <span style={{fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400}}>({jobs.length} vị trí đang active)</span>
            </h3>
            
            <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'}}>
                {jobs.map(job => (
                    <div key={job.id} style={{
                        background: 'var(--card-background)', /* Nền tối */
                        padding: '20px', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)', 
                        transition: 'transform 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--neon-green)';
                        e.currentTarget.style.transform = 'translateY(-5px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    >
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
                            background: 'var(--neon-green)'
                        }}></div>

                        <h4 style={{margin: '0 0 15px 0', fontSize: '18px', color: 'var(--text-white)', fontWeight: 600}}>
                            {job.title}
                        </h4>
                        
                        <div style={{fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <i className="fa-solid fa-bolt" style={{color: '#F59E0B', width: '20px'}}></i>
                                <span style={{lineHeight: '1.4'}}>
                                    <strong style={{color: 'var(--text-white)'}}>Skills:</strong><br/> 
                                    {job.requirements?.skills?.join(', ') || 'Chưa cập nhật'}
                                </span>
                            </div>
                            
                            <div style={{display: 'flex', gap: '10px'}}>
                                <i className="fa-solid fa-briefcase" style={{color: '#3B82F6', width: '20px'}}></i>
                                <span>
                                    <strong style={{color: 'var(--text-white)'}}>Kinh nghiệm:</strong> {job.requirements?.experience_years} năm
                                </span>
                            </div>

                            <div style={{display: 'flex', gap: '10px'}}>
                                <i className="fa-solid fa-graduation-cap" style={{color: '#EC4899', width: '20px'}}></i>
                                <span>
                                    <strong style={{color: 'var(--text-white)'}}>Học vấn:</strong> {job.requirements?.education}
                                </span>
                            </div>
                        </div>

                        <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end'}}>
                            <span style={{
                                background: 'rgba(46, 255, 123, 0.1)', 
                                color: 'var(--neon-green)', 
                                padding: '4px 10px', 
                                borderRadius: '20px', 
                                fontSize: '11px', 
                                fontWeight: 700,
                                border: '1px solid var(--neon-green)',
                                textTransform: 'uppercase'
                            }}>
                                Active
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AITraining;