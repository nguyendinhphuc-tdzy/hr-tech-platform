const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : '[https://hr-api-server.onrender.com](https://hr-api-server.onrender.com)'; // <-- Đảm bảo link này đúng link Render của bạn

export default API_BASE_URL;