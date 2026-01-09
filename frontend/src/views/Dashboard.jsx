/* FILE: frontend/src/views/Dashboard.jsx (Fixed Connection & Headers) */
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';
import CandidateCard from '../components/CandidateCard';
import CandidateModal from '../components/CandidateModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Dashboard = () => {
  // --- STATE QUẢN LÝ VIEW ---
  const [viewMode, setViewMode] = useState('jobList'); // 'jobList' | 'pipeline'
  const [selectedJob, setSelectedJob] = useState(null); 
  
  // --- DATA STATE ---
  const [jobsStats, setJobsStats] = useState([]); 
  const [candidates, setCandidates] = useState([]); 
  const [selectedCandidate, setSelectedCandidate] = useState(null); 
  
  // --- BATCH UPLOAD STATE ---
  const [uploadingFiles, setUploadingFiles] = useState([]); 
  const [isBatchUploading, setIsBatchUploading] = useState(false);

  // --- FILTER STATE ---
  const [dateFilterType, setDateFilterType] = useState('all'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // --- HELPER: LẤY USER EMAIL TỪ LOCAL STORAGE ---
  const getUserEmail = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      try {
          const user = JSON.parse(userStr);
          // Hỗ trợ cả trường hợp lưu object user hoặc lưu thẳng email
          return user.email || user.user?.email || null;
      } catch (e) {
          return null;
      }
  };

  // 1. FETCH DANH SÁCH JOB & THỐNG KÊ (MÀN HÌNH CHÍNH)
  const fetchDashboardStats = () => {
    const email = getUserEmail();
    if (!email) {
        console.warn("Chưa đăng nhập, không thể lấy dữ liệu Dashboard.");
        return;
    }

    axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
        headers: { 'x-user-email': email } // Gửi Email để Backend lọc data
    })
      .then(res => setJobsStats(res.data))
      .catch(err => console.error("Lỗi lấy stats:", err));
  };

  // 2. FETCH ỨNG VIÊN CỦA 1 JOB (KHI CLICK VÀO JOB)
  const fetchCandidatesByJob = (jobId) => {
    const email = getUserEmail();
    if (!email) return;

    // Reset list trước khi load để tránh hiện data cũ
    setCandidates([]);

    axios.get(`${API_BASE_URL}/api/candidates?job_id=${jobId}`, {
        headers: { 'x-user-email': email }
    })
      .then(res => setCandidates(res.data)) 
      .catch(err => console.error("Lỗi lấy ứng viên:", err));
  };

  // Chạy lần đầu khi vào trang
  useEffect(() => { 
      fetchDashboardStats(); 
      // Set interval để auto-refresh số liệu mỗi 30s (Real-time giả lập)
      const interval = setInterval(fetchDashboardStats, 30000);
      return () => clearInterval(interval);
  }, []);

  // --- XỬ LÝ BATCH UPLOAD (UPLOAD HÀNG LOẠT) ---
  const handleBatchUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      if (!selectedJob) {
          alert("Vui lòng chọn một Job trước khi upload CV!");
          return;
      }

      setIsBatchUploading(true);
      setUploadingFiles(files.map(f => ({ name: f.name, status: 'pending' })));

      const userEmail = getUserEmail();

      // Upload tuần tự
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          setUploadingFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item));

          const formData = new FormData();
          formData.append('cv_file', file);
          formData.append('job_id', selectedJob.id); // Gắn CV vào Job ID này

          try {
              await axios.post(`${API_BASE_URL}/api/cv/upload`, formData, {
                  headers: { 
                      'Content-Type': 'multipart/form-data',
                      'x-user-email': userEmail 
                  }
              });
              setUploadingFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success' } : item));
          } catch (error) {
              console.error(`Lỗi file ${file.name}:`, error);
              setUploadingFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
          }
      }

      setIsBatchUploading(false);
      fetchCandidatesByJob(selectedJob.id); // Refresh lại bảng Kanban
      fetchDashboardStats(); // Refresh lại số liệu thống kê ở màn ngoài
      setTimeout(() => setUploadingFiles([]), 5000); 
  };

  // --- LOGIC KANBAN ---
  const handleStatusChange = async (candidateId, newStatus) => {
      const email = getUserEmail();
      // Optimistic Update
      const updatedCandidates = candidates.map(c => c.id === candidateId ? { ...c, status: newStatus } : c);
      setCandidates(updatedCandidates);

      try { 
          await axios.put(
              `${API_BASE_URL}/api/candidates/${candidateId}/status`, 
              { status: newStatus }, 
              { headers: { 'x-user-email': email } }
          ); 
          // Cập nhật lại số liệu thống kê ngầm
          fetchDashboardStats();
      } catch (error) { 
          console.error("Lỗi update:", error); 
          fetchCandidatesByJob(selectedJob.id); // Revert nếu lỗi
      }
  };

  const onDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === result.source.droppableId && destination.index === result.source.index) return;
    
    handleStatusChange(parseInt(draggableId), destination.droppableId);
  };

  // --- LOGIC FILTER ---
  const filteredCandidates = useMemo(() => {
      if (candidates.length === 0) return [];
      return candidates.filter(c => {
          const createdDate = new Date(c.created_at || Date.now());
          createdDate.setHours(0, 0, 0, 0);
          const now = new Date();
          now.setHours(0, 0, 0, 0);

          if (dateFilterType !== 'custom') {
              const diffTime = Math.abs(now - createdDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (dateFilterType === 'all') return true;
              if (dateFilterType === 'today') return diffDays === 0;
              if (dateFilterType === 'week') return diffDays <= 7;
              if (dateFilterType === 'month') return diffDays <= 30;
          }
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

  // --- VIEW 1: JOB LIST ---
  const renderJobListView = () => (
      <div className="job-list-view fade-in">
          <div style={{marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h2 className="section-title" style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px' }}>Tổng quan Tuyển dụng</h2>
                <p style={{color: 'var(--text-secondary)', marginTop: '5px', fontSize: '14px'}}>Chọn một vị trí để xem phễu ứng viên chi tiết</p>
              </div>
              <button onClick={fetchDashboardStats} style={{background: 'var(--bg-input)', border:'1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display:'flex', alignItems:'center', gap:'8px'}}>
                  <i className="fa-solid fa-rotate-right"></i> Làm mới
              </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
              {jobsStats.map(job => (
                  <div key={job.id} 
                       onClick={() => { setSelectedJob(job); setViewMode('pipeline'); fetchCandidatesByJob(job.id); }}
                       className="job-card"
                       style={{
                           background: 'var(--bg-secondary)', padding: '25px', borderRadius: '16px',
                           border: '1px solid var(--border-color)', cursor: 'pointer',
                           transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                           boxShadow: 'var(--card-shadow)'
                       }}
                       onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                       onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  >
                      <div style={{position: 'absolute', top: '20px', right: '20px', background: 'var(--bg-input)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', border: '1px solid var(--border-color)'}}>
                          {job.total} hồ sơ
                      </div>
                      <h3 style={{margin: '0 0 10px 0', fontSize: '18px', color: 'var(--text-primary)', paddingRight: '60px'}}>{job.title}</h3>
                      <div style={{height: '3px', width: '40px', background: 'var(--accent-color)', marginBottom: '25px', borderRadius: '2px'}}></div>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                          <StatItem label="Mới / Sàng lọc" value={job.stats.Screening} color="#A5B4FC" />
                          <StatItem label="Phỏng vấn" value={job.stats.Interview} color="#FCD34D" />
                          <StatItem label="Offer" value={job.stats.Offer} color="#6EE7B7" />
                          <StatItem label="Đã tuyển" value={job.stats.Hired} color="var(--accent-color)" bold />
                      </div>
                  </div>
              ))}
              {jobsStats.length === 0 && (
                  <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: 'var(--text-secondary)'}}>
                      <i className="fa-solid fa-folder-open" style={{fontSize: '40px', marginBottom: '15px', opacity: 0.5}}></i>
                      <p>Chưa có dữ liệu. Vui lòng vào "AI Training" để Import JD trước.</p>
                  </div>
              )}
          </div>
      </div>
  );

  const StatItem = ({ label, value, color, bold }) => (
      <div style={{background: 'var(--bg-input)', padding: '10px 15px', borderRadius: '10px', border: '1px solid var(--border-color)'}}>
          <div style={{fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase'}}>{label}</div>
          <div style={{fontSize: '20px', fontWeight: bold ? '800' : '600', color: color}}>{value}</div>
      </div>
  );

  // --- VIEW 2: PIPELINE (KANBAN) ---
  const renderPipelineView = () => (
      <div className="pipeline-view fade-in" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                  <button onClick={() => { setViewMode('jobList'); setSelectedJob(null); fetchDashboardStats(); }} 
                      style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s'}}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                      <i className="fa-solid fa-arrow-left"></i> Quay lại
                  </button>
                  <div>
                      <h2 className="section-title" style={{ color: 'var(--accent-color)', margin: 0, textTransform: 'uppercase', fontSize: '20px' }}>{selectedJob?.title}</h2>
                      <span style={{color: 'var(--text-secondary)', fontSize: '13px'}}>Pipeline tuyển dụng chi tiết</span>
                  </div>
              </div>

              <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                  <label style={{
                      background: 'var(--accent-color)', color: '#000', padding: '12px 25px', borderRadius: '8px', 
                      fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                      boxShadow: '0 0 15px var(--accent-glow)', transition: 'transform 0.2s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                      <input type="file" multiple accept=".pdf" style={{display: 'none'}} onChange={handleBatchUpload} />
                      <i className="fa-solid fa-cloud-arrow-up"></i> Upload CV Hàng Loạt
                  </label>
              </div>
          </div>

          {/* Upload Progress */}
          {(isBatchUploading || uploadingFiles.length > 0) && (
              <div style={{marginBottom: '20px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'slideDown 0.3s ease-out'}}>
                  <h4 style={{margin: '0 0 15px 0', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between'}}>
                      <span><i className="fa-solid fa-list-check" style={{marginRight: '8px'}}></i> Trạng thái Upload</span>
                      <span>{uploadingFiles.filter(f => f.status === 'success').length}/{uploadingFiles.length} Hoàn thành</span>
                  </h4>
                  <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto'}}>
                      {uploadingFiles.map((f, idx) => (
                          <div key={idx} style={{
                              padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                              background: f.status === 'processing' ? 'rgba(252, 211, 77, 0.2)' : f.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : f.status === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-input)',
                              border: `1px solid ${f.status === 'processing' ? '#FCD34D' : f.status === 'success' ? '#10B981' : f.status === 'error' ? '#EF4444' : 'var(--border-color)'}`,
                              color: 'var(--text-primary)'
                          }}>
                              {f.status === 'processing' && <i className="fa-solid fa-spinner fa-spin" style={{color: '#FCD34D'}}></i>}
                              {f.status === 'success' && <i className="fa-solid fa-check" style={{color: '#10B981'}}></i>}
                              {f.status === 'error' && <i className="fa-solid fa-triangle-exclamation" style={{color: '#EF4444'}}></i>}
                              {f.name}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          <div style={{ flex: 1, overflow: 'hidden' }}>
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="recruitment-pipeline" style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px',
                    alignItems: 'start', height: '100%', minWidth: '1200px', overflowX: 'auto',
                    paddingBottom: '10px'
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
      </div>
  );

  return (
    <div className="hr-dashboard" style={{ color: 'var(--text-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {viewMode === 'jobList' ? renderJobListView() : renderPipelineView()}
      {selectedCandidate && (
        <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} onUpdate={() => fetchCandidatesByJob(selectedJob.id)} />
      )}
    </div>
  );
};

// --- PIPELINE COLUMN ---
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
                        padding: '12px', borderRadius: '12px', 
                        border: isHiredColumn ? `1px solid ${config.border}` : '1px solid var(--border-color)',
                        display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.2s',
                        boxShadow: isHiredColumn ? '0 0 15px var(--accent-glow)' : 'none'
                    }}
                >
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5px 10px 5px', marginBottom: '10px', borderBottom: `2px solid ${isHiredColumn ? config.border : 'var(--border-color)'}`}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden'}}>
                            <i className={`fa-solid ${config.icon}`} style={{color: config.color, fontSize: '13px'}}></i>
                            <span style={{fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', color: isHiredColumn ? config.color : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{status}</span>
                        </div>
                        <span style={{background: isHiredColumn ? config.color : 'var(--bg-input)', color: isHiredColumn ? '#000' : 'var(--text-secondary)', borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: 'bold', border: `1px solid ${isHiredColumn ? 'transparent' : 'var(--border-color)'}`}}>{list.length}</span>
                    </div>
                    <div style={{flex: 1, overflowY: 'auto', paddingRight: '2px'}} className="custom-scrollbar">
                        {list.map((c, index) => (
                            <Draggable key={c.id.toString()} draggableId={c.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} style={{ ...provided.draggableProps.style, marginBottom: '10px', transform: snapshot.isDragging ? provided.draggableProps.style.transform : 'none' }}>
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

export default Dashboard;