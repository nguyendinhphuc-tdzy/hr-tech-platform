/* FILE: frontend/src/views/Dashboard.jsx (Eco-Futuristic Theme) */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';
import CandidateCard from '../components/CandidateCard';
import CandidateModal from '../components/CandidateModal';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

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

  // 2. Hàm lọc danh sách
  const getList = (status) => {
    return candidates.filter(c => {
        const s = (c.status || c.pipeline_stage || '').toLowerCase();
        return s === status.toLowerCase();
    });
  };

  return (
    <div className="hr-dashboard" style={{ color: 'var(--text-white)' }}>
      
      {/* --- KPI SECTION (Thẻ chỉ số Neon) --- */}
      <section className="kpi-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
      }}>
        <KpiCard 
            title="Tổng hồ sơ" 
            value={candidates.length} 
            icon="fa-users" 
            color="var(--text-white)" 
        />
        <KpiCard 
            title="Screening" 
            value={getList('Screening').length} 
            icon="fa-filter" 
            color="#A5B4FC" 
        />
        <KpiCard 
            title="Phỏng vấn" 
            value={getList('Interview').length} 
            icon="fa-comments" 
            color="#FCD34D" 
        />
        <KpiCard 
            title="Offer" 
            value={getList('Offer').length} 
            icon="fa-check-circle" 
            color="var(--neon-green)" 
            glow={true} // Hiệu ứng phát sáng đặc biệt
        />
      </section>

      {/* --- PIPELINE SECTION --- */}
      <h2 className="section-title" style={{ 
          color: 'var(--neon-green)', 
          marginBottom: '20px', 
          fontSize: '20px', 
          textTransform: 'uppercase', 
          letterSpacing: '1px',
          display: 'flex', alignItems: 'center', gap: '10px',
          textShadow: '0 0 10px rgba(46, 255, 123, 0.3)'
      }}>
        <i className="fa-solid fa-layer-group"></i> Quy trình Tuyển dụng
      </h2>
      
      {loading ? (
        <div style={{textAlign:'center', color:'var(--text-secondary)', padding:'40px'}}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{fontSize: '30px', color: 'var(--neon-green)'}}></i>
            <p style={{marginTop: '10px'}}>Đang tải dữ liệu từ không gian số...</p>
        </div>
      ) : (
        <div className="recruitment-pipeline" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px' 
        }}>
           <PipelineColumn 
                title="Screening" 
                list={getList('Screening')} 
                icon="fa-magnifying-glass" 
                onSelect={setSelectedCandidate} 
           />
           <PipelineColumn 
                title="Interview" 
                list={getList('Interview')} 
                icon="fa-user-tie" 
                onSelect={setSelectedCandidate} 
           />
           <PipelineColumn 
                title="Offer" 
                list={getList('Offer')} 
                icon="fa-envelope-open-text" 
                onSelect={setSelectedCandidate} 
           />
           <PipelineColumn 
                title="Rejected" 
                list={getList('Rejected')} 
                icon="fa-ban" 
                onSelect={setSelectedCandidate} 
           />
        </div>
      )}

      {/* --- MODAL CHI TIẾT --- */}
      {selectedCandidate && (
        <CandidateModal 
            candidate={selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS (Đã được Style lại theo Eco-Futuristic) ---

const KpiCard = ({ title, value, icon, color, glow }) => (
    <div style={{
        background: 'var(--card-background)',
        padding: '20px',
        borderRadius: '12px',
        border: `1px solid ${glow ? 'var(--neon-green)' : 'var(--border-color)'}`,
        boxShadow: glow ? '0 0 15px rgba(46, 255, 123, 0.2)' : '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'transform 0.2s',
        position: 'relative', overflow: 'hidden'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
        {/* Đường viền trang trí mờ */}
        <div style={{position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: color}}></div>

        <div>
            <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>{title}</h3>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: color }}>{value}</p>
        </div>
        <div style={{ 
            fontSize: '24px', color: color, opacity: 0.9,
            background: 'rgba(255,255,255,0.05)', width: '50px', height: '50px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
            border: `1px solid ${color}40`
        }}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
    </div>
);

const PipelineColumn = ({ title, list, icon, onSelect }) => (
    <div className="pipeline-column" style={{
        background: 'var(--pipeline-bg)', // Màu tối sẫm #0D1825
        padding: '15px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        minHeight: '600px',
        display: 'flex', flexDirection: 'column'
    }}>
        <h3 className="pipeline-column-header" style={{
            color: 'var(--text-white)', 
            fontSize: '14px', 
            marginBottom: '15px', 
            textTransform: 'uppercase', 
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: '10px',
            display: 'flex', alignItems: 'center', gap: '8px'
        }}>
            <i className={`fa-solid ${icon}`} style={{color: 'var(--neon-green)'}}></i>
            {title} 
            <span style={{
                background: '#1A2736', 
                color: 'var(--text-gray)',
                padding: '2px 8px', 
                borderRadius: '10px', 
                fontSize: '11px', 
                marginLeft: 'auto',
                border: '1px solid var(--border-color)'
            }}>
                {list.length}
            </span>
        </h3>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
            {list.length === 0 && (
                <div style={{textAlign: 'center', padding: '30px 0', opacity: 0.5, color: 'var(--text-secondary)'}}>
                    <i className="fa-regular fa-folder-open" style={{fontSize: '30px', marginBottom: '10px'}}></i>
                    <p style={{fontSize: '13px'}}>Chưa có dữ liệu</p>
                </div>
            )}
            
            {list.map(c => (
                <CandidateCard 
                    key={c.id} 
                    data={c} 
                    onClick={() => onSelect(c)} 
                />
            ))}
        </div>
    </div>
);

export default Dashboard;