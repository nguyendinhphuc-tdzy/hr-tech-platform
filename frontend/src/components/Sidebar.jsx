/* FILE: frontend/src/components/Sidebar.jsx */
import React from "react";
import { useTheme } from "../context/ThemeContext";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "fa-chart-pie" },
    { id: "ai-scan", label: "AI Scan CV", icon: "fa-radar" },
    { id: "intern-book", label: "Sổ tay Thực tập", icon: "fa-book-open-reader" },
    { id: "ai-training", label: "Huấn luyện AI", icon: "fa-robot" },
    // THÊM MỤC CÀI ĐẶT VÀO MENU CHÍNH LUÔN CHO DỄ THẤY
    { id: "account-settings", label: "Cài đặt tài khoản", icon: "fa-user-gear" },
  ];

  return (
    <aside
      className="sidebar"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 80px)",
        position: "sticky",
        top: "80px",
        background: "var(--bg-secondary)", // Đảm bảo nền đúng theme
        borderRight: "1px solid var(--border-color)", // Viền đúng theme
        padding: "20px",
        transition: "background 0.3s, border-color 0.3s"
      }}
    >
      {/* 1. MENU CHÍNH */}
      <div className="sidebar-menu" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
                <div
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '15px',
                        padding: '12px 20px',
                        background: isActive ? 'var(--accent-glow)' : 'transparent', 
                        border: isActive ? '1px solid var(--accent-color)' : '1px solid transparent',
                        borderRadius: '8px',
                        color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                        fontSize: '14px', fontWeight: isActive ? '600' : '400',
                        cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                        if(!isActive) {
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if(!isActive) {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.background = 'transparent';
                        }
                    }}
                >
                    <i className={`fa-solid ${item.icon}`} style={{width: '20px', textAlign: 'center'}}></i>
                    <span>{item.label}</span>
                </div>
            );
        })}
      </div>

      {/* 2. FOOTER (SETTINGS & THEME) */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          paddingTop: "20px",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        {/* NÚT CHUYỂN THEME (Toggle Switch) */}
        <button
          onClick={toggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            borderRadius: "8px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            cursor: "pointer",
            width: "100%",
            transition: "all 0.3s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {theme === "dark" ? (
              <i className="fa-solid fa-moon" style={{ color: "#A5B4FC" }}></i>
            ) : (
              <i className="fa-solid fa-sun" style={{ color: "#F59E0B" }}></i>
            )}
            <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
          </div>

          {/* UI Toggle Switch */}
          <div
            style={{
              width: "36px",
              height: "20px",
              background:
                theme === "dark" ? "var(--bg-tertiary)" : "var(--accent-color)",
              border: "1px solid var(--border-color)",
              borderRadius: "20px",
              position: "relative",
              transition: "background 0.3s",
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                background: "#FFFFFF",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                left: theme === "dark" ? "3px" : "17px",
                transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
            ></div>
          </div>
        </button>

        {/* VERSION INFO CARD */}
        <div
          style={{
            padding: "12px",
            background: "var(--bg-tertiary)",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
              }}
            >
              HỆ THỐNG
            </p>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Online v1.2
            </p>
          </div>
          <div
            style={{
              width: "8px",
              height: "8px",
              background: "var(--success-color)",
              borderRadius: "50%",
              boxShadow: "0 0 8px var(--success-color)",
            }}
          ></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;