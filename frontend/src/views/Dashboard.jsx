/* FILE: frontend/src/views/Dashboard.jsx (Kanban + Show More) */
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

  // Load dữ liệu
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

  // Xử lý khi kéo thả xong
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Nếu thả ra ngoài hoặc thả lại chỗ cũ -> Không làm gì
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // 1. Cập nhật giao diện ngay lập tức (Optimistic Update)
    const newStatus = destination.droppableId; // ID cột là Status luôn
    const updatedCandidates = candidates.map(c => 
        c.id.toString() === draggableId ? { ...c, status: newStatus } : c
    );
    setCandidates(updatedCandidates);

    // 2. Gọi API cập nhật Backend
    try {
        await axios.put(`${API_BASE_URL}/api/candidates/${draggableId}/status`, { status: newStatus });
    } catch (error) {
        console.error("Lỗi cập nhật server:", error);
        alert("Có lỗi khi lưu trạng thái, vui lòng tải lại trang.");
        fetchCandidates(); // Revert lại nếu lỗi
    }
  };

  // Hàm helper lọc danh sách theo cột
  const getList = (status) => candidates.filter(c => 
    (c.status || '').toLowerCase() === status.toLowerCase()
  );

  return (
    <div className="hr-dashboard" style={{ color: 'var(--text-white)' }}>
      
      {/* KPI Section */}
      <section className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <KpiCard title="Tổng hồ sơ" value={candidates.length} icon="fa-users" color="var(--text-white)" />
        <KpiCard title="Screening" value={getList('Screening').length} icon="fa-filter" color="#A5B4FC" />
        <KpiCard title="Interview" value={getList('Interview').length} icon="fa-comments" color="#FCD34D" />
        <KpiCard title="Offer" value={getList('Offer').length} icon="fa-check-circle" color="var(--neon-green)" glow={true} />
      </section>

      <h2 className="section-title" style={{ color: 'var(--neon-green)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        <i className="fa-solid fa-layer-group" style={{marginRight:'10px'}}></i> Quy trình Tuyển dụng (Kanban)
      </h2>
      
      {/* KANBAN BOARD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="recruitment-pipeline" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', // Ép cứng 4 cột đều nhau
            gap: '20px',
            alignItems: 'start' // Căn thẳng hàng từ trên xuống
        }}>
           {['Screening', 'Interview', 'Offer', 'Rejected'].map(status => (
               <PipelineColumn 
                    key={status} 
                    status={status} 
                    list={getList(status)} 
                    onSelect={setSelectedCandidate} 
               />
           ))}
        </div>
      </DragDropContext>

      {/* MODAL */}
      {selectedCandidate && (
        <CandidateModal 
            candidate={selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
            onUpdate={fetchCandidates} // Truyền hàm refresh khi update trong modal
        />
      )}
    </div>
  );
};

// --- SUB-COMPONENT: CỘT KANBAN (CÓ SHOW MORE) ---
const PipelineColumn = ({ status, list, onSelect }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const LIMIT = 5; // Chỉ hiện 5 người đầu tiên
    
    const displayList = isExpanded ? list : list.slice(0, LIMIT);
    const hiddenCount = list.length - LIMIT;

    // Icon & Màu sắc tiêu đề
    const getHeaderStyle = (s) => {
        if(s === 'Screening') return { icon: 'fa-magnifying-glass', color: '#A5B4FC' };
        if(s === 'Interview') return { icon: 'fa-user-tie', color: '#FCD34D' };
        if(s === 'Offer') return { icon: 'fa-envelope-open-text', color: 'var(--neon-green)' };
        return { icon: 'fa-ban', color: '#FCA5A5' };
    };
    const style = getHeaderStyle(status);

    return (
        <Droppable droppableId={status}>
            {(provided, snapshot) => (
                <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="pipeline-column" 
                    style={{
                        background: snapshot.isDraggingOver ? 'rgba(46, 255, 123, 0.05)' : 'var(--pipeline-bg)',
                        padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)',
                        minHeight: '500px', display: 'flex', flexDirection: 'column',
                        transition: 'background 0.2s'
                    }}
                >
                    {/* Header Cột */}
                    <h3 style={{
                        color: 'var(--text-white)', fontSize: '14px', marginBottom: '15px', textTransform: 'uppercase', 
                        borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <i className={`fa-solid ${style.icon}`} style={{color: style.color}}></i>
                        {status} 
                        <span style={{background: '#1A2736', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', marginLeft: 'auto', border: '1px solid var(--border-color)'}}>
                            {list.length}
                        </span>
                    </h3>
                    
                    {/* Danh sách thẻ */}
                    <div style={{flex: 1}}>
                        {displayList.map((c, index) => (
                            <Draggable key={c.id.toString()} draggableId={c.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{ ...provided.draggableProps.style, marginBottom: '10px' }}
                                    >
                                        <CandidateCard data={c} onClick={() => onSelect(c)} />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>

                    {/* Nút Xem Thêm / Thu Gọn */}
                    {list.length > LIMIT && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            style={{
                                width: '100%', marginTop: '10px', padding: '8px',
                                background: 'transparent', border: '1px dashed var(--border-color)',
                                color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
                                borderRadius: '6px', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--neon-green)'; e.currentTarget.style.borderColor = 'var(--neon-green)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                        >
                            {isExpanded ? 'Thu gọn ▲' : `Xem thêm (+${hiddenCount}) ▼`}
                        </button>
                    )}
                </div>
            )}
        </Droppable>
    );
};

// Component KPI Card (Giữ nguyên cho đẹp)
const KpiCard = ({ title, value, icon, color, glow }) => (
    <div style={{
        background: 'var(--card-background)', padding: '20px', borderRadius: '12px',
        border: `1px solid ${glow ? 'var(--neon-green)' : 'var(--border-color)'}`,
        boxShadow: glow ? '0 0 15px rgba(46, 255, 123, 0.2)' : '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
        <div>
            <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 5px 0' }}>{title}</h3>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: color }}>{value}</p>
        </div>
        <div style={{ fontSize: '24px', color: color, opacity: 0.9, background: 'rgba(255,255,255,0.05)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
    </div>
);

export default Dashboard;