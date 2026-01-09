/* FILE: frontend/src/views/CVScanView.jsx (Final: Enhanced Contrast & Batch Scan) */
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
    
    // --- STATE CHO PREVIEW (GIỮ LẠI TỪ CODE CŨ NHƯNG ẨN NẾU DÙNG BATCH) ---
    // (Vì Batch Scan dùng CVUpload component riêng, logic preview đơn lẻ ở code cũ có thể không dùng tới 
    // nhưng tôi vẫn giữ lại state để không xóa code theo yêu cầu)
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [result, setResult] = useState(null); // Kết quả đơn lẻ cũ (nếu có dùng)

    // 1. Fetch Jobs
    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/jobs`)
            .then(res => setJobs(res.data))
            .catch(err => console.error("Lỗi lấy jobs:", err));
    }, []);

    // 2. Xử lý Scan Hàng Loạt (Logic chính hiện tại)
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

        // Xử lý tuần tự từng file
        for (let i = 0; i < files.length; i++) {
            const currentFileObj = files[i];

            // Cập nhật trạng thái 'processing'
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
                
                // Cập nhật 'success' và thêm vào kết quả
                setScanQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success' } : item));
                setScannedResults(prev => [res.data.candidate, ...prev]);

                // Cập nhật result đơn lẻ (để tương thích logic cũ nếu cần hiển thị 1 cái mới nhất)
                setResult(res.data.candidate); 

            } catch (err) {
                console.error(`Lỗi file ${currentFileObj.name}:`, err);
                setScanQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
            }
        }

        setIsScanning(false);
    };

    // Hàm dummy để giữ code cũ không bị lỗi (dù không dùng trực tiếp trong giao diện mới)
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        if (selectedFile) setPreviewUrl(URL.createObjectURL(selectedFile));
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
                    {/* Tăng độ tương phản: text-secondary -> text-primary, thêm opacity nhẹ */}
                    <p style={{ color: 'var(--text-primary)', fontSize: '15px', margin: 0, opacity: 0.9, fontWeight: '500' }}>
                        Phân tích hồ sơ ứng viên bằng trí tuệ nhân tạo chuyên sâu.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '25px', height: 'calc(100vh - 180px)' }}>
                
                {/* --- CỘT TRÁI: UPLOAD & QUEUE --- */}
                <div style={{ 
                    flex: '0 0 420px', 
                    display: 'flex', flexDirection: 'column', gap: '20px'
                }}>
                    {/* 1. Control Panel (Updated Colors) */}
                    <div className="card-dark" style={{ padding: '25px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>
                                <i className="fa-solid fa-briefcase" style={{color: '#FCD34D', marginRight: '8px'}}></i>
                                1. Chọn vị trí tuyển dụng (JD)
                            </label>
                            <select 
                                value={selectedJobId} 
                                onChange={(e) => setSelectedJobId(e.target.value)}
                                style={{ 
                                    width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', 
                                    border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: '500', outline: 'none' 
                                }}
                            >
                                <option value="">-- Phân tích tự do (General) --</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>
                                <i className="fa-solid fa-file-pdf" style={{color: '#FCD34D', marginRight: '8px'}}></i>
                                2. Tải lên CV (PDF)
                            </label>
                            {/* Component Upload Mới */}
                            <CVUpload onScan={handleBatchScan} disabled={isScanning || !selectedJobId} />
                        </div>
                    </div>

                    {/* 2. Status Queue (Hiển thị tiến độ) */}
                    {(isScanning || scanQueue.length > 0) && (
                        <div className="card-dark" style={{ 
                            flex: 1, padding: '20px', borderRadius: '12px', 
                            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', overflowY: 'auto' 
                        }}>
                             <h4 style={{margin: '0 0 15px 0', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700'}}>
                                <i className="fa-solid fa-list-check" style={{marginRight: '8px', color: '#A5B4FC'}}></i>
                                Tiến độ xử lý ({scanQueue.filter(i => i.status === 'success').length}/{scanQueue.length})
                            </h4>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                                {scanQueue.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                        fontSize: '13px', padding: '10px 12px', borderRadius: '6px',
                                        background: item.status === 'processing' ? 'rgba(252, 211, 77, 0.15)' : 'var(--bg-input)',
                                        borderLeft: item.status === 'processing' ? '3px solid #FCD34D' : (item.status === 'success' ? '3px solid var(--accent-color)' : '3px solid transparent'),
                                        color: 'var(--text-primary)' // Chữ đậm màu chính
                                    }}>
                                        <span style={{display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden'}}>
                                            {item.status === 'pending' && <i className="fa-regular fa-circle" style={{color: 'var(--text-secondary)'}}></i>}
                                            {item.status === 'processing' && <i className="fa-solid fa-spinner fa-spin" style={{color: '#FCD34D'}}></i>}
                                            {item.status === 'success' && <i className="fa-solid fa-check-circle" style={{color: 'var(--accent-color)'}}></i>}
                                            {item.status === 'error' && <i className="fa-solid fa-circle-exclamation" style={{color: '#EF4444'}}></i>}
                                            <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px', fontWeight: '500'}}>{item.name}</span>
                                        </span>
                                        <span style={{
                                            color: item.status === 'processing' ? '#FCD34D' : item.status === 'success' ? 'var(--accent-color)' : item.status === 'error' ? '#EF4444' : 'var(--text-secondary)',
                                            fontSize: '11px', fontWeight: '800', textTransform: 'uppercase'
                                        }}>
                                            {item.status === 'processing' ? 'Running...' : item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- CỘT PHẢI: KẾT QUẢ PHÂN TÍCH (AI ANALYSIS CONTENT) --- */}
                <div className="card-dark" style={{ 
                    flex: 1, 
                    borderRadius: '12px', 
                    padding: '30px', 
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-background)',
                    position: 'relative'
                }}>
                    {/* Hiển thị danh sách kết quả Grid (NẾU CÓ NHIỀU) */}
                    {scannedResults.length > 0 && !result && (
                         <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                            {scannedResults.map(candidate => (
                                <CandidateCard 
                                    key={candidate.id} 
                                    data={candidate} 
                                    onClick={() => setSelectedCandidate(candidate)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Hiển thị chi tiết 1 kết quả (NẾU CÓ - Logic cũ hoặc khi click vào Grid) */}
                    {/* Ở đây ta ưu tiên hiển thị cái mới nhất scan xong trong biến 'result' hoặc 'selectedCandidate' */}
                    {(result || selectedCandidate) ? (
                        <div className="analysis-result fade-in">
                            {/* --- HEADER KẾT QUẢ --- */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)', fontWeight: '800' }}>
                                        {(result || selectedCandidate).full_name}
                                    </h1>
                                    <p style={{ margin: '8px 0', color: 'var(--accent-color)', fontSize: '15px', fontWeight: '500' }}>
                                        <i className="fa-solid fa-envelope"></i> {(result || selectedCandidate).email || 'Email not found'}
                                    </p>
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                                        <span className="tag" style={{ background: 'rgba(46, 255, 123, 0.1)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', fontWeight: '700' }}>
                                            {(result || selectedCandidate).role}
                                        </span>
                                        <span className="tag" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                                            {new Date().toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* SCORE CIRCLE */}
                                <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-input)" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                            fill="none" 
                                            stroke={(result || selectedCandidate).ai_rating >= 8 ? 'var(--accent-color)' : ((result || selectedCandidate).ai_rating >= 5 ? '#FCD34D' : '#FF4D4D')} 
                                            strokeWidth="3" 
                                            strokeDasharray={`${(result || selectedCandidate).ai_rating * 10}, 100`} 
                                        />
                                    </svg>
                                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{(result || selectedCandidate).ai_rating}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Score</div>
                                    </div>
                                </div>
                            </div>

                            {/* --- AI ANALYSIS CONTENT (VIETNAMESE STYLE) - GIỮ NGUYÊN --- */}
                            <div style={{ display: 'grid', gap: '25px' }}>
                                
                                {/* SUMMARY CARD */}
                                <div style={{ 
                                    background: 'rgba(46, 255, 123, 0.05)', 
                                    padding: '25px', 
                                    borderRadius: '10px', 
                                    borderLeft: '4px solid var(--accent-color)' 
                                }}>
                                    <h3 style={{ margin: '0 0 12px 0', color: 'var(--accent-color)', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fa-solid fa-wand-magic-sparkles"></i> TỔNG QUAN
                                    </h3>
                                    <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-primary)', fontSize: '15px', fontStyle: 'italic', fontWeight: '500' }}>
                                        "{(result || selectedCandidate).ai_analysis?.summary || "Không có tóm tắt."}"
                                    </p>
                                </div>

                                {/* SKILLS CARD */}
                                <div>
                                    <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '15px', fontWeight: '700' }}>
                                        <i className="fa-solid fa-microchip" style={{ color: '#FCD34D', marginRight: '10px' }}></i> KỸ NĂNG NHẬN DIỆN
                                    </h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {(result || selectedCandidate).ai_analysis?.skills?.map((skill, idx) => (
                                            <span key={idx} style={{ 
                                                background: 'var(--bg-input)', 
                                                color: 'var(--text-primary)', 
                                                padding: '8px 16px', 
                                                borderRadius: '20px', 
                                                fontSize: '13px', 
                                                fontWeight: '600',
                                                border: '1px solid var(--border-color)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* DETAILED ANALYSIS (QUAN TRỌNG NHẤT) */}
                                <div style={{ 
                                    background: 'var(--bg-secondary)', 
                                    padding: '30px', 
                                    borderRadius: '12px', 
                                    border: '1px solid var(--border-color)' 
                                }}>
                                    <h3 style={{ margin: '0 0 20px 0', color: '#A5B4FC', fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <i className="fa-solid fa-file-signature"></i> PHÂN TÍCH CHI TIẾT
                                    </h3>
                                    
                                    {/* Vùng nội dung chính - Giữ format xuống dòng & Tăng tương phản */}
                                    <div style={{ 
                                        color: 'var(--text-primary)', // Chữ sáng rõ
                                        fontSize: '15px', 
                                        lineHeight: '1.8', 
                                        whiteSpace: 'pre-wrap', 
                                        fontFamily: "'Roboto', sans-serif",
                                        fontWeight: '400'
                                    }}>
                                        {(result || selectedCandidate).ai_analysis?.match_reason || "Chưa có phân tích chi tiết."}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        // Màn hình chờ khi chưa chọn
                        !isScanning && scannedResults.length === 0 && (
                            <div style={{ 
                                height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                                color: 'var(--text-secondary)', opacity: 0.8 
                            }}>
                                <i className="fa-solid fa-microchip" style={{ fontSize: '60px', marginBottom: '20px', color: 'var(--border-color)' }}></i>
                                <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>Vui lòng chọn Job, tải CV và bấm SCAN để AI làm việc.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Modal Chi tiết (Nếu click từ Grid) */}
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