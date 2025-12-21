/* FILE: frontend/src/components/Sidebar.jsx */
import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'ai-scan', label: 'AI Scan CV', icon: 'fa-radar' },
    { id: 'intern-book', label: 'Sổ tay Thực tập', icon: 'fa-book-open-reader' },
    { id: 'ai-training', label: 'Huấn luyện AI', icon: 'fa-robot' },
  ];

  return (
    <div className="sidebar" style={{
        width: '260px',
        height: 'calc(100vh - 80px)', // Trừ đi chiều cao Header
        background: 'var(--sidebar-bg)', // #0D1825
        borderRight: '1px solid var(--border-color)',
        padding: '20px',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: '80px', left: 0
    }}>
      {/* User Profile Mini trong Sidebar */}
      <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', 
          padding: '15px', marginBottom: '30px', 
          background: '#131F2E', borderRadius: '12px', border: '1px solid var(--border-color)'
      }}>
          <div style={{
              width: '40px', height: '40px', borderRadius: '50%', background: 'var(--neon-green)', 
              color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
          }}>
              HR
          </div>
          <div>
              <h4 style={{margin: 0, color: 'var(--text-white)', fontSize: '14px'}}>Mai Anh</h4>
              <p style={{margin: 0, color: 'var(--text-secondary)', fontSize: '11px'}}>HR Manager</p>
          </div>
      </div>

      {/* MENU ITEMS */}
      <nav style={{display: 'flex', flexDirection: 'column', gap: '10px', flex: 1}}>
        {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)} // <--- QUAN TRỌNG: Gọi hàm chuyển trang
                    style={{
                        display: 'flex', alignItems: 'center', gap: '15px',
                        padding: '12px 20px',
                        background: isActive ? 'rgba(46, 255, 123, 0.1)' : 'transparent', // Nền xanh mờ khi Active
                        border: isActive ? '1px solid var(--neon-green)' : '1px solid transparent',
                        borderRadius: '8px',
                        color: isActive ? 'var(--neon-green)' : 'var(--text-secondary)',
                        fontSize: '14px', fontWeight: isActive ? '600' : '400',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                        if(!isActive) {
                            e.currentTarget.style.color = 'var(--text-white)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if(!isActive) {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.background = 'transparent';
                        }
                    }}
                >
                    <i className={`fa-solid ${item.icon}`} style={{width: '20px', textAlign: 'center'}}></i>
                    {item.label}
                </button>
            );
        })}
      </nav>

      <div style={{marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center'}}>
          HR Tech Platform v2.0 <br/> Eco-Futuristic Edition
      </div>
    </div>
  );
};

export default Sidebar;