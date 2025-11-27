import { useState } from 'react';
import './index.css';

// Import Components
import Sidebar from './components/Sidebar';

// Import Views
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import InternBook from './views/InternBook';

function App() {
  // Quản lý tab đang hiển thị
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container">
      {/* Header dùng chung */}
      <header className="main-header">
        <div className="logo">
          <i className="fa-brands fa-react" style={{fontSize: '24px', color: '#4F46E5'}}></i>
          <h1>Talent Analytics Platform</h1>
        </div>
        <div>
            {/* Có thể thêm nút thông báo hoặc setting ở đây */}
        </div>
      </header>

      <div className="hr-layout">
        {/* Sidebar điều hướng */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Nội dung chính thay đổi theo Tab */}
        <main className="main-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'cv-scan' && <CVScanView />}
          {activeTab === 'intern-book' && <InternBook />}
          {activeTab === 'ai-training' && (
              <div style={{textAlign:'center', marginTop:'50px', color: '#6B7280'}}>
                  <h2>🚧 Tính năng Huấn luyện AI</h2>
                  <p>Đang được phát triển...</p>
              </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;