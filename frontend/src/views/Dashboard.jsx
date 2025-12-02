/* FILE: frontend/src/views/Dashboard.jsx */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';
import CandidateCard from '../components/CandidateCard';
import CandidateModal from '../components/CandidateModal'; // <--- IMPORT MODAL MỚI

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null); // <--- STATE QUẢN LÝ MODAL

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

  const getList = (status) => {
    return candidates.filter(c => {
        const s = (c.status || c.pipeline_stage || '').toLowerCase();
        return s === status.toLowerCase();
    });
  };

  return (
    <div className="hr-dashboard">
      {/* KPI Section (Giữ nguyên) */}
      <section className="kpi-grid">
        <div className="kpi-card"><h3>Tổng hồ sơ</h3><p className="value">{candidates.length}</p></div>
        <div className="kpi-card"><h3>Screening</h3><p className="value">{getList('Screening').length}</p></div>
        <div className="kpi-card"><h3>Phỏng vấn</h3><p className="value">{getList('Interview').length}</p></div>
        <div className="kpi-card"><h3>Offer</h3><p className="value" style={{color:'#10B981'}}>{getList('Offer').length}</p></div>
      </section>

      <h2 className="section-title">Quy trình Tuyển dụng</h2>
      
      {loading ? (
        <div style={{textAlign:'center', color:'#6B7280', padding:'20px'}}>Đang tải...</div>
      ) : (
        <div className="recruitment-pipeline">
           {/* Truyền hàm mở modal xuống */}
           <PipelineColumn title="Screening" list={getList('Screening')} onSelect={setSelectedCandidate} />
           <PipelineColumn title="Interview" list={getList('Interview')} onSelect={setSelectedCandidate} />
           <PipelineColumn title="Offer" list={getList('Offer')} onSelect={setSelectedCandidate} />
           <PipelineColumn title="Rejected" list={getList('Rejected')} onSelect={setSelectedCandidate} />
        </div>
      )}

      {/* --- HIỂN THỊ MODAL NẾU CÓ NGƯỜI ĐƯỢC CHỌN --- */}
      {selectedCandidate && (
        <CandidateModal 
            candidate={selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
        />
      )}
    </div>
  );
};

// Sửa component con để nhận sự kiện click
const PipelineColumn = ({ title, list, onSelect }) => (
    <div className="pipeline-column">
        <h3 className="pipeline-column-header">{title} ({list.length})</h3>
        {list.map(c => (
            <CandidateCard 
                key={c.id} 
                data={c} 
                onClick={() => onSelect(c)} // <--- GỌI HÀM MỞ MODAL
            />
        ))}
    </div>
);

export default Dashboard;