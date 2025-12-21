/* FILE: frontend/src/App.jsx */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import AITraining from './views/AITraining';
import InternBook from './views/InternBook';
import Home from './views/Home'; 
import { createClient } from '@supabase/supabase-js';

// --- CONFIG SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
export const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

// --- COMPONENT BẢO VỆ ROUTE (ProtectedLayout) ---
// Chỉ render nội dung bên trong nếu đã login. Nếu chưa, đá về Home.
const ProtectedLayout = ({ session }) => {
    if (!session) {
        return <Navigate to="/" replace />;
    }
    
    return (
        <div className="app-container" style={{ display: 'flex' }}>
            <Sidebar />
            <div className="main-content" style={{ flex: 1, padding: '20px', background: '#09121D', minHeight: '100vh', overflowY: 'auto' }}>
                <Outlet /> {/* Nơi hiển thị các trang con (Dashboard, Scan...) */}
            </div>
        </div>
    );
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
        setLoading(false);
        return;
    }

    // 1. Kiểm tra session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Lắng nghe sự kiện đăng nhập/đăng xuất
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Màn hình chờ khi đang check login (Tránh bị đá về Home oan uổng)
  if (loading) {
    return (
        <div style={{
            height: '100vh', background: '#09121D', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', color: '#2EFF7B'
        }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{fontSize: '40px'}}></i>
        </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ROUTE 1: TRANG CHỦ (Nếu đã login thì Home sẽ tự chuyển vào Dashboard) */}
        <Route path="/" element={<Home session={session} />} />

        {/* ROUTE 2: CÁC TRANG CẦN ĐĂNG NHẬP */}
        <Route element={<ProtectedLayout session={session} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<CVScanView />} />
            <Route path="/training" element={<AITraining />} />
            <Route path="/interns" element={<InternBook />} />
        </Route>

        {/* Bắt tất cả các link sai -> Đá về Dashboard (nếu login) hoặc Home */}
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;