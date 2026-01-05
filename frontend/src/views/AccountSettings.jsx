/* FILE: frontend/src/views/AccountSettings.jsx */
import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const AccountSettings = ({ user }) => {
    const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security'
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success'|'error', msg: '' }

    // State Profile
    const [fullName, setFullName] = useState(user?.full_name || '');

    // State OTP Flow
    const [otpStep, setOtpStep] = useState('IDLE'); // IDLE -> SENT -> VERIFIED
    const [passData, setPassData] = useState({ otp: '', newPass: '', confirmPass: '' });

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    // --- HANDLERS ---
    
    // Cập nhật thông tin cá nhân
    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/api/account/profile`, 
                { full_name: fullName },
                { headers: { 'x-user-email': user.email } } // Gửi email để xác thực
            );
            showToast('success', 'Cập nhật thông tin thành công!');
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Lỗi cập nhật');
        } finally { 
            setIsLoading(false); 
        }
    };

    // Gửi OTP
    const handleSendOtp = async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/account/request-otp`, 
                {}, // Body rỗng
                { headers: { 'x-user-email': user.email } } // Gửi email để xác thực
            );
            setOtpStep('SENT');
            showToast('success', `Đã gửi mã OTP đến ${user.email}`);
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Không gửi được OTP');
        } finally { 
            setIsLoading(false); 
        }
    };

    // Đổi mật khẩu
    const handleChangePass = async () => {
        if (!passData.otp || !passData.newPass) return showToast('error', 'Vui lòng nhập đủ thông tin');
        if (passData.newPass !== passData.confirmPass) return showToast('error', 'Mật khẩu xác nhận không khớp');
        
        setIsLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/api/account/change-password`, 
                {
                    otp: passData.otp,
                    newPassword: passData.newPass
                },
                { headers: { 'x-user-email': user.email } }
            );
            showToast('success', 'Đổi mật khẩu thành công! Hãy đăng nhập lại.');
            setOtpStep('IDLE');
            setPassData({ otp: '', newPass: '', confirmPass: '' });
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Lỗi đổi mật khẩu');
        } finally { 
            setIsLoading(false); 
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start', color: 'var(--text-primary)' }}>
            
            {/* LEFT MENU */}
            <div className="card-common" style={{ width: '250px', padding: '15px 0', overflow: 'hidden', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ padding: '0 20px 15px', borderBottom: '1px solid var(--border-color)', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>Cài đặt</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Quản lý tài khoản</p>
                </div>
                <div 
                    onClick={() => setActiveTab('general')}
                    style={{ padding: '12px 20px', cursor: 'pointer', background: activeTab === 'general' ? 'var(--bg-input)' : 'transparent', borderLeft: activeTab === 'general' ? '3px solid var(--accent-color)' : '3px solid transparent', fontWeight: activeTab === 'general' ? 600 : 400, color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'all 0.2s' }}
                >
                    <i className="fa-regular fa-id-card" style={{ width: '25px' }}></i> Thông tin chung
                </div>
                <div 
                    onClick={() => setActiveTab('security')}
                    style={{ padding: '12px 20px', cursor: 'pointer', background: activeTab === 'security' ? 'var(--bg-input)' : 'transparent', borderLeft: activeTab === 'security' ? '3px solid var(--accent-color)' : '3px solid transparent', fontWeight: activeTab === 'security' ? 600 : 400, color: activeTab === 'security' ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'all 0.2s' }}
                >
                    <i className="fa-solid fa-shield-halved" style={{ width: '25px' }}></i> Bảo mật & OTP
                </div>
            </div>

            {/* RIGHT CONTENT */}
            <div style={{ flex: 1 }}>
                
                {/* TOAST NOTIFICATION */}
                {toast && (
                    <div className="fade-in" style={{ 
                        padding: '15px', borderRadius: '8px', marginBottom: '20px', 
                        background: toast.type === 'success' ? 'rgba(46, 255, 123, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                        border: `1px solid ${toast.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`, 
                        color: toast.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)', 
                        display: 'flex', alignItems: 'center', gap: '10px' 
                    }}>
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
                        {toast.msg}
                    </div>
                )}

                {/* TAB: GENERAL */}
                {activeTab === 'general' && (
                    <div className="card-common" style={{ padding: '30px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', fontSize: '20px' }}>Thông tin cá nhân</h2>
                        
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-color)', border: '2px solid var(--accent-color)' }}>
                                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px' }}>{user?.full_name}</h3>
                                <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>{user?.email}</p>
                                <span className="tag" style={{ marginTop: '8px', display: 'inline-block', background: 'var(--bg-input)', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', color: 'var(--accent-color)', border: '1px solid var(--border-color)' }}>{user?.role || 'Member'}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tên hiển thị</label>
                            <input 
                                type="text" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                            />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <button 
                                onClick={handleUpdateProfile} disabled={isLoading}
                                style={{ background: 'var(--accent-color)', color: '#000', padding: '10px 25px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}
                            >
                                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB: SECURITY */}
                {activeTab === 'security' && (
                    <div className="card-common" style={{ padding: '30px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', fontSize: '20px' }}>Đổi mật khẩu</h2>
                        
                        {otpStep === 'IDLE' ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ width: '60px', height: '60px', background: 'var(--bg-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <i className="fa-solid fa-lock" style={{ fontSize: '24px', color: 'var(--accent-color)' }}></i>
                                </div>
                                <h3 style={{ marginBottom: '10px' }}>Yêu cầu xác thực</h3>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 30px', fontSize: '14px', lineHeight: '1.5' }}>
                                    Để bảo mật, chúng tôi sẽ gửi mã OTP đến email <b>{user?.email}</b> của bạn trước khi cho phép đổi mật khẩu.
                                </p>
                                <button 
                                    onClick={handleSendOtp} disabled={isLoading}
                                    style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực (OTP)'}
                                </button>
                            </div>
                        ) : (
                            <div className="fade-in" style={{ maxWidth: '400px', margin: '0 auto' }}>
                                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '13px', color: 'var(--accent-color)', background: 'rgba(46, 255, 123, 0.1)', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                                        <i className="fa-solid fa-envelope-circle-check" style={{marginRight:'5px'}}></i> 
                                        Đã gửi mã đến {user?.email}
                                    </p>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>MÃ OTP (6 số)</label>
                                    <input 
                                        type="text" 
                                        placeholder="______"
                                        maxLength={6}
                                        style={{ width: '100%', padding: '12px', textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--accent-color)', borderRadius: '8px', outline: 'none' }}
                                        onChange={(e) => setPassData({...passData, otp: e.target.value})}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Mật khẩu mới</label>
                                    <input 
                                        type="password" 
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                                        onChange={(e) => setPassData({...passData, newPass: e.target.value})}
                                    />
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Xác nhận mật khẩu</label>
                                    <input 
                                        type="password" 
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                                        onChange={(e) => setPassData({...passData, confirmPass: e.target.value})}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={() => { setOtpStep('IDLE'); setPassData({otp:'', newPass:'', confirmPass:''}); }}
                                        style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                                    >Hủy bỏ</button>
                                    <button 
                                        onClick={handleChangePass} disabled={isLoading}
                                        style={{ flex: 2, padding: '12px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        {isLoading ? 'Đang xử lý...' : 'Xác nhận đổi'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountSettings;