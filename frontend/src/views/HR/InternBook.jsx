import { useState } from 'react';

const InternBook = () => {
    // Dữ liệu giả lập (Mock Data) - Sau này sẽ nối API sau
    const [interns, setInterns] = useState([
        { id: 1, name: 'Nguyễn Minh Anh', role: 'Frontend Intern', notes: 'Tuần 1: Hoàn thành tốt task UI.\nCần cải thiện tốc độ.' },
        { id: 2, name: 'Trần Hoàng Long', role: 'Data Intern', notes: 'Kiến thức SQL tốt.' }
    ]);
    const [selectedId, setSelectedId] = useState(null);
    const [noteInput, setNoteInput] = useState('');

    const selectedIntern = interns.find(i => i.id === selectedId);

    const handleSave = () => {
        if (!selectedIntern) return;
        const updated = interns.map(i => i.id === selectedId ? {...i, notes: noteInput} : i);
        setInterns(updated);
        alert('Đã lưu ghi chú (Local)');
    };

    return (
        <div className="hr-section-card" style={{height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column'}}>
            <div className="notebook-header" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                <h2 className="section-title" style={{margin:0}}><i className="fa-solid fa-book-open"></i> Sổ tay Thực tập sinh</h2>
                <button style={{background:'#4F46E5', color:'white', border:'none', padding:'8px 15px', borderRadius:'6px'}}>+ Thêm thực tập sinh</button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '300px 1fr', gap: '0', flexGrow: 1, border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden'}}>
                {/* Cột trái: Danh sách */}
                <div style={{borderRight:'1px solid #E5E7EB', overflowY: 'auto', background: '#F9FAFB'}}>
                    {interns.map(i => (
                        <div 
                            key={i.id}
                            onClick={() => { setSelectedId(i.id); setNoteInput(i.notes); }}
                            style={{
                                padding: '15px', 
                                cursor: 'pointer', 
                                borderBottom: '1px solid #E5E7EB',
                                background: selectedId === i.id ? '#fff' : 'transparent',
                                borderLeft: selectedId === i.id ? '4px solid #4F46E5' : '4px solid transparent'
                            }}
                        >
                            <div style={{fontWeight: 600, color: '#111827'}}>{i.name}</div>
                            <div style={{fontSize: '12px', color: '#6B7280'}}>{i.role}</div>
                        </div>
                    ))}
                </div>

                {/* Cột phải: Nội dung */}
                <div style={{padding: '20px', background: '#fff'}}>
                    {selectedIntern ? (
                        <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                            <h3 style={{marginTop:0}}>{selectedIntern.name} - <span style={{color: '#6B7280', fontSize: '16px', fontWeight: 400}}>{selectedIntern.role}</span></h3>
                            <label style={{display:'block', marginBottom:'10px', fontWeight:500, marginTop: '10px'}}>Ghi chú & Đánh giá:</label>
                            <textarea 
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                style={{flexGrow: 1, width:'100%', padding:'15px', borderRadius:'8px', border:'1px solid #D1D5DB', resize: 'none', fontFamily: 'inherit'}}
                                placeholder="Nhập ghi chú..."
                            />
                            <div style={{marginTop: '15px', textAlign: 'right'}}>
                                <button onClick={handleSave} style={{background:'#10B981', color:'white', border:'none', padding:'10px 25px', borderRadius:'6px', cursor:'pointer', fontWeight: 600}}>
                                    <i className="fa-solid fa-save"></i> Lưu lại
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{textAlign:'center', color:'#9CA3AF', marginTop:'100px'}}>
                            <i className="fa-solid fa-hand-pointer" style={{fontSize:'40px', marginBottom: '15px'}}></i>
                            <p>Chọn một thực tập sinh bên trái để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InternBook;