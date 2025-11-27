import { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const AITraining = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [chatQuery, setChatQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { role: 'bot', text: 'Xin chào! Tôi đã sẵn sàng học tài liệu mới hoặc trả lời câu hỏi của bạn.' }
    ]);
    const [chatting, setChatting] = useState(false);

    // Xử lý Upload
    const handleUpload = async () => {
        if (!file) return alert("Chọn file đi bạn ơi!");
        
        const formData = new FormData();
        formData.append('doc_file', file);
        
        setUploading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/training/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(`✅ ${res.data.message}`);
            setFile(null);
        } catch (err) {
            alert("Lỗi upload: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    // Xử lý Chat
    const handleChat = async () => {
        if (!chatQuery.trim()) return;
        
        // Thêm câu hỏi vào lịch sử
        const newHistory = [...chatHistory, { role: 'user', text: chatQuery }];
        setChatHistory(newHistory);
        setChatQuery('');
        setChatting(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/api/training/chat`, { query: chatQuery });
            setChatHistory([...newHistory, { role: 'bot', text: res.data.answer }]);
        } catch (err) {
            setChatHistory([...newHistory, { role: 'bot', text: "Lỗi kết nối server rồi..." }]);
        } finally {
            setChatting(false);
        }
    };

    return (
        <div className="ai-training-view" style={{display: 'flex', gap: '20px', height: 'calc(100vh - 100px)'}}>
            
            {/* Cột Trái: Upload Tài liệu */}
            <div style={{flex: 1, background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB'}}>
                <h3 className="section-title"><i className="fa-solid fa-cloud-arrow-up"></i> Nạp kiến thức</h3>
                <p style={{fontSize: '13px', color: '#6B7280', marginBottom: '20px'}}>
                    Tải lên file PDF hoặc DOCX (JD, Chính sách, Văn hóa...) để AI ghi nhớ.
                </p>
                
                <div style={{border: '2px dashed #E5E7EB', padding: '30px', textAlign: 'center', borderRadius: '8px', background: '#F9FAFB'}}>
                    <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.docx" style={{marginBottom: '10px'}} />
                    <button 
                        onClick={handleUpload} 
                        disabled={uploading}
                        style={{
                            display: 'block', margin: '10px auto', padding: '10px 20px', 
                            background: uploading ? '#9CA3AF' : '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                        }}
                    >
                        {uploading ? 'Đang đọc & học...' : 'Dạy cho AI ngay'}
                    </button>
                </div>
            </div>

            {/* Cột Phải: Chat Playground */}
            <div style={{flex: 2, background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column'}}>
                <h3 className="section-title"><i className="fa-solid fa-comments"></i> Thử nghiệm (Playground)</h3>
                
                <div style={{flex: 1, overflowY: 'auto', background: '#F9FAFB', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #F3F4F6'}}>
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} style={{
                            marginBottom: '10px', 
                            textAlign: msg.role === 'user' ? 'right' : 'left'
                        }}>
                            <div style={{
                                display: 'inline-block', 
                                padding: '10px 15px', 
                                borderRadius: '15px', 
                                background: msg.role === 'user' ? '#4F46E5' : 'white',
                                color: msg.role === 'user' ? 'white' : '#374151',
                                border: msg.role === 'bot' ? '1px solid #E5E7EB' : 'none',
                                maxWidth: '80%'
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {chatting && <div style={{color: '#6B7280', fontSize: '12px'}}>AI đang suy nghĩ...</div>}
                </div>

                <div style={{display: 'flex', gap: '10px'}}>
                    <input 
                        type="text" 
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                        placeholder="Hỏi về chính sách, văn hóa..."
                        style={{flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB'}}
                    />
                    <button onClick={handleChat} style={{padding: '0 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px'}}>Gửi</button>
                </div>
            </div>
        </div>
    );
};

export default AITraining;