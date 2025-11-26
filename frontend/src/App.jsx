import { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css'; // Nhập file CSS giao diện

// --- COMPONENT CON: CV UPLOAD (Tích hợp sẵn vào đây cho gọn) ---
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
            // Gọi API Upload lên Server
            const apiUrl = 'https://hr-api-server.onrender.com/api/cv/upload'; 
            const response = await axios.post(apiUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(response.data);
            alert(`✅ Scan xong! Ứng viên: ${response.data.candidate.full_name} - Điểm AI: ${response.data.candidate.ai_rating}`);
            
            // Reset form
            setFile(null);
            setName('');
            
            // Gọi hàm reload danh sách bên ngoài
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            marginBottom: '30px',
            border: '1px solid #E5E7EB'
        }}>
            <h3 style={{marginTop: 0, color: '#4F46E5', display:'flex', alignItems:'center', gap:'10px'}}>
                <i className="fa-solid fa-cloud-arrow-up"></i> Thêm Ứng viên Mới (AI Scan)
            </h3>
            
            <div style={{display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap'}}>
                <div style={{flex: 1, minWidth: '200px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, fontSize:'14px'}}>Họ tên ứng viên:</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập tên..."
                        style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB'}}
                    />
                </div>

                <div style={{flex: 1, minWidth: '200px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: 500, fontSize:'14px'}}>File CV (PDF):</label>
                    <input type="file" accept=".pdf" onChange={handleFileChange} style={{fontSize:'14px'}}/>
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
                    {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang quét...</> : <><i className="fa-solid fa-robot"></i> Scan & Upload</>}
                </button>
            </div>

            {result && (
                <div style={{marginTop: '15px', padding: '10px 15px', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0', fontSize: '14px'}}>
                    <strong style={{color: '#047857'}}>Kết quả AI:</strong> Tìm thấy {result.analysis?.skills?.length} kỹ năng ({result.analysis?.skills?.join(', ')}).
                </div>
            )}
        </div>
    );
};

// --- COMPONENT CHÍNH: APP ---
function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hàm gọi API lấy dữ liệu
  const fetchCandidates = () => {
    setLoading(true);
    axios.get('https://hr-api-server.onrender.com/api/candidates')
      .then(response => {
        setCandidates(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi kết nối:", error);
        setLoading(false);
      });
  };

  // Gọi API khi web vừa tải
  useEffect(() => {
    fetchCandidates();
  }, []);

  // Hàm lọc ứng viên theo trạng thái
  const getCandidatesByStatus = (status) => {
    return candidates.filter(c => c.status === status || c.pipeline_stage === status);
  };

  // Tính toán KPI
  const totalCandidates = candidates.length;
  const interviewCount = getCandidatesByStatus('Interview').length;
  const offerCount = getCandidatesByStatus('Offer').length;

  return (
    <div className="container">
      {/* --- Header --- */}
      <header className="main-header">
        <div className="logo">
          <i className="fa-brands fa-react" style={{fontSize: '24px', color: '#4F46E5'}}></i>
          <h1>Talent Analytics Platform</h1>
        </div>
        <div className="user-profile">
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <div style={{width:'32px', height:'32px', background:'#E0E7FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#4F46E5', fontWeight:'bold'}}>HR</div>
             <span style={{fontWeight: 500}}>HR Manager</span>
          </div>
        </div>
      </header>

      <div className="hr-layout">
        {/* --- Sidebar --- */}
        <aside className="sidebar">
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <div className="sidebar-link active" style={{padding: '12px', background: '#E0E7FF', borderRadius: '8px', color: '#4F46E5', fontWeight: '600', cursor:'pointer', display:'flex', gap:'10px', alignItems:'center'}}>
              <i className="fa-solid fa-table-columns"></i> Dashboard
            </div>
            <div className="sidebar-link" style={{padding: '12px', color: '#6B7280', cursor:'pointer', display:'flex', gap:'10px', alignItems:'center'}}>
              <i className="fa-solid fa-users"></i> Ứng viên
            </div>
            <div className="sidebar-link" style={{padding: '12px', color: '#6B7280', cursor:'pointer', display:'flex', gap:'10px', alignItems:'center'}}>
              <i className="fa-solid fa-calendar"></i> Lịch phỏng vấn
            </div>
            <div className="sidebar-link" style={{padding: '12px', color: '#6B7280', cursor:'pointer', display:'flex', gap:'10px', alignItems:'center'}}>
              <i className="fa-solid fa-gear"></i> Cài đặt
            </div>
          </div>
        </aside>

        {/* --- Main Content --- */}
        <main className="main-content">
          
          {/* 1. KHU VỰC UPLOAD CV MỚI (TÍNH NĂNG AI) */}
          <CVUpload onUploadSuccess={fetchCandidates} />

          {/* 2. KPI Dashboard */}
          <section className="kpi-grid">
            <div className="kpi-card">
              <h3>Tổng ứng viên</h3>
              <p className="value">{totalCandidates}</p>
            </div>
            <div className="kpi-card">
              <h3>Đang phỏng vấn</h3>
              <p className="value">{interviewCount}</p>
            </div>
            <div className="kpi-card">
              <h3>Đã gửi Offer</h3>
              <p className="value" style={{color: '#10B981'}}>{offerCount}</p>
            </div>
            <div className="kpi-card">
              <h3>Vị trí mở</h3>
              <p className="value">3</p>
            </div>
          </section>

          {/* 3. Pipeline Tuyển dụng */}
          <h2 className="section-title" style={{marginBottom: '20px', fontSize: '18px', fontWeight: '600'}}>Quy trình Tuyển dụng</h2>
          
          {loading ? (
             <div style={{textAlign:'center', padding:'20px', color:'#6B7280'}}>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Đang tải dữ liệu...
             </div>
          ) : (
            <div className="recruitment-pipeline">
              
              {/* Cột Screening */}
              <div className="pipeline-column">
                <h3 className="pipeline-column-header">Screening ({getCandidatesByStatus('Screening').length})</h3>
                {getCandidatesByStatus('Screening').map(c => (
                  <CandidateCard key={c.id} data={c} tagClass="tag-screening" />
                ))}
              </div>

              {/* Cột Interview */}
              <div className="pipeline-column">
                <h3 className="pipeline-column-header">Interview ({getCandidatesByStatus('Interview').length})</h3>
                {getCandidatesByStatus('Interview').map(c => (
                  <CandidateCard key={c.id} data={c} tagClass="tag-interview" />
                ))}
              </div>

              {/* Cột Offer */}
              <div className="pipeline-column">
                <h3 className="pipeline-column-header">Offer ({getCandidatesByStatus('Offer').length})</h3>
                {getCandidatesByStatus('Offer').map(c => (
                  <CandidateCard key={c.id} data={c} tagClass="tag-offer" />
                ))}
              </div>

              {/* Cột Rejected */}
              <div className="pipeline-column">
                <h3 className="pipeline-column-header">Rejected ({getCandidatesByStatus('Rejected').length})</h3>
                {getCandidatesByStatus('Rejected').map(c => (
                  <CandidateCard key={c.id} data={c} tagClass="tag-rejected" />
                ))}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- COMPONENT CON: THẺ ỨNG VIÊN ---
function CandidateCard({ data, tagClass }) {
  return (
    <div className="candidate-card">
      <div className="candidate-info">
        <div className="candidate-avatar">
          {data.full_name ? data.full_name.charAt(0).toUpperCase() : '?'}
        </div>
        <div>
          <p className="candidate-name">{data.full_name}</p>
          <p className="candidate-role">{data.role || 'Ứng viên mới'}</p>
        </div>
      </div>
      
      {/* Hiển thị kết quả AI Scan nếu có */}
      {data.ai_analysis && data.ai_analysis.skills && (
          <div style={{fontSize: '11px', color: '#6B7280', marginTop: '8px', background: '#F3F4F6', padding: '4px', borderRadius: '4px'}}>
             Skills: {Array.isArray(data.ai_analysis.skills) ? data.ai_analysis.skills.slice(0, 3).join(', ') : ''}...
          </div>
      )}

      <div className="candidate-details">
        <span className={`tag ${tagClass}`}>{data.status}</span>
        {data.ai_rating > 0 && (
          <span className="candidate-score">
            <i className="fa-solid fa-bolt" style={{marginRight:'5px', color: '#F59E0B'}}></i>
            {data.ai_rating}
          </span>
        )}
      </div>
    </div>
  );
}

export default App;