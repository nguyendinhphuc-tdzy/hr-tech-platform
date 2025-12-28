/* FILE: frontend/src/views/Dashboard.jsx (Eco-Futuristic + Quick Actions) */
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
    // setLoading(true); // Tắt loading khi refresh ngầm để tránh nháy trang
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

  useEffect(() => { 
      setLoading(true); // Chỉ hiện loading lần đầu
      fetchCandidates(); 
  }, []);

  // --- HÀM XỬ LÝ CHUYỂN TRẠNG THÁI (DÙNG CHUNG) ---
  const updateCandidateStatus = async (id, newStatus) => {
      // 1. Optimistic Update (Cập nhật giao diện ngay lập tức)
      const updatedCandidates = candidates.map(c => 
          c.id.toString() === id.toString() ? { ...c, status: newStatus } : c
      );
      setCandidates(updatedCandidates);

      // 2. Gọi API cập nhật Backend
      try {
          await axios.put(`${API_BASE_URL}/api/candidates/${id}/status`, { status: newStatus });
      } catch (error) {
          console.error("Lỗi cập nhật server:", error);
          alert("Có lỗi khi lưu trạng thái, vui lòng tải lại trang.");
          fetchCandidates(); // Revert lại dữ liệu cũ nếu lỗi
      }
  };

  const onDragEnd = (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    if (result.source.droppableId === destination.droppableId && result.source.index === destination.index) return;

    // Gọi hàm xử lý chung
    updateCandidateStatus(draggableId, destination.droppableId);
  };

  const getList = (status) => candidates.filter(c => 
    (c.status || '').toLowerCase() === status.toLowerCase()
  );

  return (
    <div className="hr-dashboard" style={{ color: 'var(--text-white)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. KPI SECTION */}
      <section className="kpi-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '20px',
          flexShrink: 0 
      }}>
        <KpiCard title="Tổng hồ sơ" value={candidates.length} icon="fa-users" color="var(--text-white)" />
        <KpiCard title="Phỏng vấn" value={getList('Interview').length} icon="fa-comments" color="#FCD34D" />
        <KpiCard title="Offer" value={getList('Offer').length} icon="fa-envelope-open-text" color="#6EE7B7" />
        <KpiCard title="Hired" value={getList('Hired').length} icon="fa-handshake" color="var(--neon-green)" glow={true} />
      </section>

      {/* 2. PIPELINE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', flexShrink: 0 }}>
          <h2 className="section-title" style={{ color: 'var(--neon-green)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '18px' }}>
            <i className="fa-solid fa-layer-group" style={{marginRight:'10px'}}></i> Quy trình Tuyển dụng
          </h2>
          <div style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
              <i className="fa-solid fa-arrows-left-right" style={{marginRight: '5px'}}></i> Kéo thả hoặc chọn menu để chuyển
          </div>
      </div>
      
      {/* 3. KANBAN BOARD */}
      <div style={{ flex: 1, overflowX: 'auto', paddingBottom: '10px' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="recruitment-pipeline" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(5, 300px)', // Giữ độ rộng 300px để thẻ thoáng
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
                        onStatusChange={updateCandidateStatus} // Truyền hàm xuống dưới
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

// --- SUB-COMPONENT: PIPELINE COLUMN ---
const PipelineColumn = ({ status, list, onSelect, onStatusChange }) => {
    // Config màu sắc & Icon cho từng cột
    const config = {
        'Screening': { icon: 'fa-magnifying-glass', color: '#A5B4FC', border: '#A5B4FC' },
        'Interview': { icon: 'fa-user-tie', color: '#FCD34D', border: '#FCD34D' },
        'Offer':     { icon: 'fa-envelope-open-text', color: '#6EE7B7', border: '#6EE7B7' },
        'Hired':     { icon: 'fa-handshake', color: 'var(--neon-green)', border: 'var(--neon-green)', bgGlow: 'rgba(46, 255, 123, 0.03)' },
        'Rejected':  { icon: 'fa-ban', color: '#FCA5A5', border: '#FCA5A5' }
    }[status] || { icon: 'fa-circle', color: '#fff', border: '#fff' };

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
                            ? 'rgba(255,255,255,0.03)' 
                            : (isHiredColumn ? config.bgGlow : '#0D1825'), 
                        padding: '12px', 
                        borderRadius: '16px', 
                        border: isHiredColumn ? `1px solid ${config.border}` : '1px solid #2D3B4E', 
                        display: 'flex', flexDirection: 'column',
                        height: '100%', 
                        minHeight: '600px',
                        transition: 'all 0.2s',
                        boxShadow: isHiredColumn ? '0 0 20px rgba(46, 255, 123, 0.05)' : 'none'
                    }}
                >
                    {/* Header Cột */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 5px', marginBottom: '15px',
                        borderBottom: `2px solid ${isHiredColumn ? config.border : '#1F2937'}`
                    }}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <i className={`fa-solid ${config.icon}`} style={{color: config.color}}></i>
                            <span style={{fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', color: isHiredColumn ? config.color : '#E5E7EB'}}>
                                {status}
                            </span>
                        </div>
                        <span style={{
                            background: isHiredColumn ? config.color : '#1F2937',
                            color: isHiredColumn ? '#000' : '#9CA3AF',
                            borderRadius: '12px', padding: '2px 10px', fontSize: '11px', fontWeight: 'bold'
                        }}>
                            {list.length}
                        </span>
                    </div>
                    
                    {/* Danh sách thẻ */}
                    <div style={{flex: 1, overflowY: 'auto', paddingRight: '4px'}} className="custom-scrollbar">
                        {list.length === 0 && (
                            <div style={{textAlign: 'center', padding: '40px 0', opacity: 0.3, color: config.color}}>
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
                                        {/* TRUYỀN onStatusChange VÀO CARD ĐỂ KÍCH HOẠT MENU */}
                                        <CandidateCard 
                                            data={c} 
                                            onClick={() => onSelect(c)} 
                                            onStatusChange={onStatusChange} 
                                        />
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

// Component KPI Card
const KpiCard = ({ title, value, icon, color, glow }) => (
    <div style={{
        background: '#131F2E', padding: '20px', borderRadius: '16px',
        border: `1px solid ${glow ? 'var(--neon-green)' : '#2D3B4E'}`,
        boxShadow: glow ? '0 0 15px rgba(46, 255, 123, 0.15)' : '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden'
    }}>
        {glow && <div style={{position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--neon-green)'}}></div>}
        <div>
            <h3 style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>{title}</h3>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: color }}>{value}</p>
        </div>
        <div style={{ 
            fontSize: '20px', color: color, opacity: 0.9, 
            background: 'rgba(255,255,255,0.03)', width: '48px', height: '48px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
    </div>
);

export default Dashboard; 