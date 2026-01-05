/* FILE: frontend/src/views/AccountSettings.jsx */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../components/config';

const AccountSettings = ({ user, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // State cho Profile
    const [fullName, setFullName] = useState(user?.full_name || '');

    // State cho Đổi mật khẩu
    const [otpStep, setOtpStep] = useState(1); // 1: Request, 2: Verify & Change
    const [passwordData, setPasswordData] = useState({ otp: '', newPassword: '', confirmPassword: '' });

    // Reset message khi chuyển tab
    useEffect(() => setMessage({ type: '', text: '' }), [activeTab]);

    // --- XỬ LÝ CẬP NHẬT PROFILE ---
    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/api/account/profile`, { full_name: fullName });
            setMessage({ type: 'success', text: res.data.message });
            // Cập nhật lại state user ở App.jsx nếu cần (thông qua callback)
            if (onUpdateUser) onUpdateUser(res.data.user);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || "Lỗi cập nhật" });
        } finally { setLoading(false); }
    };

    // --- XỬ LÝ ĐỔI MẬT KHẨU (OTP FLOW) ---
    const handleRequestOtp = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/account/request-otp`);
            setMessage({ type: 'success', text: res.data.message });
            setOtpStep(2); // Chuyển sang bước nhập OTP
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || "Lỗi gửi OTP" });
        } finally { setLoading(false); }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return setMessage({ type: 'error', text: "Mật khẩu xác nhận không khớp!" });
        }
        setLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/api/account/change-password`, {
                otp: passwordData.otp,
                newPassword: passwordData.newPassword
            });
            setMessage({ type: 'success', text: res.data.message });
            setOtpStep(1); // Reset về ban đầu
            setPasswordData({ otp: '', newPassword: '', confirmPassword: '' });
            alert("Đổi mật khẩu thành công!");
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || "Lỗi đổi mật khẩu" });
        } finally { setLoading(false); }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="section-title">
                <i className="fa-solid fa-user-gear" style={{ color: 'var(--accent-color)' }}></i>
                Cài đặt tài khoản
            </h2>

            {/* TAB NAVIGATION */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <button 
                    onClick={() => setActiveTab('profile')}
                    style={{
                        background: activeTab === 'profile' ? 'var(--accent-glow)' : 'transparent',
                        color: activeTab === 'profile' ? 'var(--accent-color)' : 'var(--text-secondary)',
                        border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                    }}
                >
                    Thông tin chung
                </button>
                <button 
                    onClick={() => setActiveTab('security')}
                    style={{
                        background: activeTab === 'security' ? 'var(--accent-glow)' : 'transparent',
                        color: activeTab === 'security' ? 'var(--accent-color)' : 'var(--text-secondary)',
                        border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                    }}
                >
                    Bảo mật & OTP
                </button>
            </div>

            {/* MESSAGE ALERT */}
            {message.text && (
                <div style={{
                    padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
                    background: message.type === 'success' ? 'rgba(46, 255, 123, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                    border: `1px solid ${message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`
                }}>
                    {message.type === 'success' ? <i className="fa-solid fa-check-circle"></i> : <i className="fa-solid fa-circle-exclamation"></i>} {message.text}
                </div>
            )}

            {/* CONTENT: PROFILE */}
            {activeTab === 'profile' && (
                <div className="card-common" style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 15px',
                            background: 'var(--bg-input)', border: '2px solid var(--accent-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)'
                        }}>
                            {user?.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{user?.email}</p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>HỌ VÀ TÊN HIỂN THỊ</label>
                        <input 
                            type="text" 
                            className="form-input"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <button className="btn-primary" onClick={handleUpdateProfile} disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            )}

            {/* CONTENT: SECURITY (OTP FLOW) */}
            {activeTab === 'security' && (
                <div className="card-common" style={{ padding: '30px' }}>
                    <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Đổi mật khẩu an toàn</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '25px', lineHeight: '1.5' }}>
                        Để bảo vệ tài khoản, chúng tôi sử dụng cơ chế xác thực 2 lớp (2FA). 
                        Mã OTP sẽ được gửi về email <b>{user?.email}</b> của bạn.
                    </p>

                    {otpStep === 1 ? (
                        <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                            <i className="fa-solid fa-shield-halved" style={{ fontSize: '40px', color: 'var(--accent-color)', marginBottom: '15px' }}></i>
                            <p style={{ marginBottom: '20px' }}>Nhấn nút bên dưới để nhận mã OTP xác thực.</p>
                            <button className="btn-primary" onClick={handleRequestOtp} disabled={loading} style={{ width: '100%' }}>
                                {loading ? 'Đang gửi...' : 'Gửi mã OTP qua Email'}
                            </button>
                        </div>
                    ) : (
                        <div className="fade-in">
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>MÃ OTP (6 SỐ)</label>
                                <input 
                                    type="text" 
                                    placeholder="Ví dụ: 123456"
                                    maxLength={6}
                                    style={{ letterSpacing: '5px', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}
                                    onChange={(e) => setPasswordData({...passwordData, otp: e.target.value})}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>MẬT KHẨU MỚI</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••"
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>XÁC NHẬN MẬT KHẨU</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••"
                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => setOtpStep(1)}
                                    style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Quay lại
                                </button>
                                <button className="btn-primary" style={{ flex: 2 }} onClick={handleChangePassword} disabled={loading}>
                                    {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountSettings;