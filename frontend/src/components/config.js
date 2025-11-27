// frontend/src/components/config.js
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://hr-api-server.onrender.com'; // <--- CHỈ LÀ CHUỖI TEXT, KHÔNG CÓ DẤU [] hay ()

export default API_BASE_URL;