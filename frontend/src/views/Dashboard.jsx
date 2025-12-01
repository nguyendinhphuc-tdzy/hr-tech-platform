/* FILE: frontend/src/views/Dashboard.jsx */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config'; // Import config URL
import CandidateCard from '../components/CandidateCard'; // Import thẻ ứng viên

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Gọi API lấy danh sách
  const fetchCandidates = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/candidates`)
      .then(response => {
        setCandidates(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu:", err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchCandidates(); }, []);

  // 2. Hàm lọc danh sách theo trạng thái (QUAN TRỌNG: Phải nằm trong component Dashboard)
  const getList = (status) => {
    return candidates.filter(c => {
        // Lấy trạng thái, chuyển về chữ thường để so sánh
        const s = (c.status || c.pipeline_stage || '').toLowerCase();
        return s === status.toLowerCase();
    });
  };

  return (
    <div className="hr-dashboard">
      {/* KPI Section */}
      <section className="kpi-grid">
        <div className="kpi-card"><h3>Tổng hồ sơ</h3><p className="value">{candidates.length}</p></div>
        <div className="kpi-card"><h3>Screening</h3><p className="value">{getList('Screening').length}</p></div>
        <div className="kpi-card"><h3>Phỏng vấn</h3><p className="value">{getList('Interview').length}</p></div>
        <div className="kpi-card"><h3>Offer</h3><p className="value" style={{color:'#10B981'}}>{getList('Offer').length}</p></div>
      </section>

      {/* Pipeline Section */}
      <h2 className="section-title">Quy trình Tuyển dụng</h2>
      
      {loading ? (
        <div style={{textAlign:'center', color:'#6B7280', padding:'20px'}}>
            <i className="fa-solid fa-circle-notch fa-spin"></i> Đang tải dữ liệu...
        </div>
      ) : (
        <div className="recruitment-pipeline">
           {/* Gọi hàm getList ở đây sẽ không bị lỗi nữa */}
           <PipelineColumn title="Screening" list={getList('Screening')} tag="tag-screening" />
           <PipelineColumn title="Interview" list={getList('Interview')} tag="tag-interview" />
           <PipelineColumn title="Offer" list={getList('Offer')} tag="tag-offer" />
           <PipelineColumn title="Rejected" list={getList('Rejected')} tag="tag-rejected" />
        </div>
      )}
    </div>
  );
};

// Component con hiển thị cột (Để code gọn hơn)
const PipelineColumn = ({ title, list, tag }) => (
    <div className="pipeline-column">
        <h3 className="pipeline-column-header">{title} ({list.length})</h3>
        {list.length === 0 && <p style={{fontSize:'12px', color:'#9CA3AF', fontStyle:'italic'}}>Trống</p>}
        
        {list.map(c => (
            <CandidateCard key={c.id} data={c} />
        ))}
    </div>
);

export default Dashboard;