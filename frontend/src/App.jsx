/* FILE: frontend/src/App.jsx (Real Google Auth with Supabase) */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js'; // Import Supabase
import './index.css';
import API_BASE_URL from './components/config';

// Import các Views
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import AITraining from './views/AITraining';
import InternBook from './views/InternBook';
import Sidebar from './components/Sidebar';

// --- CẤU HÌNH SUPABASE FRONTEND ---
// Bạn nên thay thế bằng URL và KEY của bạn từ Supabase Dashboard
const supabaseUrl = 'https://yymkszsrnlfkcsnjgcly.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bWtzenNybmxma2NzbmpnY2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjU2OTEsImV4cCI6MjA3OTQwMTY5MX0.-o0GwJb2_ZRssCxrQu6wWpEGGL-LCckQiUTGx6nEWO8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// 1. MÀN HÌNH TRANG CHỦ (LANDING PAGE)
// ==========================================
const HomeView = ({ onNavigate }) => {
  return (
    <div style={{
        height: '100vh', 
        background: 'radial-gradient(circle at 50% 0%, #1a2c42 0%, #09121D 100%)',
        display: 'flex', flexDirection: 'column',
        color: 'var(--text-white)', overflow: 'hidden'
    }}>
        <nav style={{padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <i className="fa-solid fa-atom" style={{color: 'var(--neon-green)'}}></i>
                HR TECH
            </div>
            <div style={{display: 'flex', gap: '15px'}}>
                <button onClick={() => onNavigate('login')} style={{background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-white)', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}>Đăng nhập</button>
                <button onClick={() => onNavigate('signup')} style={{background: 'var(--neon-green)', border: 'none', color: '#000', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 0 15px rgba(46, 255, 123, 0.4)'}}>Đăng ký ngay</button>
            </div>
        </nav>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px'}}>
            <div style={{background: 'rgba(46, 255, 123, 0.1)', color: 'var(--neon-green)', padding: '5px 15px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', border: '1px solid var(--neon-green)'}}>
                ✨ Hệ thống Tuyển dụng tương lai 2.0
            </div>
            <h1 style={{fontSize: '56px', fontWeight: '800', margin: '0 0 20px 0', lineHeight: '1.2'}}>
                Tuyển dụng thông minh với <br/>
                <span style={{background: 'linear-gradient(90deg, var(--neon-green), #009E49)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Sức mạnh AI & Dữ liệu</span>
            </h1>
            <p style={{fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '40px', lineHeight: '1.6'}}>
                Tự động hóa quy trình sàng lọc CV, quản lý thực tập sinh và tối ưu hóa nhân sự.
            </p>
            <button onClick={() => onNavigate('signup')} style={{padding: '15px 40px', fontSize: '16px', fontWeight: '700', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--text-white)', color: '#000', boxShadow: '0 10px 30px rgba(255,255,255,0.1)'}}>
                Bắt đầu miễn phí
            </button>
        </div>
        <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.05)'}}>© 2024 HR Tech Platform. All rights reserved.</div>
    </div>
  );
};

// ==========================================
// 2. MÀN HÌNH XÁC THỰC (ĐÃ SỬA NÚT GOOGLE)
// ==========================================
const AuthView = ({ mode, onLoginSuccess, onBack }) => {
    const isLogin = mode === 'login';
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- XỬ LÝ ĐĂNG NHẬP GOOGLE THẬT ---
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin // Quay lại trang hiện tại sau khi login
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error("Lỗi Google Login:", err);
            setErrorMsg(err.message);
            setIsLoading(false);
        }
    };

    // --- XỬ LÝ ĐĂNG NHẬP THƯỜNG (EMAIL/PASS) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');

        try {
            if (isLogin) {
                const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                    email: formData.email,
                    password: formData.password
                });
                onLoginSuccess(res.data.user);
            } else {
                const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password
                });
                alert("Đăng ký thành công!");
                onLoginSuccess(res.data.user);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Lỗi kết nối Server!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{height: '100vh', background: 'var(--bg-deep-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
            <button onClick={onBack} style={{position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px'}}>
                <i className="fa-solid fa-arrow-left"></i> Quay lại trang chủ
            </button>

            <div className="card-dark" style={{width: '420px', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', background: '#131F2E', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}}>
                <div style={{textAlign: 'center', marginBottom: '30px'}}>
                    <h2 style={{fontSize: '28px', color: 'var(--text-white)', marginBottom: '10px'}}>{isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}</h2>
                </div>

                {errorMsg && (
                    <div style={{background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', border: '1px solid #EF4444', textAlign: 'center'}}>
                        <i className="fa-solid fa-circle-exclamation"></i> {errorMsg}
                    </div>
                )}

                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px'}}>
                    {/* NÚT GOOGLE ĐÃ GẮN HÀM XỬ LÝ MỚI */}
                    <button type="button" onClick={handleGoogleLogin} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px', borderRadius: '6px', background: '#FFFFFF', color: '#000', border: 'none', cursor: 'pointer', fontWeight: '600'}}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="20" />
                        {isLogin ? 'Đăng nhập với Google' : 'Đăng ký với Google'}
                    </button>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '12px'}}>
                        <div style={{flex: 1, height: '1px', background: 'var(--border-color)'}}></div>HOẶC<div style={{flex: 1, height: '1px', background: 'var(--border-color)'}}></div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    {!isLogin && (
                         <div>
                            <label style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px'}}>HỌ VÀ TÊN</label>
                            <input name="fullName" type="text" placeholder="Ví dụ: Nguyễn Văn A" required onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '6px', background: '#0D1825', border: '1px solid var(--border-color)', color: 'white'}} />
                        </div>
                    )}
                    <div>
                        <label style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px'}}>EMAIL</label>
                        <input name="email" type="email" placeholder="admin@hrtech.com" required onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '6px', background: '#0D1825', border: '1px solid var(--border-color)', color: 'white'}} />
                    </div>
                    <div>
                        <label style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px'}}>MẬT KHẨU</label>
                        <input name="password" type="password" placeholder="••••••" required onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '6px', background: '#0D1825', border: '1px solid var(--border-color)', color: 'white'}} />
                    </div>

                    <button type="submit" style={{marginTop: '10px', background: 'var(--neon-green)', color: '#000', fontWeight: '700', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', opacity: isLoading ? 0.7 : 1}} disabled={isLoading}>
                        {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Truy cập hệ thống' : 'Đăng ký miễn phí')}
                    </button>
                </form>

                <p style={{textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)'}}>
                    {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                    <span onClick={onBack} style={{color: 'var(--neon-green)', cursor: 'pointer', textDecoration: 'underline'}}>{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}</span>
                </p>
            </div>
        </div>
    );
};

// ==========================================
// 3. DASHBOARD LAYOUT
// ==========================================
const DashboardLayout = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const DashboardHeader = () => (
        <header className="main-header">
            <div className="logo">
                <i className="fa-solid fa-atom fa-spin" style={{color: 'var(--neon-green)', fontSize: '24px'}}></i>
                <h1>HR TECH <span style={{color: 'var(--neon-green)'}}>DASHBOARD</span></h1>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                <div style={{textAlign: 'right'}}>
                    <span style={{display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-white)'}}>
                        {user ? user.full_name : 'User'}
                    </span>
                    <span style={{fontSize: '11px', color: 'var(--neon-green)'}}>
                        {user ? user.role : 'Member'}
                    </span>
                </div>
                {/* Avatar hiển thị ảnh Google nếu có, hoặc chữ cái đầu */}
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" style={{width: '35px', height: '35px', borderRadius: '50%', border: '2px solid var(--neon-green)'}} />
                ) : (
                    <div style={{width: '35px', height: '35px', borderRadius: '50%', border: '2px solid var(--neon-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-white)', fontWeight: 'bold'}}>
                        {user && user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                )}
                
                <button onClick={onLogout} style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', padding: '8px 15px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'}}>
                    <i className="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            </div>
        </header>
    );

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
            <DashboardHeader />
            <div className="hr-layout" style={{display: 'flex', width: '100%', maxWidth: '1400px', margin: '0 auto'}}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="main-content" style={{flex: 1, padding: '30px', overflowY: 'auto', height: 'calc(100vh - 80px)'}}>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

// ==========================================
// APP CONTROLLER
// ==========================================
function App() {
    const [view, setView] = useState('home'); 
    const [currentUser, setCurrentUser] = useState(null);

    const navigateTo = (target) => setView(target);

    // Lắng nghe sự kiện login từ Google (Redirect về)
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // Nếu có session Google, tự động vào Dashboard
                const googleUser = {
                    full_name: session.user.user_metadata.full_name || session.user.email,
                    email: session.user.email,
                    role: "Google Account",
                    avatar_url: session.user.user_metadata.avatar_url
                };
                setCurrentUser(googleUser);
                setView('dashboard');
            }
        });
    }, []);

    const handleLoginSuccess = (userData) => {
        setCurrentUser(userData);
        setView('dashboard');
    };

    const handleLogout = async () => {
        if(window.confirm("Bạn muốn đăng xuất?")) {
            await supabase.auth.signOut(); // Đăng xuất khỏi Supabase
            setCurrentUser(null);
            setView('home'); // Về trang chủ
        }
    };

    if (view === 'dashboard') return <DashboardLayout user={currentUser} onLogout={handleLogout} />;
    if (view === 'login' || view === 'signup') return <AuthView mode={view} onLoginSuccess={handleLoginSuccess} onBack={() => navigateTo('home')} />;

    return <HomeView onNavigate={navigateTo} />;
}

export default App;