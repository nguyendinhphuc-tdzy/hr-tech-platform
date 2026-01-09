/* FILE: frontend/src/views/CVScanView.jsx (Final: Enhanced Contrast & Visibility) */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';
import CVUpload from '../components/CVUpload';
import CandidateCard from '../components/CandidateCard';
import CandidateModal from '../components/CandidateModal';
import { supabase } from '../supabaseClient'; 

const CVScanView = () => {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    
    // --- STATE BATCH SCAN ---
    const [isScanning, setIsScanning] = useState(false);
    const [scanQueue, setScanQueue] = useState([]); // Danh sách file đang chờ/xử lý
    const [scannedResults, setScannedResults] = useState([]); // Danh sách kết quả đã scan xong (Candidate objects)
    
    const [selectedCandidate, setSelectedCandidate] = useState(null); // Để mở Modal chi tiết

    // 1. Fetch Jobs
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/jobs`)
            .then(res => setJobs(res.data))
            .catch(err => console.error("Lỗi lấy jobs:", err));
    }, []);

    // 2. Xử lý Scan Hàng Loạt (Nhận từ CVUpload)
    const handleBatchScan = async (files) => {
        if (!selectedJobId) return alert("Vui lòng chọn vị trí tuyển dụng trước khi scan!");
        
        setIsScanning(true);
        // Khởi tạo hàng đợi với trạng thái 'pending'
        setScanQueue(files.map(f => ({ file: f, name: f.name, status: 'pending' })));

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
            setIsScanning(false);
            return alert("Vui lòng đăng nhập lại!");
        }

        // Xử lý tuần tự từng file để tạo cảm giác flow mượt mà
        for (let i = 0; i < files.length; i++) {
            const currentFileObj = files[i];

            // Cập nhật trạng thái 'processing' cho file hiện tại
            setScanQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item));

            const formData = new FormData();
            formData.append('cv_file', currentFileObj);
            formData.append('job_id', selectedJobId);

            try {
                const res = await axios.post(`${API_BASE_URL}/api/cv/upload`, formData, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}` 
                    }
                });
                
                // Cập nhật 'success' và thêm vào kết quả hiển thị
                setScanQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success' } : item));
                setScannedResults(prev => [res.data.candidate, ...prev]);

            } catch (err) {
                console.error(`Lỗi file ${currentFileObj.name}:`, err);
                // Cập nhật 'error'
                setScanQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
            }
        }

        setIsScanning(false);
    };

    return (
        <div className="cv-scan-view" style={{color: 'var(--text-primary)', paddingBottom: '50px', minHeight: 'calc(100vh - 100px)'}}>
            
            {/* HEADER */}
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="section-title" style={{ 
                        color: 'var(--neon-green)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px',
                        textShadow: '0 0 10px rgba(46, 255, 123, 0.4)', fontWeight: '800'
                    }}>
                        <i className="fa-solid fa-radar" style={{marginRight: '10px'}}></i>
                        AI Candidate Scanner
                    </h2>
                    {/* Tăng độ tương phản cho dòng mô tả */}
                    <p style={{ color: 'var(--text-primary)', fontSize: '15px', margin: 0, opacity: 0.9, fontWeight: '500' }}>
                        Quét và phân tích hàng loạt hồ sơ ứng viên bằng AI.
                    </p>
                </div>
            </div>

            {/* SELECTION & UPLOAD AREA */}
            <div style={{maxWidth: '900px', margin: '0 auto'}}>
                
                {/* 1. Chọn Job */}
                <div style={{
                    marginBottom: '25px', 
                    background: 'var(--bg-secondary)', 
                    padding: '25px', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--card-shadow)'
                }}>
                    <label style={{
                        display: 'block', marginBottom: '12px', 
                        fontSize: '15px', color: 'var(--text-primary)', fontWeight: '700'
                    }}>
                        <i className="fa-solid fa-briefcase" style={{color: '#FCD34D', marginRight: '8px'}}></i>
                        Bước 1: Chọn vị trí cần tuyển dụng (Để AI chọn tiêu chí chấm điểm)
                    </label>
                    <select 
                        value={selectedJobId} 
                        onChange={(e) => setSelectedJobId(e.target.value)}
                        style={{
                            width: '100%', padding: '14px 15px', borderRadius: '8px', 
                            background: 'var(--bg-input)', border: '1px solid var(--border-color)', 
                            color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
                            cursor: 'pointer', fontWeight: '500'
                        }}
                    >
                        <option value="">-- Chọn Vị Trí Tuyển Dụng --</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Upload Component (Bước 2 nằm trong component này) */}
                <CVUpload onScan={handleBatchScan} disabled={isScanning || !selectedJobId} />
                
                {/* 3. Status Bar (Chỉ hiện khi đang scan hoặc có hàng đợi) */}
                {(isScanning || scanQueue.length > 0) && (
                    <div style={{
                        marginTop: '25px', 
                        background: 'var(--bg-secondary)', 
                        padding: '20px', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)', 
                        animation: 'fadeIn 0.3s',
                        boxShadow: 'var(--card-shadow)'
                    }}>
                        <h4 style={{
                            margin: '0 0 15px 0', fontSize: '15px', color: 'var(--text-primary)', fontWeight: '700',
                            display: 'flex', justifyContent: 'space-between'
                        }}>
                            <span><i className="fa-solid fa-list-check" style={{marginRight: '10px', color: '#A5B4FC'}}></i> Tiến độ xử lý</span>
                            <span style={{fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)'}}>
                                Hoàn thành: {scanQueue.filter(i => i.status === 'success').length}/{scanQueue.length}
                            </span>
                        </h4>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto'}}>
                            {scanQueue.map((item, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                    fontSize: '13px', padding: '12px 15px', borderRadius: '8px',
                                    background: item.status === 'processing' ? 'rgba(252, 211, 77, 0.15)' : 'var(--bg-input)',
                                    border: item.status === 'processing' ? '1px solid #FCD34D' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}>
                                    <span style={{display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontWeight: '500'}}>
                                        {item.status === 'pending' && <i className="fa-regular fa-circle" style={{color: 'var(--text-secondary)'}}></i>}
                                        {item.status === 'processing' && <i className="fa-solid fa-spinner fa-spin" style={{color: '#FCD34D'}}></i>}
                                        {item.status === 'success' && <i className="fa-solid fa-check-circle" style={{color: 'var(--accent-color)', fontSize: '16px'}}></i>}
                                        {item.status === 'error' && <i className="fa-solid fa-circle-exclamation" style={{color: '#EF4444', fontSize: '16px'}}></i>}
                                        {item.name}
                                    </span>
                                    <span style={{
                                        color: item.status === 'processing' ? '#FCD34D' : item.status === 'success' ? 'var(--accent-color)' : item.status === 'error' ? '#EF4444' : 'var(--text-secondary)',
                                        fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}>
                                        {item.status === 'processing' ? 'ĐANG PHÂN TÍCH...' : item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 4. RESULTS GRID (Hiển thị kết quả ngay bên dưới) */}
            {scannedResults.length > 0 && (
                <div style={{marginTop: '50px'}}>
                    <h3 style={{
                        borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '25px', 
                        color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700',
                        display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <i className="fa-solid fa-clipboard-check" style={{color: 'var(--accent-color)'}}></i> 
                        Kết quả phân tích ({scannedResults.length})
                    </h3>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px'}}>
                        {scannedResults.map(candidate => (
                            <CandidateCard 
                                key={candidate.id} 
                                data={candidate} 
                                onClick={() => setSelectedCandidate(candidate)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Modal Chi tiết */}
            {selectedCandidate && (
                <CandidateModal 
                    candidate={selectedCandidate} 
                    onClose={() => setSelectedCandidate(null)} 
                />
            )}
        </div>
    );
};

export default CVScanView;