import CVUpload from '../components/CVUpload'; // Import từ components

const CVScanView = () => {
  return (
    <div className="cv-scan-view" style={{maxWidth: '800px', margin: '0 auto'}}>
      <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <h2 className="section-title" style={{fontSize: '24px'}}>Công cụ AI Scan CV</h2>
          <p style={{color: '#6B7280'}}>
            Tải lên hồ sơ ứng viên (PDF) để AI tự động trích xuất thông tin, đánh giá kỹ năng và chấm điểm mức độ phù hợp với công việc.
          </p>
      </div>
      
      {/* Component Upload nằm ở đây */}
      <CVUpload onUploadSuccess={() => alert('Đã lưu hồ sơ vào hệ thống! Hãy kiểm tra Dashboard.')} />
      
      <div style={{marginTop: '40px', padding: '20px', background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #D1D5DB'}}>
          <h4 style={{marginTop: 0, color: '#374151'}}>Hướng dẫn:</h4>
          <ul style={{color: '#4B5563', paddingLeft: '20px', lineHeight: '1.6'}}>
              <li>Hệ thống hỗ trợ file PDF.</li>
              <li>AI sẽ tự động đọc: Họ tên, Email, Kỹ năng công nghệ.</li>
              <li>Kết quả sẽ được lưu vào Database và hiển thị tại Dashboard.</li>
          </ul>
      </div>
    </div>
  );
};

export default CVScanView;