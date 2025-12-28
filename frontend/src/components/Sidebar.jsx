/* FILE: frontend/src/components/Sidebar.jsx */
import React from 'react';
import { useTheme } from '../context/ThemeContext'; // Import hook theme

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme(); // Lấy trạng thái theme và hàm đổi theme

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'ai-scan', label: 'AI Scan CV', icon: 'fa-radar' },
    { id: 'intern-book', label: 'Sổ tay Thực tập', icon: 'fa-book-open-reader' },
    { id: 'ai-training', label: 'Huấn luyện AI', icon: 'fa-robot' },
  ];

  return (
    <div className="sidebar" style={{
        width: '260px',
        height: 'calc(100vh - 80px)', 
        background: 'var(--bg-secondary)', // Dùng biến CSS thay màu cứng
        borderRight: '1px solid var(--border-color)',
        padding: '20px',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: '80px', left: 0,
        transition: 'background 0.3s, border 0.3s' // Hiệu ứng mượt khi đổi màu
    }}>

      {/* MENU ITEMS */}
      <nav style={{display: 'flex', flexDirection: 'column', gap: '10px', flex: 1}}>
        {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '15px',
                        padding: '12px 20px',
                        background: isActive ? 'var(--accent-glow)' : 'transparent', 
                        border: isActive ? '1px solid var(--accent-color)' : '1px solid transparent',
                        borderRadius: '8px',
                        color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                        fontSize: '14px', fontWeight: isActive ? '600' : '400',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                        if(!isActive) {
                            e.currentTarget.style.color = 'var(--text-primary)';
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

      {/* FOOTER & THEME TOGGLE */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* NÚT CHUYỂN GIAO DIỆN (THEME SWITCHER) */}
        <button 
            onClick={toggleTheme}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 15px', borderRadius: '8px',
                background: 'var(--bg-input)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', cursor: 'pointer',
                transition: 'all 0.3s'
            }}
        >
            <span style={{fontSize: '12px', display:'flex', alignItems:'center', gap:'8px', fontWeight: 500}}>
                {theme === 'dark' ? <i className="fa-solid fa-moon"></i> : <i className="fa-solid fa-sun" style={{color: '#F59E0B'}}></i>}
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
            
            {/* Toggle Switch UI */}
            <div style={{
                width: '30px', height: '16px', 
                background: theme === 'dark' ? '#4B5563' : '#10B981', 
                borderRadius: '10px', position:'relative', transition:'background 0.3s'
            }}>
                <div style={{
                    width:'12px', height:'12px', background:'#fff', borderRadius:'50%', 
                    position:'absolute', top:'2px', 
                    left: theme==='dark' ? '2px' : '16px', // Di chuyển nút tròn
                    transition:'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}></div>
            </div>
        </button>

        {/* VERSION INFO */}
        <div style={{ padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>HỆ THỐNG</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>Online v1.1</p>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;