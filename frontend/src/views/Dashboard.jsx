/* FILE: frontend/src/views/Dashboard.jsx */
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';
import CandidateCard from '../components/CandidateCard';
import CandidateModal from '../components/CandidateModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Dashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // --- STATE BỘ LỌC NGÀY ---
  const [dateFilterType, setDateFilterType] = useState('all'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

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

  const handleStatusChange = async (candidateId, newStatus) => {
      const updatedCandidates = candidates.map(c => 
          c.id === candidateId ? { ...c, status: newStatus } : c
      );
      setCandidates(updatedCandidates);

      try {
          await axios.put(`${API_BASE_URL}/api/candidates/${candidateId}/status`, { status: newStatus });
      } catch (error) {
          console.error("Lỗi update:", error);
          fetchCandidates(); // Revert nếu lỗi
      }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId;
    handleStatusChange(parseInt(draggableId), newStatus);
  };

  // --- LOGIC LỌC ỨNG VIÊN NÂNG CAO ---
  const filteredCandidates = useMemo(() => {
      if (candidates.length === 0) return [];

      return candidates.filter(c => {
          const createdDate = new Date(c.created_at || Date.now());
          createdDate.setHours(0, 0, 0, 0);
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          // 1. Lọc theo Preset
          if (dateFilterType !== 'custom') {
              const diffTime = Math.abs(now - createdDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

              if (dateFilterType === 'all') return true;
              if (dateFilterType === 'today') return diffDays === 0;
              if (dateFilterType === 'week') return diffDays <= 7;
              if (dateFilterType === 'month') return diffDays <= 30;
          }

          // 2. Lọc theo Custom Range
          if (dateFilterType === 'custom') {
              if (!customRange.start && !customRange.end) return true;
              
              const start = customRange.start ? new Date(customRange.start) : new Date('1970-01-01');
              const end = customRange.end ? new Date(customRange.end) : new Date('2100-01-01');
              end.setHours(23, 59, 59, 999); 

              return createdDate >= start && createdDate <= end;
          }
          return true;
      });
  }, [candidates, dateFilterType, customRange]);

  const getList = (status) => filteredCandidates.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());

  return (
    <div className="hr-dashboard" style={{ color: 'var(--text-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. KPI SECTION (REDESIGNED) */}
      <section className="kpi-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', marginBottom: '25px', flexShrink: 0 
      }}>
        <KpiCard title="Tổng hồ sơ" value={filteredCandidates.length} icon="fa-users" color="var(--text-primary)" />
        <KpiCard title="Phỏng vấn" value={getList('Interview').length} icon="fa-comments" color="#FCD34D" />
        <KpiCard title="Offer" value={getList('Offer').length} icon="fa-envelope-open-text" color="#6EE7B7" />
        <KpiCard title="Hired" value={getList('Hired').length} icon="fa-handshake" color="var(--accent-color)" glow={true} />
      </section>

      {/* 2. TOOLBAR & FILTER */}
      <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          marginBottom: '15px', flexShrink: 0, flexWrap: 'wrap', gap: '15px'
      }}>
          <h2 className="section-title" style={{ color: 'var(--accent-color)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '16px' }}>
            <i className="fa-solid fa-layer-group" style={{marginRight:'10px'}}></i> Quy trình Tuyển dụng
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              
              {/* Dropdown loại bộ lọc */}
              <div style={{position: 'relative'}}>
                  <i className="fa-solid fa-filter" style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'var(--accent-color)', fontSize:'12px'}}></i>
                  <select 
                      value={dateFilterType}
                      onChange={(e) => setDateFilterType(e.target.value)}
                      style={{
                          padding: '8px 10px 8px 30px', borderRadius: '6px',
                          background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600',
                          cursor: 'pointer', outline: 'none', minWidth: '150px'
                      }}
                  >
                      <option value="all">Tất cả thời gian</option>
                      <option value="today">Hôm nay</option>
                      <option value="week">7 ngày qua</option>
                      <option value="month">Tháng này</option>
                      <option value="custom">📅 Tùy chọn ngày...</option>
                  </select>
              </div>

              {/* Ô chọn ngày (Chỉ hiện khi chọn Custom) */}
              {dateFilterType === 'custom' && (
                  <div className="fade-in" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <input 
                          type="date" 
                          value={customRange.start}
                          onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                          style={{
                              padding: '7px 10px', borderRadius: '6px',
                              background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)', fontSize: '12px',
                              colorScheme: 'dark' 
                          }}
                      />
                      <span style={{color: 'var(--text-secondary)'}}>-</span>
                      <input 
                          type="date" 
                          value={customRange.end}
                          onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                          style={{
                              padding: '7px 10px', borderRadius: '6px',
                              background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)', fontSize: '12px',
                              colorScheme: 'dark'
                          }}
                      />
                  </div>
              )}
          </div>
      </div>
      
      {/* 3. KANBAN BOARD */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="recruitment-pipeline" style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px',
                alignItems: 'start', height: '100%', minWidth: '1000px', overflowX: 'auto'
            }}>
               {['Screening', 'Interview', 'Offer', 'Hired', 'Rejected'].map(status => (
                   <PipelineColumn 
                        key={status} status={status} 
                        list={getList(status)} 
                        onSelect={setSelectedCandidate}
                        onStatusChange={handleStatusChange} 
                   />
               ))}
            </div>
          </DragDropContext>
      </div>

      {/* MODAL */}
      {selectedCandidate && (
        <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} onUpdate={fetchCandidates} />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---
const PipelineColumn = ({ status, list, onSelect, onStatusChange }) => {
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
                <div ref={provided.innerRef} {...provided.droppableProps} className="pipeline-column" 
                    style={{
                        background: snapshot.isDraggingOver ? 'var(--bg-input)' : (isHiredColumn ? 'var(--bg-tertiary)' : 'var(--pipeline-bg)'),
                        padding: '10px', borderRadius: '12px', 
                        border: isHiredColumn ? `1px solid ${config.border}` : '1px solid var(--border-color)',
                        display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.2s',
                        boxShadow: isHiredColumn ? '0 0 15px var(--accent-glow)' : 'none'
                    }}
                >
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px 10px 5px', marginBottom: '10px', borderBottom: `2px solid ${isHiredColumn ? config.border : 'var(--border-color)'}`}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden'}}>
                            <i className={`fa-solid ${config.icon}`} style={{color: config.color, fontSize: '13px'}}></i>
                            <span style={{fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', color: isHiredColumn ? config.color : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{status}</span>
                        </div>
                        <span style={{background: isHiredColumn ? config.color : 'var(--bg-input)', color: isHiredColumn ? '#000' : 'var(--text-secondary)', borderRadius: '10px', padding: '1px 8px', fontSize: '10px', fontWeight: 'bold', border: `1px solid ${isHiredColumn ? 'transparent' : 'var(--border-color)'}`}}>{list.length}</span>
                    </div>
                    <div style={{flex: 1, overflowY: 'auto', paddingRight: '2px'}} className="custom-scrollbar">
                        {list.map((c, index) => (
                            <Draggable key={c.id.toString()} draggableId={c.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, marginBottom: '8px', transform: snapshot.isDragging ? provided.draggableProps.style.transform : 'none' }}>
                                        <CandidateCard data={c} onClick={() => onSelect(c)} onStatusChange={onStatusChange} />
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

// --- REDESIGNED KPI CARD (CLEAN & MINIMALIST) ---
const KpiCard = ({ title, value, icon, color, glow }) => (
    <div style={{
        background: 'var(--bg-tertiary)', padding: '20px 24px', borderRadius: '16px',
        border: `1px solid ${glow ? 'var(--accent-color)' : 'var(--border-color)'}`,
        boxShadow: glow ? '0 0 20px var(--accent-glow)' : 'var(--card-shadow)',
        position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease',
        minHeight: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
        {/* Glow Line Top */}
        {glow && <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--accent-color)', boxShadow: '0 0 10px var(--accent-color)'}}></div>}

        <div style={{position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
                <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 8px 0', letterSpacing: '0.5px', fontWeight: 600 }}>{title}</h3>
                <p style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>{value}</p>
            </div>
            
            {/* ICON CHÍNH (Đã xóa ô vuông) */}
            <div style={{ fontSize: '28px', color: color, opacity: 1, filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.1))' }}>
                <i className={`fa-solid ${icon}`}></i>
            </div>
        </div>

        {/* ICON BACKGROUND (Watermark trang trí) */}
        <div style={{ 
            position: 'absolute', right: '-20px', bottom: '-20px',
            fontSize: '90px', color: color, opacity: 0.08, 
            transform: 'rotate(-20deg)', pointerEvents: 'none', zIndex: 1
        }}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
    </div>
);

export default Dashboard; 