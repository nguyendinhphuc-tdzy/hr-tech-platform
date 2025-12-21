/* FILE: frontend/src/App.jsx */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import AITraining from './views/AITraining';
import InternBook from './views/InternBook';
import Home from './views/Home'; 
import { supabase } from './supabaseClient'; // <--- IMPORT TỪ FILE MỚI

// --- HEADER COMPONENT ---
const Header = ({ session }) => (
    <div style={{
        padding: '15px 30px', background: '#131F2E', borderBottom: '1px solid #2D3B4E',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
        <h3 style={{margin: 0, color: '#fff'}}>HR TECH DASHBOARD</h3>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <div style={{textAlign: 'right'}}>
                <div style={{color: '#fff', fontSize: '14px', fontWeight: 'bold'}}>
                    {session?.user?.user_metadata?.full_name || session?.user?.email}
                </div>
                <div style={{color: '#2EFF7B', fontSize: '11px'}}>Admin</div>
            </div>
            <img 
                src={session?.user?.user_metadata?.avatar_url || "https://via.placeholder.com/40"} 
                alt="Avatar" 
                style={{width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #2EFF7B'}}
            />
            <button 
                onClick={() => supabase.auth.signOut()}
                style={{background: 'transparent', border: '1px solid #FF4D4D', color: '#FF4D4D', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}
            >
                Logout
            </button>
        </div>
    </div>
);

// --- PROTECTED LAYOUT ---
const ProtectedLayout = ({ session }) => {
    if (!session) return <Navigate to="/" replace />;
    
    return (
        <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#09121D' }}>
                <Header session={session} />
                <div className="main-content" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    <Outlet />
                </div>
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

    // Kiểm tra session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Lắng nghe auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
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