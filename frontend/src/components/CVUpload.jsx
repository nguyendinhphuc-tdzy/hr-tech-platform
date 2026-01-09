import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from './config';

const CVUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [name, setName] = useState('');
    const [selectedJob, setSelectedJob] = useState('');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // Lấy danh sách Job để điền vào ô chọn
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/jobs`)
            .then(res => setJobs(res.data))
            .catch(err => console.error("Lỗi lấy danh sách job", err));
    }, []);

    const handleUpload = async () => {
        if (!file) return alert("Chọn file CV đi bạn!");

        const formData = new FormData();
        formData.append('cv_file', file);
        formData.append('full_name', name);
        if (selectedJob) formData.append('job_id', selectedJob); // Gửi kèm ID Job

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/cv/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(response.data.candidate);
            alert(`✅ Đã so khớp xong!\nĐiểm phù hợp: ${response.data.candidate.ai_rating}/10`);
            
            if (onUploadSuccess) onUploadSuccess();
            
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{padding: '20px', background: '#131F2E', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '20px'}}>
            <h3 style={{marginTop: 0, color: '#4F46E5'}}><i className="fa-solid fa-crosshairs"></i> Scan & So Khớp</h3>
            
            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end'}}>
                {/* Chọn Job */}
                <div style={{flex: 1, minWidth: '200px'}}>
                    <label style={{display: 'block', fontWeight: 500, fontSize:'14px', marginBottom:'5px'}}>Vị trí ứng tuyển:</label>
                    <select 
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB'}}
                    >
                        <option value="">-- Quét tự do (Không so sánh) --</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </div>

                <div style={{flex: 1, minWidth: '200px'}}>
                    <label style={{display: 'block', fontWeight: 500, fontSize:'14px', marginBottom:'5px'}}>Tên ứng viên (Tùy chọn):</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên..." style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB'}} />
                </div>

                <div style={{flex: 1, minWidth: '200px'}}>
                    <label style={{display: 'block', fontWeight: 500, fontSize:'14px', marginBottom:'5px'}}>File CV (PDF):</label>
                    <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} style={{fontSize:'14px'}} />
                </div>

                <button 
                    onClick={handleUpload} 
                    disabled={loading}
                    style={{background: loading ? '#9CA3AF' : '#2EFF7B', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 600, height: '42px', cursor: 'pointer'}}
                >
                    {loading ? 'Đang chấm điểm...' : 'Scan Ngay'}   
                </button>
            </div>

            {/* Hiển thị kết quả nhanh */}
            {result && result.ai_analysis && (
                <div style={{marginTop: '15px', padding: '15px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0'}}>
                    <p style={{margin: 0, fontWeight: 600, color: '#166534'}}>
                        🎯 Kết quả: {result.ai_rating}/10 điểm
                    </p>
                    <p style={{margin: '5px 0 0 0', fontSize: '14px', color: '#15803D'}}>
                        {result.ai_analysis.match_reason || result.ai_analysis.summary}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CVUpload;