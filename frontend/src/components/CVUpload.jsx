/* FILE: frontend/src/components/CVUpload.jsx (Batch Support & Validation) */
import React, { useState, useRef } from 'react';

const CVUpload = ({ onScan, disabled }) => {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const MAX_FILES = 5; // Giới hạn 5 file mỗi lần quét

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        validateAndSetFiles(selectedFiles);
    };

    const validateAndSetFiles = (fileList) => {
        if (fileList.length > MAX_FILES) {
            alert(`⚠️ Bạn chỉ được phép quét tối đa ${MAX_FILES} CV mỗi lần để đảm bảo chất lượng AI.`);
            return;
        }
        
        // Lọc chỉ lấy PDF
        const validFiles = fileList.filter(f => f.type === 'application/pdf');
        if (validFiles.length !== fileList.length) {
            alert("⚠️ Một số file không phải là PDF và đã bị loại bỏ.");
        }
        
        setFiles(validFiles);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const droppedFiles = Array.from(e.dataTransfer.files);
        validateAndSetFiles(droppedFiles);
    };

    const handleSubmit = () => {
        if (files.length === 0) return;
        if (onScan) {
            onScan(files); // Gửi mảng file ra ngoài cho Parent xử lý
        }
        setFiles([]); // Reset sau khi gửi
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div 
            className={`cv-upload-card ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
                border: '2px dashed var(--border-color)', borderRadius: '16px',
                padding: '40px', textAlign: 'center', background: isDragging ? 'rgba(46, 255, 123, 0.05)' : 'var(--bg-secondary)',
                transition: 'all 0.3s', position: 'relative'
            }}
        >
            <input 
                type="file" 
                multiple // CHO PHÉP NHIỀU FILE
                accept=".pdf" 
                onChange={handleFileChange} 
                style={{display: 'none'}} 
                ref={fileInputRef}
                disabled={disabled}
            />
            
            <div style={{marginBottom: '20px'}}>
                <div style={{
                    width: '70px', height: '70px', borderRadius: '50%', background: 'var(--bg-input)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px',
                    border: '1px solid var(--border-color)'
                }}>
                    <i className="fa-solid fa-cloud-arrow-up" style={{fontSize: '28px', color: 'var(--accent-color)'}}></i>
                </div>
                <h3 style={{fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 10px 0'}}>
                    Kéo thả hoặc Chọn CV
                </h3>
                <p style={{fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto'}}>
                    Hỗ trợ định dạng PDF. Tối đa <strong>{MAX_FILES} CV</strong> / lần quét.
                </p>
            </div>

            {/* DANH SÁCH FILE ĐÃ CHỌN */}
            {files.length > 0 && (
                <div style={{marginBottom: '20px', background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto'}}>
                    {files.map((f, idx) => (
                        <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-primary)', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                            <i className="fa-solid fa-file-pdf" style={{color: '#F59E0B'}}></i>
                            <span style={{flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{f.name}</span>
                            <span style={{color: 'var(--text-secondary)'}}>{(f.size / 1024).toFixed(0)} KB</span>
                        </div>
                    ))}
                </div>
            )}

            <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
                <button 
                    onClick={() => fileInputRef.current.click()} 
                    style={{
                        background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
                        padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
                    }}
                    disabled={disabled}
                >
                    Chọn File
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={disabled || files.length === 0}
                    style={{
                        background: disabled || files.length === 0 ? 'var(--bg-input)' : 'var(--accent-color)', 
                        color: disabled || files.length === 0 ? 'var(--text-secondary)' : '#000',
                        border: 'none', padding: '12px 30px', borderRadius: '8px', 
                        cursor: disabled || files.length === 0 ? 'not-allowed' : 'pointer', fontWeight: '700',
                        boxShadow: disabled ? 'none' : '0 0 15px var(--accent-glow)'
                    }}
                >
                    {disabled ? 'Đang xử lý...' : `Quét ${files.length > 0 ? files.length : ''} CV Ngay`}
                </button>
            </div>
        </div>
    );
};

export default CVUpload;