/* FILE: frontend/src/views/InternBook.jsx (Intern Management Dashboard) */
import { useState } from 'react';

const InternBook = () => {
  // MOCK DATA: Danh sách thực tập sinh đang làm việc
  // (Sau này bạn có thể lấy từ DB những candidate có status = 'Offer' -> chuyển sang đây)
  const [interns] = useState([
    { 
      id: 1, 
      name: 'Nguyễn Văn A', 
      role: 'Data Analyst Intern', 
      department: 'Product Team', 
      mentor: 'Trần Văn B (Senior DA)',
      startDate: '2023-10-01',
      endDate: '2024-01-01',
      progress: 75, // % Hoàn thành kỳ thực tập
      status: 'Active',
      avatar: 'A'
    },
    { 
      id: 2, 
      name: 'Lê Thị C', 
      role: 'Marketing Intern', 
      department: 'Marketing Dept', 
      mentor: 'Phạm Thị D (CMO)',
      startDate: '2023-11-15',
      endDate: '2024-02-15',
      progress: 30, 
      status: 'Onboarding',
      avatar: 'L'
    },
    { 
      id: 3, 
      name: 'Hoàng Minh E', 
      role: 'React Frontend Intern', 
      department: 'Tech Hub', 
      mentor: 'Nguyễn Code Dạo (Tech Lead)',
      startDate: '2023-09-01',
      endDate: '2023-12-31',
      progress: 95, 
      status: 'Graduating',
      avatar: 'H'
    },
    { 
      id: 4, 
      name: 'Phạm Tuấn F', 
      role: 'HR Assistant Intern', 
      department: 'Human Resources', 
      mentor: 'HR Manager',
      startDate: '2023-12-01',
      endDate: '2024-03-01',
      progress: 10, 
      status: 'Active',
      avatar: 'P'
    },
  ]);

  const [filter, setFilter] = useState('All');

  // Hàm chọn màu cho Badge Trạng thái
  const getStatusStyle = (status) => {
      if (status === 'Active') return { color: 'var(--neon-green)', bg: 'rgba(46, 255, 123, 0.1)', border: 'var(--neon-green)' };
      if (status === 'Onboarding') return { color: '#FCD34D', bg: 'rgba(252, 211, 77, 0.1)', border: '#FCD34D' };
      if (status === 'Graduating') return { color: '#A5B4FC', bg: 'rgba(165, 180, 252, 0.1)', border: '#A5B4FC' };
      return { color: 'var(--text-gray)', bg: '#1A2736', border: 'var(--border-color)' };
  };

  return (
    <div className="intern-book-view" style={{ color: 'var(--text-white)', minHeight: 'calc(100vh - 100px)' }}>
      
      {/* HEADER SECTION */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
            <h2 className="section-title" style={{ 
                color: 'var(--neon-green)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px',
                textShadow: '0 0 10px rgba(46, 255, 123, 0.4)'
            }}>
                <i className="fa-solid fa-users-viewfinder" style={{marginRight: '10px'}}></i>
                Quản lý Thực Tập Sinh
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                Theo dõi tiến độ, phân công mentor và đánh giá hiệu suất (Intern Tracking).
            </p>
        </div>
        
        {/* Filter Controls */}
        <div className="card-dark" style={{ padding: '5px 10px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>Lọc theo:</span>
            {['All', 'Active', 'Onboarding', 'Graduating'].map(f => (
                <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                        background: filter === f ? 'var(--neon-green)' : 'transparent',
                        color: filter === f ? '#000' : 'var(--text-white)',
                        border: 'none', padding: '5px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                    }}
                >
                    {f}
                </button>
            ))}
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          {[
              { label: 'Tổng số Intern', val: interns.length, icon: 'fa-users', color: 'var(--text-white)' },
              { label: 'Đang hoạt động', val: interns.filter(i => i.status === 'Active').length, icon: 'fa-bolt', color: 'var(--neon-green)' },
              { label: 'Mới tiếp nhận', val: interns.filter(i => i.status === 'Onboarding').length, icon: 'fa-seedling', color: '#FCD34D' },
              { label: 'Sắp tốt nghiệp', val: interns.filter(i => i.status === 'Graduating').length, icon: 'fa-graduation-cap', color: '#A5B4FC' },
          ].map((stat, idx) => (
              <div key={idx} className="card-dark" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '5px' }}>{stat.label}</p>
                      <h3 style={{ fontSize: '24px', margin: 0, color: stat.color }}>{stat.val}</h3>
                  </div>
                  <div style={{ 
                      width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, fontSize: '18px'
                  }}>
                      <i className={`fa-solid ${stat.icon}`}></i>
                  </div>
              </div>
          ))}
      </div>

      {/* INTERN LIST GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {interns.filter(i => filter === 'All' || i.status === filter).map(intern => {
            const statusStyle = getStatusStyle(intern.status);
            return (
                <div key={intern.id} className="card-dark" style={{ 
                    padding: '20px', borderRadius: '12px', position: 'relative', overflow: 'hidden',
                    border: '1px solid var(--border-color)', transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.borderColor = 'var(--neon-green)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
                >
                    {/* Header Card */}
                    <div style={{ display: 'flex', alignItems: 'start', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ 
                            width: '50px', height: '50px', borderRadius: '12px', 
                            background: 'linear-gradient(135deg, #1A2736, #09121D)', border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: '20px', fontWeight: '700', color: 'var(--neon-green)'
                        }}>
                            {intern.avatar}
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: 'var(--text-white)' }}>{intern.name}</h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--neon-green)' }}>{intern.role}</p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <i className="fa-solid fa-building-user" style={{marginRight:'5px'}}></i> {intern.department}
                            </p>
                        </div>
                        <span style={{ 
                            marginLeft: 'auto', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase',
                            color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}`
                        }}>
                            {intern.status}
                        </span>
                    </div>

                    {/* Details */}
                    <div style={{ 
                        background: '#09121D', padding: '15px', borderRadius: '8px', marginBottom: '20px',
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' 
                    }}>
                        <div>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Mentor hướng dẫn</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-white)', fontWeight: '500' }}>{intern.mentor}</p>
                        </div>
                        <div style={{textAlign: 'right'}}>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '3px' }}>Thời hạn</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-white)', fontWeight: '500' }}>
                                {new Date(intern.endDate).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                            <span style={{color: 'var(--text-secondary)'}}>Tiến độ thực tập</span>
                            <span style={{color: 'var(--neon-green)', fontWeight: '700'}}>{intern.progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#1A2736', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${intern.progress}%`, height: '100%', 
                                background: 'linear-gradient(90deg, var(--neon-green), #009E49)',
                                boxShadow: '0 0 10px var(--neon-green)'
                            }}></div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed var(--border-color)', display: 'flex', gap: '10px' }}>
                        <button style={{ 
                            flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-white)', 
                            padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' 
                        }}>
                            Xem chi tiết
                        </button>
                        <button style={{ 
                            flex: 1, background: 'rgba(46, 255, 123, 0.1)', border: 'none', color: 'var(--neon-green)', 
                            padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
                        }}>
                            Đánh giá
                        </button>
                    </div>

                </div>
            );
        })}
      </div>
    </div>
  );
};

export default InternBook;