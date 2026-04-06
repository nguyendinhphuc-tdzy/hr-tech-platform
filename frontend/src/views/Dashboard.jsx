/* FILE: frontend/src/views/Dashboard.jsx (Enterprise Scale: Job-Centric & Batch Upload) */
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';
import CandidateCard from '../components/CandidateCard';
import CandidateModal from '../components/CandidateModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../supabaseClient'; 
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'T2', UV: 12, Hired: 2 },
  { name: 'T3', UV: 19, Hired: 3 },
  { name: 'T4', UV: 15, Hired: 1 },
  { name: 'T5', UV: 25, Hired: 5 },
  { name: 'T6', UV: 22, Hired: 4 },
  { name: 'T7', UV: 30, Hired: 6 },
  { name: 'CN', UV: 28, Hired: 2 },
];

const Dashboard = () => {
  // --- STATE QUẢN LÝ VIEW ---
  const [viewMode, setViewMode] = useState('jobList'); // 'jobList' hoặc 'pipeline'
  const [selectedJob, setSelectedJob] = useState(null); // Job đang chọn để xem Pipeline
  
  // --- DATA STATE ---
  const [jobsStats, setJobsStats] = useState([]); // Dữ liệu Job + Thống kê
  const [candidates, setCandidates] = useState([]); // Ứng viên của Job đang chọn
  const [selectedCandidate, setSelectedCandidate] = useState(null); // Modal chi tiết
  
  // --- BATCH UPLOAD STATE ---
  const [uploadingFiles, setUploadingFiles] = useState([]); // Danh sách file đang upload
  const [isBatchUploading, setIsBatchUploading] = useState(false);

  // --- FILTER STATE (Giữ nguyên logic cũ) ---
  const [dateFilterType, setDateFilterType] = useState('all'); 
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // 1. FETCH DANH SÁCH JOB & THỐNG KÊ (MÀN HÌNH CHÍNH)
  const fetchDashboardStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => setJobsStats(res.data))
      .catch(err => console.error("Lỗi lấy stats:", err));
  };

  // 2. FETCH ỨNG VIÊN CỦA 1 JOB (KHI CLICK VÀO JOB)
  const fetchCandidatesByJob = async (jobId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    axios.get(`${API_BASE_URL}/api/candidates?job_id=${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => setCandidates(res.data)) // Backend đã sort điểm cao nhất lên đầu
      .catch(err => console.error("Lỗi lấy ứng viên:", err));
  };

  useEffect(() => { fetchDashboardStats(); }, []);

  // --- XỬ LÝ BATCH UPLOAD (UPLOAD HÀNG LOẠT) ---
  const handleBatchUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      if (!selectedJob) {
          alert("Vui lòng chọn một Job trước khi upload CV!");
          return;
      }

      setIsBatchUploading(true);
      // Tạo danh sách trạng thái ảo để hiện UI
      setUploadingFiles(files.map(f => ({ name: f.name, status: 'pending' })));

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Xử lý tuần tự để tạo cảm giác "process từng cái" và tránh nghẽn mạng
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Update status: uploading
          setUploadingFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item));

          const formData = new FormData();
          formData.append('cv_file', file);
          formData.append('job_id', selectedJob.id); // Gắn chặt CV với Job ID

          try {
              await axios.post(`${API_BASE_URL}/api/cv/upload`, formData, {
                  headers: { 
                      'Content-Type': 'multipart/form-data',
                      'Authorization': `Bearer ${token}` 
                  }
              });
              // Update status: done
              setUploadingFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success' } : item));
          } catch (error) {
              console.error(`Lỗi file ${file.name}:`, error);
              setUploadingFiles(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
          }
      }

      setIsBatchUploading(false);
      fetchCandidatesByJob(selectedJob.id); // Refresh lại bảng sau khi xong hết
      // Tự động tắt bảng upload sau 5s
      setTimeout(() => setUploadingFiles([]), 5000); 
  };

  // --- VIEW 1: MÀN HÌNH CHÍNH (PREMIUM DASHBOARD) ---
  const renderJobListView = () => {
      // Calculate overall stats implicitly
      const totalJobs = jobsStats.length;
      const totalCandidates = jobsStats.reduce((acc, job) => acc + job.total, 0);
      const hiredCount = jobsStats.reduce((acc, job) => acc + (job.stats.Hired || 0), 0);

      return (
          <div className="job-list-view fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* --- TOP HEADER & ACTIONS --- */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h2 className="section-title" style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>Tình hình Tuyển dụng</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px' }}>Dữ liệu ứng viên và hiệu suất tuyển dụng toàn công ty.</p>
                  </div>
                  <button onClick={fetchDashboardStats} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-rotate-right"></i> Đồng bộ dữ liệu
                  </button>
              </div>

              {/* --- TOP METRICS WIDGETS --- */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  <MetricCard title="Tổng Ứng viên" value={totalCandidates} icon="fa-users" color="#6366F1" trend="+12% tuần này" />
                  <MetricCard title="Vị trí Đang mở" value={totalJobs} icon="fa-briefcase" color="#10B981" trend="+2 vị trí mới" />
                  <MetricCard title="Đã Tuyển thành công" value={hiredCount} icon="fa-handshake" color="#34D399" trend="+5% so với tháng trước" />
                  <MetricCard title="Tỉ lệ Chuyển đổi" value={totalCandidates ? Math.round((hiredCount/totalCandidates)*100) + '%' : '0%'} icon="fa-bolt" color="#F59E0B" trend="Tăng nhẹ" />
              </div>

              {/* --- BẢNG ĐIỀU KHIỂN & BIỂU ĐỒ --- */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px' }}>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: 'var(--text-secondary)' }}>LƯU LƯỢNG ỨNG VIÊN THEO TUẦN</h3>
                      <div style={{ width: '100%', height: '250px' }}>
                          <ResponsiveContainer>
                              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <defs>
                                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.4}/>
                                          <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                  <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                                  <Area type="monotone" dataKey="UV" stroke="var(--accent-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                          <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: '32px', color: 'var(--accent-color)' }}></i>
                      </div>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>AI Tuyển dụng</h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                          Hệ thống AI tự động đánh giá CV và gợi ý ứng viên tốt nhất cho từng vị trí.
                      </p>
                      <button style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '10px 20px', borderRadius: '8px', fontWeight: '600' }}>
                          Cấu hình Rule ngay
                      </button>
                  </div>
              </div>

              {/* --- RAW PIPELINE WIDGET --- */}
              <div>
                  <h3 className="section-title" style={{ margin: '10px 0 20px 0', fontSize: '20px' }}>Danh sách Vị trí Đang mở</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                      {jobsStats.map(job => (
                          <div key={job.id} 
                               onClick={() => { setSelectedJob(job); setViewMode('pipeline'); fetchCandidatesByJob(job.id); }}
                               className="job-card"
                               style={{ padding: '25px', cursor: 'pointer' }}
                          >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                  <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', maxWidth: '70%', lineHeight: 1.4 }}>{job.title}</h3>
                                  <span style={{ background: 'var(--accent-glow)', color: 'var(--accent-color)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                      {job.total} CV
                                  </span>
                              </div>
                              
                              {/* Progress bar mock */}
                              <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(100, Math.max(10, (job.stats.Hired / (job.total || 1)) * 100))}%`, height: '100%', background: 'var(--accent-color)' }}></div>
                              </div>

                              {/* Mini Stats Line */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                                  <StatItem label="Screening" value={job.stats.Screening} />
                                  <StatItem label="Interview" value={job.stats.Interview} />
                                  <StatItem label="Offer" value={job.stats.Offer} />
                                  <StatItem label="Hired" value={job.stats.Hired} highlight />
                              </div>
                          </div>
                      ))}
                      {jobsStats.length === 0 && (
                          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', borderRadius: '16px', background: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)' }}>
                              <i className="fa-solid fa-briefcase" style={{ fontSize: '40px', marginBottom: '15px', color: 'var(--text-secondary)' }}></i>
                              <p style={{ color: 'var(--text-secondary)' }}>Chưa có chiến dịch tuyển dụng nào. Hãy bắt đầu nhập JD.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  // Helper Components cho Layout Mới
  const MetricCard = ({ title, value, icon, color, trend }) => (
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}20`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className={`fa-solid ${icon}`}></i>
              </span>
              <span style={{ fontSize: '12px', background: 'var(--bg-input)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-secondary)' }}>{trend}</span>
          </div>
          <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 5px 0' }}>{title}</p>
              <h2 style={{ fontSize: '32px', margin: 0, fontWeight: '700' }}>{value}</h2>
          </div>
      </div>
  );

  const StatItem = ({ label, value, highlight }) => (
      <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px' }}>{label}</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: highlight ? 'var(--accent-color)' : 'var(--text-primary)' }}>{value}</div>
      </div>
  );

  // --- VIEW 2: PIPELINE DETAIL (KANBAN) ---
  const renderPipelineView = () => (
      <div className="pipeline-view fade-in" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
          {/* Header Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                  <button onClick={() => { setViewMode('jobList'); setSelectedJob(null); }} 
                      style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s'}}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                      <i className="fa-solid fa-arrow-left"></i> Quay lại
                  </button>
                  <div>
                      <h2 className="section-title" style={{ color: 'var(--accent-color)', margin: 0, textTransform: 'uppercase', fontSize: '20px' }}>
                          {selectedJob?.title}
                      </h2>
                      <span style={{color: 'var(--text-secondary)', fontSize: '13px'}}>Pipeline tuyển dụng chi tiết</span>
                  </div>
              </div>

              <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                  {/* BATCH UPLOAD BUTTON */}
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

          {/* UPLOAD PROGRESS BAR (Hiện ra khi đang upload) */}
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

          {/* KANBAN BOARD (Tái sử dụng logic cũ nhưng trong context mới) */}
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

  // --- LOGIC KANBAN (GIỮ NGUYÊN) ---
  const handleStatusChange = async (candidateId, newStatus) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if(!token) return;

      const updatedCandidates = candidates.map(c => c.id === candidateId ? { ...c, status: newStatus } : c);
      setCandidates(updatedCandidates);
      
      try { 
          await axios.put(`${API_BASE_URL}/api/candidates/${candidateId}/status`, { status: newStatus }, { headers: { 'Authorization': `Bearer ${token}` } }); 
      } catch (error) { 
          console.error("Lỗi update:", error); 
          fetchCandidatesByJob(selectedJob.id); // Revert
      }
  };

  const onDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    handleStatusChange(parseInt(draggableId), destination.droppableId);
  };

  // Logic lọc ngày (Áp dụng cho candidates của Job hiện tại)
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

  // --- RENDER MAIN ---
  return (
    <div className="hr-dashboard" style={{ color: 'var(--text-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {viewMode === 'jobList' ? renderJobListView() : renderPipelineView()}
      
      {selectedCandidate && (
        <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} onUpdate={() => fetchCandidatesByJob(selectedJob.id)} />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS (PIPELINE COLUMN & CARD - GIỮ NGUYÊN) ---
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

// (KpiCard trong code cũ đã được thay thế bằng Job Card và Stats mới ở trên, nên ta không cần component KpiCard cũ nữa)

export default Dashboard;