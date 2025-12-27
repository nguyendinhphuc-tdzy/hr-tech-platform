/* FILE: frontend/src/views/Home.jsx (Fixed Dark Mode) */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

const Home = ({ session }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
        navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);

  const handleLogin = async () => {
    if (!supabase) return alert("Lỗi cấu hình Supabase!");
    const redirectUrl = window.location.origin + '/dashboard';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
    if (error) alert("Lỗi: " + error.message);
  };

  if (session) return null;

  return (
    <div className="landing-page" style={{ 
        /* FORCE DARK MODE STYLES */
        backgroundColor: '#09121D', 
        color: '#FFFFFF', 
        minHeight: '100vh', 
        width: '100%',
        overflowX: 'hidden',
        position: 'absolute', /* Đè lên body */
        top: 0, left: 0
    }}>
      
      {/* NAVBAR */}
      <nav style={{ 
          padding: '20px 40px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          position: 'fixed', width: '100%', top: 0, zIndex: 100, 
          backdropFilter: 'blur(10px)', 
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(9, 18, 29, 0.8)' /* Nền tối mờ */
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
                width: '40px', height: '40px', 
                background: '#2EFF7B', /* Neon Green */
                borderRadius: '8px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontWeight: 'bold', color: '#000' 
            }}>
                HR
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#fff' }}>
                HR TECH <span style={{color: '#2EFF7B'}}>AI</span>
            </h1>
        </div>
        <button 
            onClick={handleLogin} 
            style={{ 
                background: '#2EFF7B', color: '#000', 
                padding: '10px 25px', borderRadius: '30px', border: 'none', 
                fontWeight: '700', cursor: 'pointer', 
                boxShadow: '0 0 15px rgba(46, 255, 123, 0.4)',
                transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
            Đăng nhập ngay
        </button>
      </nav>

      {/* HERO SECTION */}
      <header style={{ paddingTop: '150px', textAlign: 'center', paddingBottom: '100px', position: 'relative' }}>
        {/* Hiệu ứng nền Glow */}
        <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            width: '600px', height: '600px', 
            background: 'radial-gradient(circle, rgba(46,255,123,0.1) 0%, transparent 70%)', 
            zIndex: 0, pointerEvents: 'none' 
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                <span style={{ 
                    border: '1px solid #2EFF7B', color: '#2EFF7B', 
                    padding: '5px 15px', borderRadius: '20px', 
                    fontSize: '12px', fontWeight: '600',
                    background: 'rgba(46, 255, 123, 0.05)'
                }}>
                    ✨ AI-Powered Recruitment Platform
                </span>
            </div>
            
            <h1 style={{ fontSize: '60px', fontWeight: '800', margin: '20px 0', lineHeight: '1.2', color: '#fff' }}>
                Tuyển dụng thông minh.<br/> <span style={{color: '#2EFF7B'}}>Quyết định chính xác.</span>
            </h1>
            
            <div style={{ fontSize: '18px', color: '#9CA3AF', marginBottom: '40px', lineHeight: '1.6' }}>
                Hệ thống tự động hóa quy trình tuyển dụng, phân tích CV bằng AI và quản lý nhân sự tập trung. Giúp bạn tìm kiếm ứng viên tài năng nhanh hơn 10x.
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                    onClick={handleLogin} 
                    style={{ 
                        background: '#2EFF7B', color: '#000', 
                        padding: '15px 40px', borderRadius: '50px', 
                        fontSize: '16px', fontWeight: '700', border: 'none', 
                        cursor: 'pointer', boxShadow: '0 0 30px rgba(46, 255, 123, 0.5)', 
                        display: 'flex', alignItems: 'center', gap: '10px' 
                    }}
                >
                    <i className="fa-brands fa-google"></i> Tiếp tục với Google
                </button>
            </div>
        </div>
      </header>

      {/* DASHBOARD PREVIEW */}
      <section style={{ padding: '0 20px' }}>
        <div style={{ 
            maxWidth: '1000px', margin: '0 auto 80px', 
            border: '1px solid #1F2937', borderRadius: '20px', padding: '10px', 
            background: '#111827', /* Nền khung Preview tối */
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
            <div style={{ 
                height: '500px', background: '#0F172A', borderRadius: '15px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #1F2937'
            }}>
                <div style={{textAlign: 'center', color: '#64748B'}}>
                    <i className="fa-solid fa-chart-pie" style={{fontSize: '50px', marginBottom: '15px'}}></i>
                    <h3 style={{color: '#FFFFFF', margin: 0}}>Interactive Dashboard Preview</h3>
                </div>
            </div>
        </div>
      </section>

    </div>
  );
};

export default Home;