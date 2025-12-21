import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

// Lấy config từ biến môi trường (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "LINK_SUPABASE_CUA_BAN";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "KEY_SUPABASE_CUA_BAN";
const supabase = createClient(supabaseUrl, supabaseKey);

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Kiểm tra nếu đã login thì chuyển thẳng vào Dashboard
  useEffect(() => {
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            navigate('/dashboard');
        }
    };
    checkUser();
  }, [navigate]);

  // Xử lý Login Google
// Trong frontend/src/views/Home.jsx

  const handleLogin = async () => {
    if (!supabase) {
        alert("Chưa kết nối được với Server (Lỗi Config).");
        return;
    }

    // Tự động lấy URL hiện tại của trình duyệt (Localhost hoặc Vercel)
    // Nếu đang ở vercel.app -> redirect về vercel.app/dashboard
    // Nếu đang ở localhost:3000 -> redirect về localhost:3000/dashboard
    const redirectUrl = window.location.origin + '/dashboard';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl, 
      }
    });

    if (error) alert("Lỗi đăng nhập: " + error.message);
  };

  return (
    <div className="landing-page" style={{ background: 'var(--bg-deep-black)', minHeight: '100vh', color: 'var(--text-white)', overflowX: 'hidden' }}>
      
      {/* --- NAVBAR --- */}
      <nav style={{ 
          padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', position: 'fixed', width: '100%', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Logo Placeholder - Thay bằng ảnh logo của bạn */}
            <div style={{ width: '40px', height: '40px', background: 'var(--neon-green)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>
                HR
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '1px' }}>HR TECH <span style={{color: 'var(--neon-green)'}}>AI</span></h1>
        </div>
        <div>
            <button 
                onClick={handleLogin}
                style={{
                    background: 'transparent', border: '1px solid var(--neon-green)', color: 'var(--neon-green)',
                    padding: '10px 20px', borderRadius: '30px', cursor: 'pointer', fontWeight: '600', marginRight: '15px'
                }}
            >
                Đăng nhập
            </button>
            <button 
                onClick={handleLogin}
                style={{
                    background: 'var(--neon-green)', border: 'none', color: '#000',
                    padding: '10px 25px', borderRadius: '30px', cursor: 'pointer', fontWeight: '700',
                    boxShadow: '0 0 15px rgba(46, 255, 123, 0.4)'
                }}
            >
                Bắt đầu ngay <i className="fa-solid fa-arrow-right" style={{marginLeft: '5px'}}></i>
            </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header style={{ 
          marginTop: '100px', textAlign: 'center', padding: '80px 20px', position: 'relative'
      }}>
        {/* Hiệu ứng nền Glow */}
        <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(46,255,123,0.1) 0%, transparent 70%)',
            zIndex: 0, pointerEvents: 'none'
        }}></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
            <span style={{ 
                background: 'rgba(46, 255, 123, 0.1)', color: 'var(--neon-green)', padding: '8px 16px', borderRadius: '20px', 
                fontSize: '14px', fontWeight: '600', border: '1px solid var(--neon-green)', display: 'inline-block', marginBottom: '20px'
            }}>
                ✨ AI-Powered Recruitment Platform
            </span>
            <h1 style={{ 
                fontSize: '64px', fontWeight: '800', lineHeight: '1.1', marginBottom: '20px',
                background: 'linear-gradient(to right, #FFFFFF, #B0B6BA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
                Tuyển dụng thông minh.<br/>
                <span style={{ color: 'var(--neon-green)', WebkitTextFillColor: 'var(--neon-green)' }}>Quyết định chính xác.</span>
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto 40px' }}>
                Hệ thống tự động hóa quy trình tuyển dụng, phân tích CV bằng AI và quản lý nhân sự tập trung. 
                Giúp bạn tìm kiếm ứng viên tài năng nhanh hơn 10x.
            </p>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button 
                    onClick={handleLogin}
                    style={{
                        background: 'var(--neon-green)', color: '#000', padding: '15px 40px', borderRadius: '50px', 
                        fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer',
                        boxShadow: '0 0 30px rgba(46, 255, 123, 0.5)', transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                    <i className="fa-brands fa-google" style={{marginRight: '10px'}}></i>
                    Tiếp tục với Google
                </button>
            </div>
        </div>
      </header>

      {/* --- DASHBOARD PREVIEW (MOCKUP) --- */}
      <section style={{ padding: '0 20px 80px', textAlign: 'center' }}>
        <div style={{ 
            maxWidth: '1100px', margin: '0 auto', 
            background: '#131F2E', borderRadius: '20px', padding: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
            {/* Đây là chỗ để ảnh chụp màn hình Dashboard của bạn */}
            <div style={{ 
                background: '#09121D', borderRadius: '15px', height: '500px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center'}}>
                    <i className="fa-solid fa-layer-group" style={{fontSize: '80px', color: 'rgba(46,255,123,0.2)', marginBottom: '20px'}}></i>
                    <h3 style={{color: 'var(--text-secondary)'}}>Dashboard Preview</h3>
                </div>
                {/* Giả lập giao diện */}
                <div style={{ width: '100%', height: '100%', opacity: 0.3, background: 'url("https://via.placeholder.com/1200x600/09121D/2EFF7B?text=AI+Dashboard+Screenshot") center/cover' }}></div>
            </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section style={{ padding: '80px 20px', background: '#0D1825' }}>
        <div className="container">
            <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '60px', color: 'var(--text-white)' }}>
                Tính năng <span style={{color: 'var(--neon-green)'}}>Vượt trội</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                <FeatureCard icon="fa-wand-magic-sparkles" title="AI Scan CV" desc="Tự động trích xuất thông tin, chấm điểm và phân tích kỹ năng ứng viên chỉ trong 3 giây." />
                <FeatureCard icon="fa-chart-pie" title="Real-time Dashboard" desc="Theo dõi quy trình tuyển dụng trực quan với biểu đồ và chỉ số cập nhật thời gian thực." />
                <FeatureCard icon="fa-users-viewfinder" title="Quản lý Intern" desc="Sổ tay điện tử theo dõi tiến độ và hiệu suất của thực tập sinh." />
            </div>
        </div>
      </section>

      <footer style={{ padding: '40px 0', textAlign: 'center', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px' }}>
        <p>&copy; 2024 HR Tech Platform. Designed with <span style={{color: 'var(--neon-green)'}}>❤</span> by You.</p>
      </footer>
    </div>
  );
};

// Component con cho thẻ tính năng
const FeatureCard = ({ icon, title, desc }) => (
    <div style={{ 
        background: 'var(--card-background)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)',
        transition: 'transform 0.3s'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.borderColor = 'var(--neon-green)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
    >
        <div style={{ width: '60px', height: '60px', background: 'rgba(46, 255, 123, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--neon-green)', marginBottom: '20px' }}>
            <i className={`fa-solid ${icon}`}></i>
        </div>
        <h3 style={{ fontSize: '20px', marginBottom: '10px', color: 'var(--text-white)' }}>{title}</h3>
        <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
);

export default Home;