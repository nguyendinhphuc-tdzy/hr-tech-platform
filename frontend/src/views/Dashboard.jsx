import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';
import CandidateModal from '../components/CandidateModal'; // Import Modal

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null); // State quản lý modal

  // ... (giữ nguyên hàm fetchCandidates) ...

  // Sửa phần render của PipelineColumn để thêm sự kiện onClick
  // ...
  
  return (
    <div className="hr-dashboard">
      {/* ... (KPI section giữ nguyên) ... */}

      {/* ... (Pipeline section) ... */}
      <div className="recruitment-pipeline">
           {/* Truyền hàm setSelectedCandidate xuống */}
           <PipelineColumn title="Screening" list={getList('Screening')} onSelect={setSelectedCandidate} />
           <PipelineColumn title="Interview" list={getList('Interview')} onSelect={setSelectedCandidate} />
           <PipelineColumn title="Offer" list={getList('Offer')} onSelect={setSelectedCandidate} />
           <PipelineColumn title="Rejected" list={getList('Rejected')} onSelect={setSelectedCandidate} />
      </div>

      {/* Hiển thị Modal nếu có candidate được chọn */}
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
            <div 
                key={c.id} 
                className="candidate-card" 
                onClick={() => onSelect(c)} // Bắt sự kiện click
                style={{cursor: 'pointer'}}
            >
                {/* ... (Nội dung thẻ giữ nguyên) ... */}
                <p className="candidate-name">{c.full_name}</p>
                {/* ... */}
            </div>
        ))}
    </div>
);

export default Dashboard;