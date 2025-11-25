import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [candidates, setCandidates] = useState([]);

  // Gọi API từ Backend khi web vừa tải
  useEffect(() => {
    axios.get('https://hr-api-server.onrender.com')
      .then(response => {
        setCandidates(response.data);
      })
      .catch(error => console.error("Lỗi kết nối:", error));
  }, []);

  return (
    <div className="app-container">
      <h1>Hệ thống Quản lý Tuyển dụng (HR Tech)</h1>
      <div className="pipeline">
        {/* Cột Screening */}
        <div className="column">
          <h2>Screening</h2>
          {candidates.filter(c => c.status === 'Screening').map(c => (
            <div key={c.id} className="card">
              <h3>{c.full_name}</h3>
              <p>{c.role}</p>
              <span>AI Rating: {c.ai_rating}</span>
            </div>
          ))}
        </div>
        {/* Bạn có thể copy ra thêm cột Interview, Offer... */}
      </div>
    </div>
  );
}

export default App;