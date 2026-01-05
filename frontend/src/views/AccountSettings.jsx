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
    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/api/account/profile`, { full_name: fullName });
            showToast('success', 'Cập nhật thông tin thành công!');
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Lỗi cập nhật');
        } finally { setIsLoading(false); }
    };

    const handleSendOtp = async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/account/request-otp`);
            setOtpStep('SENT');
            showToast('success', `Đã gửi mã OTP đến ${user.email}`);
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Không gửi được OTP');
        } finally { setIsLoading(false); }
    };

    const handleChangePass = async () => {
        if (passData.newPass !== passData.confirmPass) return showToast('error', 'Mật khẩu xác nhận không khớp');
        setIsLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/api/account/change-password`, {
                otp: passData.otp,
                newPassword: passData.newPass
            });
            showToast('success', 'Đổi mật khẩu thành công! Hãy đăng nhập lại.');
            setOtpStep('IDLE');
            setPassData({ otp: '', newPass: '', confirmPass: '' });
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Lỗi đổi mật khẩu');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            
            {/* LEFT MENU */}
            <div className="card-common" style={{ width: '250px', padding: '15px 0', overflow: 'hidden' }}>
                <div style={{ padding: '0 20px 15px', borderBottom: '1px solid var(--border-color)', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '16px', margin: 0 }}>Cài đặt</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Quản lý tài khoản</p>
                </div>
                <div 
                    onClick={() => setActiveTab('general')}
                    style={{ padding: '12px 20px', cursor: 'pointer', background: activeTab === 'general' ? 'var(--bg-input)' : 'transparent', borderLeft: activeTab === 'general' ? '3px solid var(--accent-color)' : '3px solid transparent', fontWeight: activeTab === 'general' ? 600 : 400 }}
                >
                    <i className="fa-regular fa-id-card" style={{ width: '25px' }}></i> Thông tin chung
                </div>
                <div 
                    onClick={() => setActiveTab('security')}
                    style={{ padding: '12px 20px', cursor: 'pointer', background: activeTab === 'security' ? 'var(--bg-input)' : 'transparent', borderLeft: activeTab === 'security' ? '3px solid var(--accent-color)' : '3px solid transparent', fontWeight: activeTab === 'security' ? 600 : 400 }}
                >
                    <i className="fa-solid fa-shield-halved" style={{ width: '25px' }}></i> Bảo mật & OTP
                </div>
            </div>

            {/* RIGHT CONTENT */}
            <div style={{ flex: 1 }}>
                
                {/* TOAST NOTIFICATION */}
                {toast && (
                    <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', background: toast.type === 'success' ? 'rgba(46, 255, 123, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${toast.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`, color: toast.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
                        {toast.msg}
                    </div>
                )}

                {/* TAB: GENERAL */}
                {activeTab === 'general' && (
                    <div className="card-common" style={{ padding: '30px' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>Thông tin cá nhân</h2>
                        
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-color)', border: '2px solid var(--accent-color)' }}>
                                {user?.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>{user?.full_name}</h3>
                                <p style={{ margin: '5px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>{user?.email}</p>
                                <span className="tag tag-offer" style={{ marginTop: '5px', display: 'inline-block' }}>{user?.role || 'User'}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Tên hiển thị</label>
                            <input 
                                type="text" 
                                className="form-input"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <button className="btn-primary" onClick={handleUpdateProfile} disabled={isLoading}>
                                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB: SECURITY */}
                {activeTab === 'security' && (
                    <div className="card-common" style={{ padding: '30px' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>Đổi mật khẩu</h2>
                        
                        {otpStep === 'IDLE' ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ width: '60px', height: '60px', background: 'var(--bg-input)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <i className="fa-solid fa-lock" style={{ fontSize: '24px', color: 'var(--accent-color)' }}></i>
                                </div>
                                <h3 style={{ marginBottom: '10px' }}>Yêu cầu xác thực</h3>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 30px' }}>Để đảm bảo an toàn, chúng tôi cần xác minh danh tính của bạn qua Email trước khi cho phép đổi mật khẩu.</p>
                                <button className="btn-primary" onClick={handleSendOtp} disabled={isLoading}>
                                    {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực (OTP)'}
                                </button>
                            </div>
                        ) : (
                            <div className="fade-in" style={{ maxWidth: '400px', margin: '0 auto' }}>
                                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '13px', color: 'var(--success-color)' }}>Đã gửi mã đến {user.email}</p>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>MÃ OTP (Check Email)</label>
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        placeholder="______"
                                        maxLength={6}
                                        style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' }}
                                        onChange={(e) => setPassData({...passData, otp: e.target.value})}
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>Mật khẩu mới</label>
                                    <input 
                                        type="password" 
                                        className="form-input"
                                        onChange={(e) => setPassData({...passData, newPass: e.target.value})}
                                    />
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>Xác nhận mật khẩu</label>
                                    <input 
                                        type="password" 
                                        className="form-input"
                                        onChange={(e) => setPassData({...passData, confirmPass: e.target.value})}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        onClick={() => setOtpStep('IDLE')}
                                        style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer' }}
                                    >Hủy</button>
                                    <button className="btn-primary" style={{ flex: 2 }} onClick={handleChangePass} disabled={isLoading}>
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