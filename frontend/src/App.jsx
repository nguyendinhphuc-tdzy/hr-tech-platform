/* FILE: frontend/src/App.jsx (Fix: Dynamic User Profile) */
import { useState } from 'react';
import './index.css';

// Import các Views
import Dashboard from './views/Dashboard';
import CVScanView from './views/CVScanView';
import AITraining from './views/AITraining';
import InternBook from './views/InternBook';
import Sidebar from './components/Sidebar';

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
        {/* Navbar */}
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

        {/* Hero */}
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
// 2. MÀN HÌNH XÁC THỰC (LOGIN / SIGNUP) - CÓ LẤY DỮ LIỆU INPUT
// ==========================================
const AuthView = ({ mode, onLoginSuccess, onBack }) => {
    const isLogin = mode === 'login';
    const [isLoading, setIsLoading] = useState(false);
    
    // State lưu dữ liệu form
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Giả lập API call
        setTimeout(() => {
            setIsLoading(false);
            
            // Tạo thông tin user giả lập từ input
            const userProfile = {
                name: isLogin ? (formData.email.split('@')[0]) : formData.fullName, // Nếu login thì lấy tên từ email, nếu signup thì lấy tên thật
                email: formData.email,
                role: 'Admin Access'
            };
            
            // Gửi thông tin user lên App
            onLoginSuccess(userProfile);
        }, 1000);
    };

    const handleGoogleLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onLoginSuccess({
                name: "Google User",
                email: "user@gmail.com",
                role: "Standard Access"
            });
        }, 1000);
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

                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px'}}>
                    <button onClick={handleGoogleLogin} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px', borderRadius: '6px', background: '#FFFFFF', color: '#000', border: 'none', cursor: 'pointer', fontWeight: '600'}}>
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
                            <input 
                                name="fullName" 
                                type="text" 
                                placeholder="Ví dụ: Nguyễn Văn A" 
                                required 
                                onChange={handleChange}
                                style={{width: '100%', padding: '12px', borderRadius: '6px', background: '#0D1825', border: '1px solid var(--border-color)', color: 'white'}} 
                            />
                        </div>
                    )}
                    <div>
                        <label style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px'}}>EMAIL</label>
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="admin@hrtech.com" 
                            required 
                            onChange={handleChange}
                            style={{width: '100%', padding: '12px', borderRadius: '6px', background: '#0D1825', border: '1px solid var(--border-color)', color: 'white'}} 
                        />
                    </div>
                    <div>
                        <label style={{fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px'}}>MẬT KHẨU</label>
                        <input 
                            name="password" 
                            type="password" 
                            placeholder="••••••" 
                            required 
                            onChange={handleChange}
                            style={{width: '100%', padding: '12px', borderRadius: '6px', background: '#0D1825', border: '1px solid var(--border-color)', color: 'white'}} 
                        />
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
// 3. LAYOUT DASHBOARD CHÍNH (HIỂN THỊ DYNAMIC USER)
// ==========================================
const DashboardLayout = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Header nhận props 'user'
    const DashboardHeader = () => (
        <header className="main-header">
            <div className="logo">
                <i className="fa-solid fa-atom fa-spin" style={{color: 'var(--neon-green)', fontSize: '24px'}}></i>
                <h1>HR TECH <span style={{color: 'var(--neon-green)'}}>DASHBOARD</span></h1>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                <div style={{textAlign: 'right'}}>
                    {/* HIỂN THỊ TÊN NGƯỜI DÙNG TỪ PROPS */}
                    <span style={{display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-white)'}}>
                        {user ? user.name : 'Khách'} 
                    </span>
                    <span style={{fontSize: '11px', color: 'var(--neon-green)'}}>
                        {user ? user.email : ''}
                    </span>
                </div>
                <div style={{
                    width: '35px', height: '35px', borderRadius: '50%', border: '2px solid var(--neon-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-white)', fontWeight: 'bold'
                }}>
                    {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
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
    
    // State lưu thông tin người dùng hiện tại
    const [currentUser, setCurrentUser] = useState(null);

    const navigateTo = (target) => setView(target);

    // Khi đăng nhập thành công, nhận object user từ AuthView
    const handleLoginSuccess = (userData) => {
        setCurrentUser(userData);
        setView('dashboard');
    };

    const handleLogout = () => {
        const confirm = window.confirm("Bạn muốn đăng xuất về trang chủ?");
        if(confirm) {
            setCurrentUser(null);
            setView('home');
        }
    };

    // --- RENDER ---
    if (view === 'dashboard') {
        // Truyền currentUser xuống DashboardLayout
        return <DashboardLayout user={currentUser} onLogout={handleLogout} />;
    }

    if (view === 'login' || view === 'signup') {
        return <AuthView mode={view} onLoginSuccess={handleLoginSuccess} onBack={() => navigateTo('home')} />;
    }

    return <HomeView onNavigate={navigateTo} />;
}

export default App;