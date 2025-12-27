/* FILE: frontend/src/views/Dashboard.jsx (Theme Aware & Full Width Layout) */
import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';
import CandidateCard from '../components/CandidateCard';
import CandidateModal from '../components/CandidateModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const fetchCandidates = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/candidates`)
      .then(response => {
        setCandidates(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi:", err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchCandidates(); }, []);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    const updatedCandidates = candidates.map(c => 
        c.id.toString() === draggableId ? { ...c, status: newStatus } : c
    );
    setCandidates(updatedCandidates);

    try {
        await axios.put(`${API_BASE_URL}/api/candidates/${draggableId}/status`, { status: newStatus });
    } catch (error) { console.error("Lỗi update:", error); }
  };

  const getList = (status) => candidates.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());

  return (
    <div className="hr-dashboard" style={{ color: 'var(--text-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. KPI SECTION */}
      <section className="kpi-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '20px',
          flexShrink: 0 
      }}>
        <KpiCard title="Tổng hồ sơ" value={candidates.length} icon="fa-users" color="var(--text-primary)" />
        <KpiCard title="Phỏng vấn" value={getList('Interview').length} icon="fa-comments" color="#FCD34D" />
        <KpiCard title="Offer" value={getList('Offer').length} icon="fa-envelope-open-text" color="#6EE7B7" />
        <KpiCard title="Hired" value={getList('Hired').length} icon="fa-handshake" color="var(--accent-color)" glow={true} />
      </section>

      {/* 2. PIPELINE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexShrink: 0 }}>
          <h2 className="section-title" style={{ color: 'var(--accent-color)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '16px' }}>
            <i className="fa-solid fa-layer-group" style={{marginRight:'10px'}}></i> Quy trình Tuyển dụng
          </h2>
          <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
              <i className="fa-solid fa-arrows-left-right" style={{marginRight: '5px'}}></i> Kéo thả để chuyển trạng thái
          </div>
      </div>
      
      {/* 3. KANBAN BOARD (FULL WIDTH 5 CỘT) */}
      <div style={{ flex: 1, overflow: 'hidden' /* Ẩn scroll ngoài, chỉ scroll trong cột */ }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="recruitment-pipeline" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 1fr)', /* Chia đều 5 cột */
                gap: '12px',
                alignItems: 'start',
                height: '100%',
                minWidth: '1000px', /* Đảm bảo không bị co quá nhỏ trên màn hình bé */
                overflowX: 'auto'   /* Scroll ngang nếu màn hình < 1000px */
            }}>
               {['Screening', 'Interview', 'Offer', 'Hired', 'Rejected'].map(status => (
                   <PipelineColumn 
                        key={status} 
                        status={status} 
                        list={getList(status)} 
                        onSelect={setSelectedCandidate} 
                   />
               ))}
            </div>
          </DragDropContext>
      </div>

      {/* MODAL */}
      {selectedCandidate && (
        <CandidateModal 
            candidate={selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
            onUpdate={fetchCandidates} 
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENT: PIPELINE COLUMN (THEME FIXED & COMPACT) ---
const PipelineColumn = ({ status, list, onSelect }) => {
    const config = {
        'Screening': { icon: 'fa-magnifying-glass', color: '#A5B4FC', border: '#A5B4FC' },
        'Interview': { icon: 'fa-user-tie', color: '#FCD34D', border: '#FCD34D' },
        'Offer':     { icon: 'fa-envelope-open-text', color: '#6EE7B7', border: '#6EE7B7' },
        'Hired':     { icon: 'fa-handshake', color: 'var(--accent-color)', border: 'var(--accent-color)', bgGlow: 'var(--accent-glow)' },
        'Rejected':  { icon: 'fa-ban', color: '#FCA5A5', border: '#FCA5A5' }
    }[status] || { icon: 'fa-circle', color: 'var(--text-secondary)', border: 'var(--border-color)' };

    const isHiredColumn = status === 'Hired';

    return (
        <Droppable droppableId={status}>
            {(provided, snapshot) => (
                <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="pipeline-column" 
                    style={{
                        background: snapshot.isDraggingOver 
                            ? 'var(--bg-input)' 
                            : (isHiredColumn ? 'var(--bg-tertiary)' : 'var(--pipeline-bg)'),
                        padding: '10px', 
                        borderRadius: '12px', 
                        border: isHiredColumn ? `1px solid ${config.border}` : '1px solid var(--border-color)',
                        display: 'flex', flexDirection: 'column',
                        height: '100%', 
                        transition: 'all 0.2s',
                        boxShadow: isHiredColumn ? '0 0 15px var(--accent-glow)' : 'none'
                    }}
                >
                    {/* Header Cột */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 5px 10px 5px', marginBottom: '10px',
                        borderBottom: `2px solid ${isHiredColumn ? config.border : 'var(--border-color)'}`
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden'}}>
                            <i className={`fa-solid ${config.icon}`} style={{color: config.color, fontSize: '13px'}}></i>
                            <span style={{
                                fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', 
                                color: isHiredColumn ? config.color : 'var(--text-secondary)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>
                                {status}
                            </span>
                        </div>
                        <span style={{
                            background: isHiredColumn ? config.color : 'var(--bg-input)',
                            color: isHiredColumn ? '#000' : 'var(--text-secondary)',
                            borderRadius: '10px', padding: '1px 8px', fontSize: '10px', fontWeight: 'bold',
                            border: `1px solid ${isHiredColumn ? 'transparent' : 'var(--border-color)'}`
                        }}>
                            {list.length}
                        </span>
                    </div>
                    
                    {/* Danh sách thẻ */}
                    <div style={{flex: 1, overflowY: 'auto', paddingRight: '2px'}} className="custom-scrollbar">
                        {list.length === 0 && (
                            <div style={{textAlign: 'center', padding: '40px 0', opacity: 0.5, color: 'var(--text-secondary)'}}>
                                <i className="fa-regular fa-folder-open" style={{fontSize: '20px', marginBottom: '8px'}}></i>
                                <p style={{fontSize: '11px', margin: 0}}>Trống</p>
                            </div>
                        )}

                        {list.map((c, index) => (
                            <Draggable key={c.id.toString()} draggableId={c.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{ 
                                            ...provided.draggableProps.style, 
                                            marginBottom: '8px',
                                            transform: snapshot.isDragging ? provided.draggableProps.style.transform : 'none' 
                                        }}
                                    >
                                        <CandidateCard data={c} onClick={() => onSelect(c)} />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                </div>
            )}
        </Droppable>
    );
};

// --- SUB-COMPONENT: KPI CARD (THEME FIXED) ---
const KpiCard = ({ title, value, icon, color, glow }) => (
    <div style={{
        background: 'var(--bg-tertiary)', 
        padding: '15px 20px', borderRadius: '12px',
        border: `1px solid ${glow ? 'var(--accent-color)' : 'var(--border-color)'}`,
        boxShadow: glow ? '0 0 15px var(--accent-glow)' : 'var(--card-shadow)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        transition: 'transform 0.2s'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
        {glow && <div style={{position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-color)'}}></div>}
        <div>
            <h3 style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>{title}</h3>
            <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: color }}>{value}</p>
        </div>
        <div style={{ 
            fontSize: '18px', color: color, opacity: 0.9, 
            background: 'var(--bg-input)', width: '40px', height: '40px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px',
            border: '1px solid var(--border-color)'
        }}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
    </div>
);

export default Dashboard;