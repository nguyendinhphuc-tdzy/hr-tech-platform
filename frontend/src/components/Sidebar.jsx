import React from 'react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-table-columns', label: 'Dashboard' },
    { id: 'cv-scan', icon: 'fa-robot', label: 'AI Scan CV' },
    { id: 'intern-book', icon: 'fa-book-open', label: 'Sổ tay Thực tập' },
    { id: 'ai-training', icon: 'fa-brain', label: 'Huấn luyện AI' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top" style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={{
                padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center',
                background: activeTab === item.id ? '#E0E7FF' : 'transparent',
                color: activeTab === item.id ? '#4F46E5' : '#6B7280',
                fontWeight: activeTab === item.id ? 600 : 500
            }}
          >
            <i className={`fa-solid ${item.icon}`} style={{width: '20px', textAlign:'center'}}></i>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      
      <div className="sidebar-bottom" style={{marginTop: 'auto', borderTop: '1px solid #E5E7EB', paddingTop: '15px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <div style={{width:'36px', height:'36px', background:'#F3F4F6', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', color:'#374151'}}>HR</div>
            <div>
                <div style={{fontWeight: 600, fontSize: '14px'}}>Mai Anh</div>
                <div style={{fontSize: '12px', color: '#6B7280'}}>HR Manager</div>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;