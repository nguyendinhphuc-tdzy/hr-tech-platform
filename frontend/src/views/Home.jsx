/* FILE: frontend/src/views/Home.jsx (ISOLATED DARK MODE) */
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
    if (!supabase) return alert("Lỗi cấu hình Supabase! Vui lòng kiểm tra console.");
    
    const redirectUrl = window.location.origin + '/dashboard';
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
    if (error) alert("Lỗi: " + error.message);
  };

  if (session) return null;

  // --- STYLE OBJECTS (CÁCH LY HOÀN TOÀN KHỎI CSS CHUNG) ---
  const styles = {
      container: {
          backgroundColor: '#09121D', // Màu nền tối cứng
          color: '#FFFFFF',           // Chữ trắng cứng
          minHeight: '100vh',
          width: '100%',
          overflowX: 'hidden',
          position: 'absolute', top: 0, left: 0, zIndex: 99999, // Đè lên tất cả
          fontFamily: "'Montserrat', sans-serif"
      },
      nav: {
          padding: '20px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'fixed', width: '100%', top: 0, zIndex: 100,
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(9, 18, 29, 0.9)' // Nền tối mờ cứng
      },
      logoBox: {
          width: '40px', height: '40px',
          background: '#2EFF7B', // Neon Green cứng
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', color: '#000000', fontSize: '14px'
      },
      logoText: {
          fontSize: '20px', fontWeight: '700', margin: 0, 
          color: '#FFFFFF', // Chữ trắng cứng
          letterSpacing: '1px'
      },
      btnLogin: {
          background: '#2EFF7B', color: '#000000',
          padding: '10px 25px', borderRadius: '30px', border: 'none',
          fontWeight: '700', cursor: 'pointer',
          boxShadow: '0 0 15px rgba(46, 255, 123, 0.4)',
          transition: 'transform 0.2s'
      },
      heroTitle: {
          fontSize: '64px', fontWeight: '800', margin: '20px 0', lineHeight: '1.1',
          color: '#FFFFFF', // Chữ trắng cứng
          textShadow: '0 0 40px rgba(0,0,0,0.5)'
      },
      heroDesc: {
          fontSize: '18px', 
          color: '#E0E0E0', // Xám sáng cứng
          marginBottom: '40px', lineHeight: '1.6',
          maxWidth: '600px', margin: '20px auto 40px', display: 'block'
      },
      previewBox: {
          maxWidth: '1100px', margin: '0 auto 80px',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '12px',
          background: '#111827', // Nền khung tối cứng
          boxShadow: '0 20px 80px rgba(0,0,0,0.6)'
      }
  };

  return (
    <div style={styles.container}>
      
      {/* NAVBAR */}
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.logoBox}>HR</div>
            <h1 style={styles.logoText}>
                HR TECH <span style={{color: '#2EFF7B'}}>AI</span>
            </h1>
        </div>
        <button 
            onClick={handleLogin} 
            style={styles.btnLogin}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
            Đăng nhập ngay
        </button>
      </nav>

      {/* HERO SECTION */}
      <header style={{ paddingTop: '180px', textAlign: 'center', paddingBottom: '100px', position: 'relative' }}>
        {/* Glow Background */}
        <div style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            width: '600px', height: '600px', 
            background: 'radial-gradient(circle, rgba(46,255,123,0.15) 0%, transparent 70%)', 
            zIndex: 0, pointerEvents: 'none' 
        }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
                <span style={{ 
                    border: '1px solid #2EFF7B', color: '#2EFF7B', 
                    padding: '6px 18px', borderRadius: '20px', 
                    fontSize: '12px', fontWeight: '600',
                    background: 'rgba(46, 255, 123, 0.05)', letterSpacing: '0.5px'
                }}>
                    ✨ AI-Powered Recruitment Platform
                </span>
            </div>
            
            <h1 style={styles.heroTitle}>
                Tuyển dụng thông minh.<br/> <span style={{color: '#2EFF7B', textShadow: '0 0 20px rgba(46,255,123,0.4)'}}>Quyết định chính xác.</span>
            </h1>
            
            <p style={styles.heroDesc}>
                Hệ thống tự động hóa quy trình tuyển dụng, phân tích CV bằng AI và quản lý nhân sự tập trung. Giúp bạn tìm kiếm ứng viên tài năng nhanh hơn 10x.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                    onClick={handleLogin} 
                    style={{ 
                        ...styles.btnLogin,
                        padding: '16px 45px', borderRadius: '50px', fontSize: '16px', fontWeight: '800'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 0 50px rgba(46, 255, 123, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 0 30px rgba(46, 255, 123, 0.5)';
                    }}
                >
                    <i className="fa-brands fa-google" style={{marginRight:'10px'}}></i> Tiếp tục với Google
                </button>
            </div>
        </div>
      </header>

      {/* PREVIEW IMAGE PLACEHOLDER */}
      <section style={{ padding: '0 20px' }}>
        <div style={styles.previewBox}>
            <div style={{ 
                height: '600px', background: '#0F172A', borderRadius: '16px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.05)',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{textAlign: 'center', color: '#64748B', zIndex: 1}}>
                    <i className="fa-solid fa-chart-pie" style={{fontSize: '60px', marginBottom: '20px', opacity: 0.5}}></i>
                    <h3 style={{color: '#FFFFFF', margin: 0, fontSize: '24px', fontWeight: 600}}>Interactive Dashboard Preview</h3>
                    <p style={{color: '#94A3B8', marginTop: '10px'}}>Đăng nhập để trải nghiệm full tính năng</p>
                </div>
                
                {/* Grid Background */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    opacity: 0.5
                }}></div>
            </div>
        </div>
      </section>

    </div>
  );
};

export default Home;