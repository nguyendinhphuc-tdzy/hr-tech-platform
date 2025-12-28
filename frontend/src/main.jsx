/* FILE: frontend/src/main.jsx */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider> {/* Bọc ứng dụng trong ThemeProvider để dùng chung Context */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);