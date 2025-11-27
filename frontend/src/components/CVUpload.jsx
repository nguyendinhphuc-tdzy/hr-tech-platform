import { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from './config'; // Import file cấu hình URL

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
            // Sử dụng biến API_BASE_URL để tự động chọn localhost hoặc Render
            const response = await axios.post(`${API_BASE_URL}/api/cv/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(response.data);
            alert(`✅ Scan xong! Ứng viên: ${response.data.candidate.full_name} - Điểm AI: ${response.data.candidate.ai_rating}`);
            
            // Reset form
            setFile(null);
            setName('');
            
            // Gọi hàm reload danh sách bên ngoài (nếu có)
            if (onUploadSuccess) onUploadSuccess();
            
        } catch (error) {
            console.error(error);
            alert("Lỗi khi upload: " + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '20px', 
            background: '#fff', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            marginBottom: '20px',
            border: '1px solid #E5E7EB'
        }}>
            <h3 style={{marginTop: 0, color: '#4F46E5', display:'flex', alignItems:'center', gap:'10px'}}>
                <i className="fa-solid fa-robot"></i> AI Scan CV Test
            </h3>
            
            <div style={{marginBottom: '10px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 500}}>Tên ứng viên:</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên ứng viên..."
                    style={{width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB'}}
                />
            </div>

            <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: 500}}>File CV (PDF):</label>
                <input type="file" accept=".pdf" onChange={handleFileChange} />
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
                    fontWeight: 600
                }}
            >
                {loading ? 'Đang phân tích...' : 'Upload & Scan Ngay'}
            </button>

            {result && (
                <div style={{marginTop: '15px', padding: '10px', background: '#F0FDF4', borderRadius: '6px', border: '1px solid #BBF7D0'}}>
                    <p style={{margin: 0, color: '#166534'}}>
                        <strong>✅ Kết quả:</strong> Tìm thấy {result.analysis?.skills?.length} kỹ năng.
                    </p>
                    <p style={{margin: '5px 0 0 0', fontSize: '14px'}}>Kỹ năng: {result.analysis?.skills?.join(', ')}</p>
                </div>
            )}
        </div>
    );
};

export default CVUpload;