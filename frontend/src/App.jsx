import { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import CVUpload from './CVUpload'; // <--- IMPORT TỪ FILE RỜI (Chuẩn chuyên nghiệp)

function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hàm gọi API lấy dữ liệu
  const fetchCandidates = () => {
    setLoading(true);
    // LƯU Ý: Khi deploy lên Netlify, bạn nên dùng biến môi trường thay vì hardcode link này
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

  useEffect(() => {
    fetchCandidates();
  }, []);

  const getCandidatesByStatus = (status) => {
    return candidates.filter(c => {
        const s = (c.status || c.pipeline_stage || '').toLowerCase();
        return s === status.toLowerCase();
    });
  };

  const totalCandidates = candidates.length;
  const interviewCount = getCandidatesByStatus('Interview').length;
  const offerCount = getCandidatesByStatus('Offer').length;

  return (
    <div className="container">
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
        <aside className="sidebar">
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <div className="sidebar-link active" style={{padding: '12px', background: '#E0E7FF', borderRadius: '8px', color: '#4F46E5', fontWeight: '600', cursor:'pointer', display:'flex', gap:'10px', alignItems:'center'}}>
              <i className="fa-solid fa-table-columns"></i> Dashboard
            </div>
            {/* Các menu khác... */}
          </div>
        </aside>

        <main className="main-content">
          {/* Component Upload được Import vào, code gọn hơn hẳn */}
          <CVUpload onUploadSuccess={fetchCandidates} />

          <section className="kpi-grid">
            <div className="kpi-card"><h3>Tổng ứng viên</h3><p className="value">{totalCandidates}</p></div>
            <div className="kpi-card"><h3>Phỏng vấn</h3><p className="value">{interviewCount}</p></div>
            <div className="kpi-card"><h3>Offer</h3><p className="value" style={{color: '#10B981'}}>{offerCount}</p></div>
            <div className="kpi-card"><h3>Vị trí mở</h3><p className="value">3</p></div>
          </section>

          <h2 className="section-title" style={{marginBottom: '20px', fontSize: '18px', fontWeight: '600'}}>Quy trình Tuyển dụng</h2>
          
          {loading ? (
             <div style={{textAlign:'center', padding:'20px', color:'#6B7280'}}>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Đang tải dữ liệu...
             </div>
          ) : (
            <div className="recruitment-pipeline">
              <PipelineColumn title="Screening" list={getCandidatesByStatus('Screening')} tag="tag-screening" />
              <PipelineColumn title="Interview" list={getCandidatesByStatus('Interview')} tag="tag-interview" />
              <PipelineColumn title="Offer" list={getCandidatesByStatus('Offer')} tag="tag-offer" />
              <PipelineColumn title="Rejected" list={getCandidatesByStatus('Rejected')} tag="tag-rejected" />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Component cột và thẻ ứng viên
const PipelineColumn = ({ title, list, tag }) => (
    <div className="pipeline-column">
        <h3 className="pipeline-column-header">{title} ({list.length})</h3>
        {list.map(c => (
            <div key={c.id} className="candidate-card">
                <div className="candidate-info">
                    <div className="candidate-avatar">{c.full_name ? c.full_name.charAt(0).toUpperCase() : '?'}</div>
                    <div>
                        <p className="candidate-name">{c.full_name}</p>
                        <p className="candidate-role">{c.role || 'Ứng viên'}</p>
                    </div>
                </div>
                
                {c.ai_analysis && c.ai_analysis.skills && (
                    <div style={{fontSize: '11px', color: '#6B7280', marginTop: '8px', background: '#F3F4F6', padding: '4px', borderRadius: '4px'}}>
                       Skills: {Array.isArray(c.ai_analysis.skills) ? c.ai_analysis.skills.slice(0, 3).join(', ') : ''}...
                    </div>
                )}

                <div className="candidate-details">
                    <span className={`tag ${tag}`}>{title}</span>
                    {c.ai_rating > 0 && (
                        <span className="candidate-score">
                            <i className="fa-solid fa-bolt" style={{marginRight:'5px', color: '#F59E0B'}}></i>
                            {c.ai_rating}
                        </span>
                    )}
                </div>
            </div>
        ))}
    </div>
);

export default App;