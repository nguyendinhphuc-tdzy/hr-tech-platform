import { useState, useEffect } from 'react';
import axios from 'axios';
import CandidateCard from '../components/CandidateCard';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gọi API Backend
  const fetchCandidates = () => {
    // URL Render của bạn
    axios.get('${API_BASE_URL}/api/candidates')
      .then(response => {
        setCandidates(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchCandidates(); }, []);

  // Lọc danh sách theo cột
  const getList = (status) => candidates.filter(c => 
    (c.status || c.pipeline_stage || '').toLowerCase() === status.toLowerCase()
  );

  return (
    <div className="hr-dashboard">
      {/* KPI Section */}
      <section className="kpi-grid">
        <div className="kpi-card"><h3>Tổng hồ sơ</h3><p className="value">{candidates.length}</p></div>
        <div className="kpi-card"><h3>Phỏng vấn</h3><p className="value">{getList('Interview').length}</p></div>
        <div className="kpi-card"><h3>Offer</h3><p className="value" style={{color:'#10B981'}}>{getList('Offer').length}</p></div>
        <div className="kpi-card"><h3>Vị trí mở</h3><p className="value">5</p></div>
      </section>

      {/* Pipeline Section */}
      <h2 className="section-title">Quy trình Tuyển dụng</h2>
      {loading ? <div style={{textAlign:'center', color:'#666'}}>Đang tải dữ liệu...</div> : (
        <div className="recruitment-pipeline">
           <PipelineColumn title="Screening" list={getList('Screening')} />
           <PipelineColumn title="Interview" list={getList('Interview')} />
           <PipelineColumn title="Offer" list={getList('Offer')} />
           <PipelineColumn title="Rejected" list={getList('Rejected')} />
        </div>
      )}
    </div>
  );
};

const PipelineColumn = ({ title, list }) => (
    <div className="pipeline-column">
        <h3 className="pipeline-column-header">{title} ({list.length})</h3>
        {list.map(c => <CandidateCard key={c.id} data={c} />)}
    </div>
);

export default Dashboard;