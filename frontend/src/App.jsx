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
import AccountSettings from './views/AccountSettings';

// --- CẤU HÌNH SUPABASE FRONTEND ---
const supabaseUrl = 'https://yymkszsrnlfkcsnjgcly.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bWtzenNybmxma2NzbmpnY2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjU2OTEsImV4cCI6MjA3OTQwMTY5MX0.-o0GwJb2_ZRssCxrQu6wWpEGGL-LCckQiUTGx6nEWO8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- HÀM CẤU HÌNH AXIOS ---
const setupAxiosUser = (user) => {
    if (user) {
        // Ưu tiên dùng email, nếu không có thì dùng số điện thoại làm định danh
        const identifier = user.email || user.phone_number;
        if (identifier) {
            axios.defaults.headers.common['x-user-email'] = identifier;
            console.log("✅ Đã cấu hình Axios cho user:", identifier);
        }
    } else {
        delete axios.defaults.headers.common['x-user-email'];
        console.log("🔒 Đã xóa cấu hình Axios user");
    }
};

// ==========================================
// 1. MÀN HÌNH TRANG CHỦ (HomeView)
// ==========================================
const HomeView = ({ onNavigate }) => {
  return (
    <div style={{
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
                {/* Nút Đăng nhập -> mode='login' */}
                <button onClick={() => onNavigate('login')} style={{background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}>Đăng nhập</button>
                {/* Nút Đăng ký -> mode='signup' */}
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
            
            {/* Nút Bắt đầu miễn phí -> mode='signup' */}
            <button onClick={() => onNavigate('signup')} style={{
                padding: '16px 45px', 
                fontSize: '16px', 
                fontWeight: '700', 
                borderRadius: '50px', 
                border: 'none', 
                cursor: 'pointer', 
                background: 'var(--accent-color)', 
                color: '#000',
                boxShadow: '0 10px 30px var(--accent-glow)',
                transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                Bắt đầu miễn phí
            </button>
        </div>

        {/* FOOTER */}
        <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)'}}>© 2024 HR Tech Platform. All rights reserved.</div>
    </div>
  );
};

// ==========================================
// 2. MÀN HÌNH XÁC THỰC (PHONE LOGIN/REGISTER)
// ==========================================
// [FIXED] Nhận thêm prop 'mode' để biết là đang Login hay Signup
const AuthView = ({ mode, onLoginSuccess, onBack }) => {
    // [FIXED] Khởi tạo isLoginMode dựa trên prop 'mode' được truyền vào
    // Nếu mode là 'login' -> true (Hiện form đăng nhập)
    // Nếu mode là 'signup' -> false (Hiện form đăng ký)
    const [isLoginMode, setIsLoginMode] = useState(mode === 'login'); 
    
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Form State
    const [phone, setPhone] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState(''); 

    // Hàm chuyển đổi qua lại giữa Login/Register
    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setErrorMsg('');
        // Clear password khi chuyển mode để an toàn
        setPassword('');
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
            setErrorMsg(err.message);
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); 
        setErrorMsg('');

        // Validate
        if (!phone || phone.length < 9) {
            setIsLoading(false);
            return setErrorMsg("Số điện thoại không hợp lệ");
        }
        if (!password || password.length < 6) {
            setIsLoading(false);
            return setErrorMsg("Mật khẩu phải từ 6 ký tự");
        }
        if (!isLoginMode && (!fullName || fullName.trim().length < 2)) {
            setIsLoading(false);
            return setErrorMsg("Vui lòng nhập họ tên");
        }

        try {
            // Chuẩn bị payload
            const payload = { 
                phone, 
                password,
                is_register: !isLoginMode, // true nếu đang ở màn hình Đăng ký
                full_name: !isLoginMode ? fullName : undefined
            };

            const res = await axios.post(`${API_BASE_URL}/api/auth/phone-login`, payload);
            
            // Thành công
            onLoginSuccess(res.data.user);
            
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Lỗi kết nối Server! Vui lòng thử lại.");
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
                <i className="fa-solid fa-arrow-left"></i> Trang chủ
            </button>

            <div className="card-common" style={{width: '400px', padding: '40px', borderRadius: '20px', textAlign: 'center'}}>
                
                <div style={{marginBottom: '25px'}}>
                    <h2 style={{fontSize: '26px', margin: '0 0 10px 0'}}>
                        {isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản'}
                    </h2>
                    <p style={{fontSize: '13px', color: 'var(--text-secondary)', margin: 0}}>
                        {isLoginMode ? 'Chào mừng bạn quay trở lại!' : 'Tham gia cùng chúng tôi ngay hôm nay'}
                    </p>
                </div>

                {errorMsg && (
                    <div style={{background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', border: '1px solid var(--danger-color)', textAlign: 'left'}}>
                        <i className="fa-solid fa-circle-exclamation" style={{marginRight: '8px'}}></i> {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    
                    {/* 1. SỐ ĐIỆN THOẠI (Luôn hiện) */}
                    <div style={{marginBottom: '15px', textAlign: 'left'}}>
                        <label style={{fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-secondary)'}}>SỐ ĐIỆN THOẠI</label>
                        <div style={{display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-input)', overflow: 'hidden'}}>
                            <input 
                                type="tel" 
                                placeholder="0987 654 321" 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={{width: '100%', border: 'none', background: 'transparent', padding: '12px', color: 'var(--text-primary)', outline: 'none', fontWeight: '600'}}
                            />
                        </div>
                    </div>

                    {/* 2. HỌ TÊN (Chỉ hiện khi ĐĂNG KÝ) */}
                    {!isLoginMode && (
                        <div className="fade-in" style={{marginBottom: '15px', textAlign: 'left'}}>
                            <label style={{fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-secondary)'}}>HỌ VÀ TÊN</label>
                            <input 
                                type="text" 
                                placeholder="Nguyễn Văn A" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontWeight: '600'}}
                            />
                        </div>
                    )}

                    {/* 3. MẬT KHẨU (Luôn hiện) */}
                    <div style={{marginBottom: '25px', textAlign: 'left'}}>
                        <label style={{fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-secondary)'}}>MẬT KHẨU</label>
                        <input 
                            type="password" 
                            placeholder="••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontWeight: '600'}}
                        />
                    </div>

                    {/* NÚT SUBMIT */}
                    <button type="submit" className="btn-primary" style={{width: '100%', padding: '12px', borderRadius: '8px', fontSize: '15px'}} disabled={isLoading}>
                        {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : (isLoginMode ? 'Đăng nhập' : 'Đăng ký')}
                    </button>

                </form>

                {/* SWITCH MODE LINK */}
                <div style={{marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)'}}>
                    {isLoginMode ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                    <span 
                        onClick={toggleMode} 
                        style={{color: 'var(--accent-color)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline'}}
                    >
                        {isLoginMode ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
                    </span>
                </div>

                {/* GOOGLE LOGIN */}
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '12px', margin: '25px 0'}}>
                    <div style={{flex: 1, height: '1px', background: 'var(--border-color)'}}></div>HOẶC<div style={{flex: 1, height: '1px', background: 'var(--border-color)'}}></div>
                </div>
                <button onClick={handleGoogleLogin} style={{
                    width: '100%', padding: '10px', borderRadius: '8px', 
                    background: '#FFFFFF', color: '#000', border: '1px solid #ddd', 
                    cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" width="18" />
                    Tiếp tục với Google
                </button>

            </div>
        </div>
    );
};

// ==========================================
// 3. DASHBOARD LAYOUT & APP CONTROLLER
// ==========================================
const DashboardLayout = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const DashboardHeader = () => (
        <header className="main-header" style={{
            background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)'
        }}>
            <div className="logo">
                <i className="fa-solid fa-atom fa-spin" style={{color: 'var(--accent-color)', fontSize: '24px'}}></i>
                <h1 style={{color: 'var(--text-primary)'}}>HR TECH <span style={{color: 'var(--accent-color)'}}>DASHBOARD</span></h1>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                <div style={{textAlign: 'right'}}>
                    <span style={{display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)'}}>{user ? user.full_name : 'User'}</span>
                    <span style={{fontSize: '11px', color: 'var(--accent-color)'}}>{user ? user.role : 'Member'}</span>
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
            case 'ai-training': return <AITraining />;
            case 'settings': return <AccountSettings user={user} onUpdateUser={(u) => console.log("Updated", u)} />;
            case 'core-hr':
            case 'time-off':
            case 'performance':
                return (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)'}}>
                        <i className="fa-solid fa-person-digging" style={{fontSize: '48px', marginBottom: '20px', color: 'var(--accent-color)'}}></i>
                        <h2>Tính năng đang phát triển</h2>
                        <p>Module này sẽ sớm ra mắt trong phiên bản Beta tiếp theo.</p>
                    </div>
                );
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

function App() {
    const [view, setView] = useState('home'); 
    const [currentUser, setCurrentUser] = useState(null);

    const navigateTo = (target) => setView(target);

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
                setupAxiosUser(googleUser);
                setView('dashboard');
            }
        });
    }, []);

    const handleLoginSuccess = (userData) => {
        setCurrentUser(userData);
        setupAxiosUser(userData);
        setView('dashboard');
    };

    const handleLogout = async () => {
        if(window.confirm("Bạn muốn đăng xuất?")) {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setupAxiosUser(null);
            setView('home'); 
        }
    };

    if (view === 'dashboard') return <DashboardLayout user={currentUser} onLogout={handleLogout} />;
    
    // [FIXED] Truyền prop 'mode' vào AuthView
    if (view === 'login' || view === 'signup') return <AuthView mode={view} onLoginSuccess={handleLoginSuccess} onBack={() => navigateTo('home')} />;
    
    return <HomeView onNavigate={navigateTo} />;
}

export default App;