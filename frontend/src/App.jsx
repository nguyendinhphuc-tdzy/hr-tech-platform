/* FILE: frontend/src/App.jsx */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import AITraining from './views/AITraining';
import InternBook from './views/InternBook';
import Home from './views/Home'; // Import trang Home mới
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase Client (nên tách ra file riêng nếu có thể)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "LINK_SUPABASE";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "KEY_SUPABASE";
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra phiên đăng nhập
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Lắng nghe thay đổi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{background: '#09121D', height: '100vh'}}></div>;

  return (
    <Router>
      <Routes>
        {/* Route Công khai: Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Route Bảo mật: Dashboard & Các tính năng */}
        <Route path="/*" element={
          session ? (
            <div className="app-container" style={{ display: 'flex' }}>
              <Sidebar />
              <div className="main-content" style={{ flex: 1, padding: '20px', background: '#09121D', minHeight: '100vh' }}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/scan" element={<CVScanView />} />
                  <Route path="/training" element={<AITraining />} />
                  <Route path="/interns" element={<InternBook />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;