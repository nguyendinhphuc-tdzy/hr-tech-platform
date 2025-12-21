/* FILE: frontend/src/App.jsx (Fixed Supabase Init) */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import AITraining from './views/AITraining';
import InternBook from './views/InternBook';
import Home from './views/Home'; 
import { createClient } from '@supabase/supabase-js';

// --- KHỞI TẠO SUPABASE (FIX LỖI CẤU HÌNH) ---
// Quan trọng: Kiểm tra kỹ xem biến có tồn tại không trước khi tạo client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

console.log("Supabase URL:", supabaseUrl ? "Đã tìm thấy" : "Không tìm thấy");
console.log("Supabase Key:", supabaseKey ? "Đã tìm thấy" : "Không tìm thấy");

export const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

const ProtectedLayout = ({ session }) => {
    if (!session) {
        return <Navigate to="/" replace />;
    }
    
    return (
        <div className="app-container" style={{ display: 'flex' }}>
            <Sidebar />
            <div className="main-content" style={{ flex: 1, padding: '20px', background: '#09121D', minHeight: '100vh', overflowY: 'auto' }}>
                <Outlet />
            </div>
        </div>
    );
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Nếu không có supabase client -> Dừng loading ngay để hiện trang Home (sẽ báo lỗi ở Home sau)
    if (!supabase) {
        console.error("Lỗi: Supabase Client chưa được khởi tạo do thiếu biến môi trường.");
        setLoading(false);
        return;
    }

    // 1. Kiểm tra session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Lắng nghe auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
        <Route path="/" element={<Home session={session} />} />
        
        <Route element={<ProtectedLayout session={session} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<CVScanView />} />
            <Route path="/training" element={<AITraining />} />
            <Route path="/interns" element={<InternBook />} />
        </Route>

        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;