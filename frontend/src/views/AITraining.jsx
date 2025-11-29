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
            <h2 className="section-title">Quản lý Tiêu chí Tuyển dụng</h2>
            
            {/* Khu vực Upload */}
            <div style={{background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '30px'}}>
                <h3 style={{marginTop: 0, fontSize: '16px'}}>📥 Nhập từ file CSV</h3>
                <p style={{color: '#6B7280', fontSize: '14px', marginBottom: '15px'}}>
                    Upload file CSV chứa danh sách vị trí, kỹ năng yêu cầu, kinh nghiệm...
                </p>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <input 
                        type="file" 
                        accept=".csv"
                        onChange={(e) => setFile(e.target.files[0])}
                        style={{border: '1px solid #D1D5DB', padding: '8px', borderRadius: '6px'}}
                    />
                    <button 
                        onClick={handleImport}
                        disabled={uploading}
                        style={{
                            background: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        {uploading ? 'Đang xử lý...' : 'Import Ngay'}
                    </button>
                </div>
            </div>

            {/* Danh sách Vị trí */}
            <h3 className="section-title">Danh sách Vị trí ({jobs.length})</h3>
            <div style={{display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'}}>
                {jobs.map(job => (
                    <div key={job.id} style={{background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                        <h4 style={{margin: '0 0 10px 0', color: '#111827'}}>{job.title}</h4>
                        <div style={{fontSize: '13px', color: '#4B5563'}}>
                            <p><strong>Kỹ năng:</strong> {job.requirements?.skills?.join(', ')}</p>
                            <p><strong>Kinh nghiệm:</strong> {job.requirements?.experience_years} năm</p>
                            <p><strong>Học vấn:</strong> {job.requirements?.education}</p>
                        </div>
                        <div style={{marginTop: '10px', textAlign: 'right'}}>
                            <span style={{background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600}}>
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