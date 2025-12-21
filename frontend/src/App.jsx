/* FILE: frontend/src/App.jsx (Full Auth Flow: Login <-> Dashboard) */
import { useState, useEffect } from 'react';
import './index.css';

// Import các Views
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import AITraining from './views/AITraining';
import InternBook from './views/InternBook';

// Import Sidebar
import Sidebar from './components/Sidebar';

// --- COMPONENT: LOGIN PAGE (MÀN HÌNH ĐĂNG NHẬP) ---
const LoginPage = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);

    const handleLoginClick = (e) => {
        e.preventDefault();
        setLoading(true);
        // Giả lập gọi API login mất 1s
        setTimeout(() => {
            setLoading(false);
            onLogin(); // Gọi hàm đăng nhập thành công
        }, 1000);
    };

    return (
        <div style={{
            height: '100vh', 
            background: 'radial-gradient(circle at 50% 0%, #1a2c42 0%, #09121D 80%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-white)'
        }}>
            <div className="card-dark" style={{
                width: '400px', padding: '40px', borderRadius: '16px',
                border: '1px solid var(--neon-green)',
                boxShadow: '0 0 50px rgba(46, 255, 123, 0.15)',
                textAlign: 'center'
            }}>
                <div style={{marginBottom: '30px'}}>
                    <i className="fa-solid fa-atom fa-spin" style={{color: 'var(--neon-green)', fontSize: '50px', marginBottom: '20px'}}></i>
                    <h1 style={{fontSize: '24px', margin: 0}}>HR TECH <span style={{color: 'var(--neon-green)'}}>PLATFORM</span></h1>
                    <p style={{color: 'var(--text-secondary)', fontSize: '14px', marginTop: '10px'}}>Eco-Futuristic Recruitment System</p>
                </div>

                <form onSubmit={handleLoginClick} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    <div style={{textAlign: 'left'}}>
                        <label style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px'}}>EMAIL ACCESS</label>
                        <input type="email" defaultValue="admin@hrtech.com" style={{width: '100%', padding: '12px', borderRadius: '6px', background: '#0D1825', border: '1px solid var(--border-color)', color: 'white'}} />
                    </div>
                    <div style={{textAlign: 'left'}}>
                        <label style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px'}}>PASSCODE</label>
                        <input type="password" defaultValue="123456" style={{width: '100%', padding: '12px', borderRadius: '6px', background: '#0D1825', border: '1px solid var(--border-color)', color: 'white'}} />
                    </div>
                    
                    <button type="submit" style={{
                        marginTop: '10px',
                        background: 'var(--neon-green)', color: '#000', fontWeight: '700',
                        padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        textTransform: 'uppercase', letterSpacing: '1px',
                        boxShadow: '0 0 20px rgba(46, 255, 123, 0.4)',
                        opacity: loading ? 0.7 : 1, transition: 'all 0.3s'
                    }} disabled={loading}>
                        {loading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Đang xác thực...</> : 'Truy cập hệ thống'}
                    </button>
                </form>

                <div style={{marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)'}}>
                    <i className="fa-solid fa-lock"></i> Secured by AI Security Layer
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: HEADER (Đã thêm nút Logout có sự kiện) ---
const MainHeader = ({ onLogout }) => (
    <header className="main-header">
        <div className="logo">
            <i className="fa-solid fa-atom" style={{color: 'var(--neon-green)', fontSize: '24px'}}></i>
            <h1>HR TECH <span style={{color: 'var(--neon-green)'}}>DASHBOARD</span></h1>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <div style={{textAlign: 'right'}}>
                <span style={{display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-white)'}}>Tường Vy Trần</span>
                <span style={{fontSize: '11px', color: 'var(--neon-green)'}}>Admin Access</span>
            </div>
            <div style={{
                width: '35px', height: '35px', borderRadius: '50%', border: '2px solid var(--neon-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-white)'
            }}>T</div>
            
            {/* Nút Logout đã được gán sự kiện */}
            <button 
                onClick={onLogout}
                style={{
                    background: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid #EF4444', 
                    color: '#EF4444',
                    padding: '8px 15px', 
                    borderRadius: '6px', 
                    fontSize: '12px', 
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '5px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#EF4444';
                    e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#EF4444';
                }}
            >
                <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
        </div>
    </header>
);

// --- APP CHÍNH ---
function App() {
  // 1. Quản lý trạng thái đăng nhập
  // Kiểm tra localStorage để giữ đăng nhập khi F5 (Tùy chọn)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
      return localStorage.getItem('isLoggedIn') === 'true';
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // Hàm Đăng Nhập
  const handleLogin = () => {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
  };

  // Hàm Đăng Xuất
  const handleLogout = () => {
      const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?");
      if (confirmLogout) {
          setIsLoggedIn(false);
          localStorage.removeItem('isLoggedIn');
          setActiveTab('dashboard'); // Reset tab về mặc định
      }
  };

  // Router ảo
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'ai-scan': return <CVScanView />;
      case 'intern-book': return <InternBook />;
      case 'ai-training': return <AITraining />;
      default: return <Dashboard />;
    }
  };

  // Nếu chưa đăng nhập -> Hiển thị Login Page
  if (!isLoggedIn) {
      return <LoginPage onLogin={handleLogin} />;
  }

  // Nếu đã đăng nhập -> Hiển thị Giao diện chính
  return (
    <div className="app-container" style={{background: 'var(--bg-deep-black)', minHeight: '100vh'}}>
      {/* Header nhận hàm logout */}
      <MainHeader onLogout={handleLogout} />

      <div className="hr-layout" style={{display: 'flex', width: '100%', maxWidth: '1400px', margin: '0 auto'}}>
          
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="main-content" style={{flex: 1, padding: '30px', overflowY: 'auto', height: 'calc(100vh - 80px)'}}>
              {renderContent()}
          </main>
      
      </div>
    </div>
  );
}

export default App;