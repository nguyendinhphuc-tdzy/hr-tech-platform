import { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css'; // Nhập file CSS vừa tạo

function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu thật từ Backend
  useEffect(() => {
    axios.get('https://hr-api-server.onrender.com/api/candidates')
      .then(response => {
        setCandidates(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi kết nối:", error);
        setLoading(false);
      });
  }, []);

  // Hàm lọc ứng viên theo trạng thái để chia vào các cột
  const getCandidatesByStatus = (status) => {
    return candidates.filter(c => c.status === status || c.pipeline_stage === status);
  };

  // Tính toán KPI (Dữ liệu thật)
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
          <span style={{fontWeight: 500}}>HR Manager</span>
        </div>
      </header>

      <div className="hr-layout">
        {/* --- Sidebar (Giả lập) --- */}
        <aside className="sidebar">
          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div style={{padding: '10px', background: '#E0E7FF', borderRadius: '8px', color: '#4F46E5', fontWeight: '600'}}>
              <i className="fa-solid fa-table-columns" style={{marginRight: '10px'}}></i> Dashboard
            </div>
            <div style={{padding: '10px', color: '#6B7280'}}>
              <i className="fa-solid fa-users" style={{marginRight: '10px'}}></i> Ứng viên
            </div>
            <div style={{padding: '10px', color: '#6B7280'}}>
              <i className="fa-solid fa-calendar" style={{marginRight: '10px'}}></i> Lịch phỏng vấn
            </div>
          </div>
        </aside>

        {/* --- Main Content --- */}
        <main className="main-content">
          
          {/* KPI Dashboard */}
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
              <h3>Vị trí đang mở</h3>
              <p className="value">3</p>
            </div>
          </section>

          {/* Pipeline Tuyển dụng (Dữ liệu thật) */}
          <h2 className="section-title" style={{marginBottom: '20px', fontSize: '18px', fontWeight: '600'}}>Quy trình Tuyển dụng</h2>
          
          {loading ? <p>Đang tải dữ liệu...</p> : (
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

// Component con để hiển thị thẻ ứng viên cho gọn
function CandidateCard({ data, tagClass }) {
  return (
    <div className="candidate-card">
      <div className="candidate-info">
        <div className="candidate-avatar">
          {data.full_name.charAt(0)}
        </div>
        <div>
          <p className="candidate-name">{data.full_name}</p>
          <p className="candidate-role">{data.role || data.position}</p>
        </div>
      </div>
      <div className="candidate-details">
        <span className={`tag ${tagClass}`}>{data.status}</span>
        {data.ai_rating && (
          <span className="candidate-score">
            <i className="fa-solid fa-bolt" style={{marginRight:'5px'}}></i>
            {data.ai_rating}
          </span>
        )}
      </div>
    </div>
  );
}

export default App;