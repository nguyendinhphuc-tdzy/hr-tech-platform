/* FILE: frontend/src/App.jsx */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js'; 
import './index.css';
import API_BASE_URL from './components/config';

// Import các Views
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import AITraining from './views/AITraining';
import InternBook from './views/InternBook';
import Sidebar from './components/Sidebar';

// --- CẤU HÌNH SUPABASE FRONTEND ---
const supabaseUrl = 'https://yymkszsrnlfkcsnjgcly.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bWtzenNybmxma2NzbmpnY2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjU2OTEsImV4cCI6MjA3OTQwMTY5MX0.-o0GwJb2_ZRssCxrQu6wWpEGGL-LCckQiUTGx6nEWO8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// [NEW] HÀM CẤU HÌNH AXIOS (QUAN TRỌNG)
// ==========================================
// Hàm này sẽ tự động gắn Email vào Header của mọi request gửi đi
// Giúp Backend nhận diện người dùng (User Isolation)
const setupAxiosUser = (user) => {
    if (user && user.email) {
        axios.defaults.headers.common['x-user-email'] = user.email;
        console.log("✅ Đã cấu hình Axios cho user:", user.email);
    } else {
        delete axios.defaults.headers.common['x-user-email'];
        console.log("🔒 Đã xóa cấu hình Axios user");
    }
};

// ==========================================
// 1. MÀN HÌNH TRANG CHỦ (ADAPTIVE THEME)
// ==========================================
const HomeView = ({ onNavigate }) => {
  return (
    <div style={{
        /* Dùng biến CSS để tự động đổi màu theo Theme */
        height: '100vh', 
        backgroundColor: 'var(--bg-primary)', 
        color: 'var(--text-primary)', 
        overflowX: 'hidden',
        position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 9999,
        transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
        {/* NAVBAR */}
        <nav style={{
            padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid var(--border-color)', 
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)'}}>
                <div style={{width: '40px', height: '40px', background: 'var(--accent-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000', fontSize: '14px'}}>HR</div>
                HR TECH <span style={{color: 'var(--accent-color)'}}>AI</span>
            </div>
            <div style={{display: 'flex', gap: '15px'}}>
                <button onClick={() => onNavigate('login')} style={{background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}>Đăng nhập</button>
                <button onClick={() => onNavigate('signup')} style={{background: 'var(--accent-color)', border: 'none', color: '#000', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 0 15px var(--accent-glow)'}}>Đăng ký ngay</button>
            </div>
        </nav>

        {/* HERO CONTENT */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px', position: 'relative', zIndex: 1, height: 'calc(100vh - 80px)'}}>
            <div style={{background: 'var(--accent-glow)', color: 'var(--accent-color)', padding: '6px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '25px', border: '1px solid var(--accent-color)'}}>
                ✨ Hệ thống Tuyển dụng tương lai 2.0
            </div>
            <h1 style={{fontSize: '64px', fontWeight: '800', margin: '0 0 20px 0', lineHeight: '1.1', color: 'var(--text-primary)'}}>
                Tuyển dụng thông minh với <br/>
                <span style={{color: 'var(--accent-color)'}}>Sức mạnh AI & Dữ liệu</span>
            </h1>
            <p style={{fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '40px', lineHeight: '1.6'}}>
                Tự động hóa quy trình sàng lọc CV, quản lý thực tập sinh và tối ưu hóa nhân sự. Giúp bạn tìm kiếm ứng viên tài năng nhanh hơn 10x.
            </p>
            <button onClick={() => onNavigate('signup')} style={{padding: '16px 45px', fontSize: '16px', fontWeight: '700', borderRadius: '50px', border: 'none', cursor: 'pointer', background: 'var(--text-primary)', color: 'var(--bg-primary)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}>
                Bắt đầu miễn phí
            </button>
        </div>

        {/* FOOTER */}
        <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)'}}>© 2024 HR Tech Platform. All rights reserved.</div>
    </div>
  );
};

// ==========================================
// 2. MÀN HÌNH XÁC THỰC (ADAPTIVE THEME)
// ==========================================
const AuthView = ({ mode, onLoginSuccess, onBack }) => {
    const isLogin = mode === 'login';
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (err) {
            console.error("Lỗi Google Login:", err);
            setErrorMsg(err.message);
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg('');
        try {
            if (isLogin) {
                const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email: formData.email, password: formData.password });
                onLoginSuccess(res.data.user);
            } else {
                const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, { fullName: formData.fullName, email: formData.email, password: formData.password });
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
        <div style={{
            height: '100vh', 
            backgroundColor: 'var(--bg-primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            color: 'var(--text-primary)',
            transition: 'background-color 0.3s ease'
        }}>
            <button onClick={onBack} style={{position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px'}}>
                <i className="fa-solid fa-arrow-left"></i> Quay lại trang chủ
            </button>

            <div style={{width: '420px', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow)'}}>
                <div style={{textAlign: 'center', marginBottom: '30px'}}>
                    <h2 style={{fontSize: '28px', color: 'var(--text-primary)', marginBottom: '10px'}}>{isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}</h2>
                </div>

                {errorMsg && (
                    <div style={{background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px', border: '1px solid var(--danger-color)', textAlign: 'center'}}>
                        <i className="fa-solid fa-circle-exclamation"></i> {errorMsg}
                    </div>
                )}

                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px'}}>
                    <button type="button" onClick={handleGoogleLogin} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px', borderRadius: '6px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: '600'}}>
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
                            <input name="fullName" type="text" placeholder="Ví dụ: Nguyễn Văn A" required onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none'}} />
                        </div>
                    )}
                    <div>
                        <label style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px'}}>EMAIL</label>
                        <input name="email" type="email" placeholder="admin@hrtech.com" required onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none'}} />
                    </div>
                    <div>
                        <label style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px'}}>MẬT KHẨU</label>
                        <input name="password" type="password" placeholder="••••••" required onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none'}} />
                    </div>

                    <button type="submit" style={{marginTop: '10px', background: 'var(--accent-color)', color: '#000', fontWeight: '700', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textTransform: 'uppercase', opacity: isLoading ? 0.7 : 1}} disabled={isLoading}>
                        {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLogin ? 'Truy cập hệ thống' : 'Đăng ký miễn phí')}
                    </button>
                </form>

                <p style={{textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)'}}>
                    {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                    <span onClick={onBack} style={{color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline'}}>{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}</span>
                </p>
            </div>
        </div>
    );
};

// ==========================================
// 3. DASHBOARD LAYOUT (ADAPTIVE THEME)
// ==========================================
const DashboardLayout = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Header hiển thị user info và màu theo Theme
    const DashboardHeader = () => (
        <header className="main-header" style={{
            background: 'var(--bg-secondary)', 
            borderBottom: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
        }}>
            <div className="logo">
                <i className="fa-solid fa-atom fa-spin" style={{color: 'var(--accent-color)', fontSize: '24px'}}></i>
                <h1 style={{color: 'var(--text-primary)'}}>HR TECH <span style={{color: 'var(--accent-color)'}}>DASHBOARD</span></h1>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                <div style={{textAlign: 'right'}}>
                    <span style={{display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)'}}>
                        {user ? user.full_name : 'User'}
                    </span>
                    <span style={{fontSize: '11px', color: 'var(--accent-color)'}}>
                        {user ? user.role : 'Member'}
                    </span>
                </div>
                
                {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avt" style={{width: '35px', height: '35px', borderRadius: '50%', border: '2px solid var(--accent-color)'}} />
                ) : (
                    <div style={{width: '35px', height: '35px', borderRadius: '50%', border: '2px solid var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontWeight: 'bold', background: 'var(--bg-input)'}}>
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
        <div className="app-container" style={{background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)'}}>
            <DashboardHeader />
            <div className="hr-layout" style={{display: 'flex', width: '100%', maxWidth: '1400px', margin: '0 auto'}}>
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="main-content" style={{flex: 1, padding: '30px', overflowY: 'auto', height: 'calc(100vh - 80px)'}}>{renderContent()}</main>
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

    // Lắng nghe sự kiện login từ Google
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const googleUser = {
                    full_name: session.user.user_metadata.full_name || session.user.email,
                    email: session.user.email,
                    role: "Google Account",
                    avatar_url: session.user.user_metadata.avatar_url
                };
                setCurrentUser(googleUser);
                
                // [CONFIG AXIOS] Gắn header khi session tồn tại
                setupAxiosUser(googleUser);
                
                setView('dashboard');
            }
        });
    }, []);

    const handleLoginSuccess = (userData) => {
        setCurrentUser(userData);
        
        // [CONFIG AXIOS] Gắn header khi login thường
        setupAxiosUser(userData);
        
        setView('dashboard');
    };

    const handleLogout = async () => {
        if(window.confirm("Bạn muốn đăng xuất?")) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            
            // [CLEAR AXIOS] Xóa header khi logout
            setupAxiosUser(null);
            
            setView('home'); 
        }
    };

    if (view === 'dashboard') return <DashboardLayout user={currentUser} onLogout={handleLogout} />;
    if (view === 'login' || view === 'signup') return <AuthView mode={view} onLoginSuccess={handleLoginSuccess} onBack={() => navigateTo('home')} />;

    return <HomeView onNavigate={navigateTo} />;
}

export default App;