/* FILE: frontend/src/views/Dashboard.jsx (Theme Aware & Aesthetic) */
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
          gap: '20px', 
          marginBottom: '25px',
          flexShrink: 0 
      }}>
        <KpiCard title="Tổng hồ sơ" value={candidates.length} icon="fa-users" color="var(--text-primary)" />
        <KpiCard title="Phỏng vấn" value={getList('Interview').length} icon="fa-comments" color="#FCD34D" />
        <KpiCard title="Offer" value={getList('Offer').length} icon="fa-envelope-open-text" color="#6EE7B7" />
        <KpiCard title="Hired" value={getList('Hired').length} icon="fa-handshake" color="var(--accent-color)" glow={true} />
      </section>

      {/* 2. PIPELINE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', flexShrink: 0 }}>
          <h2 className="section-title" style={{ color: 'var(--accent-color)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '18px' }}>
            <i className="fa-solid fa-layer-group" style={{marginRight:'10px'}}></i> Quy trình Tuyển dụng
          </h2>
          <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
              <i className="fa-solid fa-arrows-left-right" style={{marginRight: '5px'}}></i> Kéo thả để chuyển trạng thái
          </div>
      </div>
      
      {/* 3. KANBAN BOARD */}
      <div style={{ flex: 1, overflowX: 'auto', paddingBottom: '10px' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="recruitment-pipeline" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 300px)', 
                gap: '20px',
                alignItems: 'start',
                height: '100%'
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

// --- SUB-COMPONENT: PIPELINE COLUMN (THEME FIXED) ---
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
                        /* SỬA: Thay màu cứng bằng biến CSS */
                        background: snapshot.isDraggingOver 
                            ? 'var(--bg-input)' 
                            : (isHiredColumn ? 'var(--bg-tertiary)' : 'var(--pipeline-bg)'),
                        padding: '12px', 
                        borderRadius: '16px', 
                        /* SỬA: Border động theo trạng thái */
                        border: isHiredColumn ? `1px solid ${config.border}` : '1px solid var(--border-color)',
                        display: 'flex', flexDirection: 'column',
                        height: '100%', 
                        minHeight: '600px',
                        transition: 'all 0.2s',
                        /* SỬA: Glow effect cho cột Hired */
                        boxShadow: isHiredColumn ? '0 0 20px var(--accent-glow)' : 'none'
                    }}
                >
                    {/* Header Cột */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 5px', marginBottom: '15px',
                        borderBottom: `2px solid ${isHiredColumn ? config.border : 'var(--border-color)'}`
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <i className={`fa-solid ${config.icon}`} style={{color: config.color}}></i>
                            <span style={{fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', color: isHiredColumn ? config.color : 'var(--text-secondary)'}}>
                                {status}
                            </span>
                        </div>
                        <span style={{
                            background: isHiredColumn ? config.color : 'var(--bg-input)',
                            color: isHiredColumn ? '#000' : 'var(--text-secondary)',
                            borderRadius: '12px', padding: '2px 10px', fontSize: '11px', fontWeight: 'bold',
                            border: `1px solid ${isHiredColumn ? 'transparent' : 'var(--border-color)'}`
                        }}>
                            {list.length}
                        </span>
                    </div>
                    
                    {/* Danh sách thẻ */}
                    <div style={{flex: 1, overflowY: 'auto', paddingRight: '4px'}} className="custom-scrollbar">
                        {list.length === 0 && (
                            <div style={{textAlign: 'center', padding: '40px 0', opacity: 0.5, color: 'var(--text-secondary)'}}>
                                <i className="fa-regular fa-folder-open" style={{fontSize: '24px', marginBottom: '10px'}}></i>
                                <p style={{fontSize: '12px', margin: 0}}>Trống</p>
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
                                            marginBottom: '12px',
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
        /* SỬA: Dùng biến nền */
        background: 'var(--bg-tertiary)', 
        padding: '20px', borderRadius: '16px',
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
            <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>{title}</h3>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: color }}>{value}</p>
        </div>
        <div style={{ 
            fontSize: '20px', color: color, opacity: 0.9, 
            background: 'var(--bg-input)', width: '48px', height: '48px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px',
            border: '1px solid var(--border-color)'
        }}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
    </div>
);

export default Dashboard;