import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Tabbar.css';

const Tabbar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'question-list', label: 'Danh sách câu hỏi' },
    { id: 'add-question', label: 'Thêm câu hỏi' },
    { id: 'preview-question', label: 'Xem trước câu hỏi' },
  ];

  return (
    <nav className="tabbar-wrapper">
      <div className="container py-3">
        <ul className="nav nav-pills justify-content-center gap-3 tabbar-nav">
          {tabs.map((tab) => (
            <li key={tab.id} className="nav-item">
              <button
                type="button"
                className={`nav-link tabbar-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Tabbar;