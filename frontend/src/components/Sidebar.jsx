/* FILE: frontend/src/components/Sidebar.jsx */
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fa-layer-group' },
    { path: '/scan', label: 'AI Scan CV', icon: 'fa-radar' },
    { path: '/interns', label: 'Sổ tay Thực tập', icon: 'fa-users-viewfinder' },
    { path: '/training', label: 'Huấn luyện AI', icon: 'fa-brain' },
  ];

  return (
    <div className="sidebar" style={{
        width: '260px', 
        background: '#0D1825', 
        borderRight: '1px solid #2D3B4E',
        padding: '20px',
        display: 'flex', flexDirection: 'column',
        height: '100vh',
        flexShrink: 0
    }}>
      {/* LOGO */}
      <div style={{ marginBottom: '40px', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', background: '#2EFF7B', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>HR</div>
        <h2 style={{ fontSize: '18px', color: '#fff', margin: 0, letterSpacing: '1px' }}>HR TECH</h2>
      </div>

      {/* MENU - QUAN TRỌNG: Dùng Link to="..." */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{
                display: 'flex', alignItems: 'center', gap: '15px',
                padding: '12px 15px', borderRadius: '8px',
                textDecoration: 'none', transition: 'all 0.2s',
                // Màu nền thay đổi khi Active
                background: isActive ? 'rgba(46, 255, 123, 0.1)' : 'transparent',
                color: isActive ? '#2EFF7B' : '#9CA3AF',
                borderLeft: isActive ? '3px solid #2EFF7B' : '3px solid transparent',
                cursor: 'pointer', // Đảm bảo con trỏ chuột hiện hình bàn tay
                userSelect: 'none'
              }}
            >
              <i className={`fa-solid ${item.icon}`} style={{ width: '20px', textAlign: 'center' }}></i>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div style={{ marginTop: 'auto', padding: '15px', background: '#131F2E', borderRadius: '12px', border: '1px solid #2D3B4E' }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#6B7280' }}>PHIÊN BẢN</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#fff' }}>Online v1.0</p>
      </div>
    </div>
  );
};

export default Sidebar;