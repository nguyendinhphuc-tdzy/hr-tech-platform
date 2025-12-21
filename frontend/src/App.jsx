/* FILE: frontend/src/App.jsx */
import { useState } from 'react';
import './index.css'; // Đảm bảo đã import file CSS mới

// Import các Views
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import AITraining from './views/AITraining';
import InternBook from './views/InternBook';

// Component Header (Tách nhỏ ra cho gọn)
const MainHeader = () => (
    <header className="main-header">
        <div className="logo">
            <i className="fa-solid fa-atom fa-spin" style={{color: 'var(--neon-green)', fontSize: '24px'}}></i>
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
            <button style={{
                background: 'transparent', border: '1px solid #EF4444', color: '#EF4444',
                padding: '5px 15px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
            }}>Logout</button>
        </div>
    </header>
);

// Import Sidebar mới
import Sidebar from './components/Sidebar';

function App() {
  // State quản lý trang đang xem (Mặc định là dashboard)
  const [activeTab, setActiveTab] = useState('dashboard');

  // Hàm render nội dung chính dựa theo Tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'ai-scan': return <CVScanView />;
      case 'intern-book': return <InternBook />;
      case 'ai-training': return <AITraining />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container" style={{background: 'var(--bg-deep-black)', minHeight: '100vh'}}>
      {/* 1. Header Cố định */}
      <MainHeader />

      {/* 2. Layout Chính (Flexbox: Sidebar trái - Nội dung phải) */}
      <div className="hr-layout" style={{display: 'flex', width: '100%', maxWidth: '1400px', margin: '0 auto'}}>
          
          {/* Sidebar nhận props để điều khiển activeTab */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          {/* Khu vực nội dung thay đổi dynamic */}
          <main className="main-content" style={{flex: 1, padding: '30px', overflowY: 'auto', height: 'calc(100vh - 80px)'}}>
              {renderContent()}
          </main>
      
      </div>
    </div>
  );
}

export default App;