// Tự động chọn URL: Nếu đang chạy ở máy mình (localhost) thì dùng localhost, ngược lại dùng Render
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://hr-api-server.onrender.com';

export default API_BASE_URL;