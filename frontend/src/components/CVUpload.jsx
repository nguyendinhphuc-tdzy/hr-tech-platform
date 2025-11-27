import { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from './config'; // Đảm bảo bạn đã có file config.js trong cùng thư mục components

const CVUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !name) {
            alert("Vui lòng nhập tên và chọn file CV!");
            return;
        }

        const formData = new FormData();
        formData.append('cv_file', file);
        formData.append('full_name', name);

        setLoading(true);
        try {
            // Gọi API thông qua biến cấu hình (Tự động chọn Localhost hoặc Render)
            const response = await axios.post(`${API_BASE_URL}/api/cv/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(response.data);
            alert(`✅ Scan xong! Ứng viên: ${response.data.candidate.full_name}\nĐiểm AI: ${response.data.candidate.ai_rating}/10`);
            
            // Reset form sau khi thành công
            setFile(null);
            setName('');
            
            // Gọi hàm reload danh sách ở component cha (Dashboard)
            if (onUploadSuccess) onUploadSuccess();
            
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.error || error.message || "Lỗi không xác định";
            alert("❌ Lỗi khi upload: " + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '20px', 
            background: '#fff', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            marginBottom: '20px',
            border: '1px solid #E5E7EB'
        }}>
            <h3 style={{marginTop: 0, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <i className="fa-solid fa-robot"></i> AI Scan CV
            </h3>
            
            <div style={{display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap'}}>
                <div style={{flex: 1, minWidth: '200px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '14px', color: '#374151'}}>Họ tên ứng viên:</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập tên..."
                        style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB'}}
                    />
                </div>

                <div style={{flex: 1, minWidth: '200px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '14px', color: '#374151'}}>File CV (PDF):</label>
                    <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleFileChange} 
                        style={{fontSize: '14px'}}
                    />
                </div>

                <button 
                    onClick={handleUpload} 
                    disabled={loading}
                    style={{
                        background: loading ? '#9CA3AF' : '#4F46E5',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang quét...</> : <><i className="fa-solid fa-cloud-arrow-up"></i> Scan & Upload</>}
                </button>
            </div>

            {/* Hiển thị kết quả ngắn gọn */}
            {result && (
                <div style={{marginTop: '15px', padding: '12px', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0'}}>
                    <p style={{margin: 0, color: '#047857', fontSize: '14px'}}>
                        <strong>✅ Kết quả AI:</strong> Tìm thấy {result.analysis?.skills?.length || 0} kỹ năng.
                    </p>
                    <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#065F46'}}>
                        Kỹ năng: {result.analysis?.skills?.join(', ') || 'Chưa xác định'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CVUpload;