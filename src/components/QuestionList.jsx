import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './QuestionList.css';

const formatDateTime = (value) => {
  if (!(value instanceof Date)) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value);
  } catch (error) {
    return value.toLocaleString?.('vi-VN') ?? value.toString();
  }
};

const QuestionListItem = ({ question, index, onEdit, onDelete, onView, busyQuestionId }) => {
  const isBusy = busyQuestionId === question.id;
  const typeLabel = question.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm';
  const categoryLabel = question.category === 'chuyen-mon' ? 'Chuyên môn' : 'Cơ sở';

  return (
    <li className="question-card-item">
      <div className="question-card-item__meta">
        <span className="badge bg-primary-subtle text-primary question-card-item__index">
          #{index + 1}
        </span>
        <span className="badge bg-secondary-subtle text-secondary">{typeLabel}</span>
        <span className="badge bg-light text-secondary border">{categoryLabel}</span>
        {question.type === 'essay' && question.group && (
          <span className="badge bg-info-subtle text-info">Nhóm: {question.group}</span>
        )}
      </div>

      <div className="question-card-item__content">
        <h3 className="question-card-item__title">{question.content || 'Chưa có nội dung'}</h3>

        <div className="question-card-item__details">
          <div className="question-card-item__dates">
            <span className="question-card-item__date-label">Tạo:</span>
            <span>{formatDateTime(question.createdAt)}</span>
            <span className="question-card-item__date-label">Cập nhật:</span>
            <span>{formatDateTime(question.updatedAt)}</span>
          </div>

          {question.type === 'essay' && Array.isArray(question.keywords) && question.keywords.length > 0 && (
            <div className="question-card-item__keywords">
              {question.keywords.map((keyword) => (
                <span key={keyword} className="keyword-chip keyword-chip--compact">
                  {keyword}
                </span>
              ))}
            </div>
          )}

          {question.type === 'multiple-choice' && question.options?.length > 0 && (
            <div className="question-card-item__option-preview">
              {question.options.slice(0, 3).map((option) => (
                <span
                  key={option.id}
                  className={`question-card-item__option ${option.isCorrect ? 'is-correct' : ''}`}
                >
                  {option.text || 'Không có nội dung'}
                </span>
              ))}
              {question.options.length > 3 && (
                <span className="question-card-item__option more">+{question.options.length - 3} lựa chọn</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="question-card-item__actions" role="group">
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => onView(question)}
        >
          Xem câu hỏi
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => onEdit(question.id)}
          disabled={isBusy}
        >
          Chỉnh sửa
        </button>
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={() => onDelete(question.id)}
          disabled={isBusy}
        >
          {isBusy ? 'Đang xóa...' : 'Xóa'}
        </button>
      </div>
    </li>
  );
};

const EmptyState = ({ message }) => (
  <div className="question-list-empty">
    <div className="question-list-empty__card">
      <h3>Không tìm thấy câu hỏi</h3>
      <p>{message}</p>
    </div>
  </div>
);

const QuestionPreviewModal = ({ question, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!question) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [question, onClose]);

  if (!question) return null;

  const isEssay = question.type === 'essay';
  const categoryLabel = question.category === 'chuyen-mon' ? 'Chuyên môn' : 'Cơ sở';

  return (
    <div className="question-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        ref={modalRef}
        className="question-modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="question-modal-card__header">
          <div>
            <span className="badge bg-secondary-subtle text-secondary me-2">
              {isEssay ? 'Tự luận' : 'Trắc nghiệm'}
            </span>
            <span className="badge bg-light text-secondary border">{categoryLabel}</span>
          </div>
          <button type="button" className="question-modal-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        <div className="question-modal-card__body">
          <h4 className="question-modal-title">{question.content}</h4>
          <div className="question-modal-meta">
            <div>
              <span className="question-modal-meta__label">Ngày tạo</span>
              <span>{formatDateTime(question.createdAt)}</span>
            </div>
            <div>
              <span className="question-modal-meta__label">Cập nhật</span>
              <span>{formatDateTime(question.updatedAt)}</span>
            </div>
          </div>

          {isEssay ? (
            <div className="question-modal-essay">
              {question.group && (
                <div>
                  <span className="question-modal-meta__label">Nhóm câu hỏi</span>
                  <p className="mb-0">{question.group}</p>
                </div>
              )}
              <div>
                <span className="question-modal-meta__label">Trạng thái</span>
                <p className="mb-0">{question.isVerified ? 'Đã duyệt' : 'Chưa duyệt'}</p>
              </div>
              {Array.isArray(question.keywords) && question.keywords.length > 0 && (
                <div>
                  <span className="question-modal-meta__label">Từ khóa</span>
                  <div className="question-modal-keywords">
                    {question.keywords.map((keyword) => (
                      <span key={keyword} className="keyword-chip">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="question-modal-meta__label">Gợi ý</span>
                <p className="mb-0">{question.hint || 'Chưa có gợi ý'}</p>
              </div>
            </div>
          ) : (
            <div className="question-modal-options">
              {question.options?.map((option, idx) => (
                <div
                  key={option.id || idx}
                  className={`question-modal-option ${option.isCorrect ? 'is-correct' : ''}`}
                >
                  <span className="question-modal-option__label">Đáp án {idx + 1}</span>
                  <p className="mb-0">{option.text || 'Không có nội dung'}</p>
                  {option.isCorrect && <span className="question-modal-option__badge">Đáp án đúng</span>}
                </div>
              ))}
              {(question.explanation || question.explanationUrl) && (
                <div className="question-modal-extras">
                  {question.explanation && (
                    <div>
                      <span className="question-modal-meta__label">Giải thích</span>
                      <p className="mb-0">{question.explanation}</p>
                    </div>
                  )}
                  {question.explanationUrl && (
                    <div>
                      <span className="question-modal-meta__label">Liên kết tham khảo</span>
                      <a href={question.explanationUrl} target="_blank" rel="noopener noreferrer">
                        {question.explanationUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionList = ({ questions, onEdit, onDelete, onRefresh, busyQuestionId = null, isRefreshing = false }) => {
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((question) => (filterType === 'all' ? true : question.type === filterType))
      .filter((question) => (filterCategory === 'all' ? true : question.category === filterCategory))
      .filter((question) => {
        if (!normalizedSearch) return true;
        const haystacks = [
          question.content,
          question.group,
          question.hint,
          question.explanation,
          question.explanationUrl,
          ...(Array.isArray(question.keywords) ? question.keywords : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystacks.includes(normalizedSearch);
      });
  }, [questions, filterType, filterCategory, normalizedSearch]);

  const handleCloseModal = () => setSelectedQuestion(null);

  const handleRefreshClick = () => {
    if (typeof onRefresh === 'function') {
      onRefresh();
    }
  };

  return (
    <div className="question-list-shell container py-4">
      <div className="question-list-header">
        <div className="question-list-title">
          <h2>Ngân hàng câu hỏi</h2>
          <p className="text-muted mb-0">Quản lý và tìm kiếm câu hỏi trắc nghiệm &amp; tự luận dễ dàng.</p>
        </div>

        <div className="question-list-toolbar">
          <div className="question-list-filters">
            <div className="question-type-filter" role="group" aria-label="Lọc theo loại câu hỏi">
              {[
                { value: 'all', label: 'Tất cả' },
                { value: 'multiple-choice', label: 'Trắc nghiệm' },
                { value: 'essay', label: 'Tự luận' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`question-type-filter__btn ${filterType === option.value ? 'is-active' : ''}`}
                  onClick={() => setFilterType(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="question-type-filter" role="group" aria-label="Lọc theo khối kiến thức">
              {[
                { value: 'all', label: 'Tất cả khối' },
                { value: 'co-so', label: 'Cơ sở' },
                { value: 'chuyen-mon', label: 'Chuyên môn' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`question-type-filter__btn ${filterCategory === option.value ? 'is-active' : ''}`}
                  onClick={() => setFilterCategory(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <label className="question-search" htmlFor="question-search-input">
            <span className="question-search__icon" aria-hidden="true">
              🔍
            </span>
            <input
              id="question-search-input"
              type="search"
              placeholder="Tìm kiếm theo nội dung, nhóm, từ khóa..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="question-refresh-btn"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            aria-label="Làm mới danh sách câu hỏi"
            title="Làm mới"
          >
            <span className="question-refresh-icon" aria-hidden="true">
              ⟳
            </span>
            <span className="question-refresh-text">Làm mới</span>
          </button>
        </div>

      </div>

      {filteredQuestions.length === 0 ? (
        <EmptyState message={normalizedSearch ? 'Hãy thử từ khóa khác hoặc xóa bộ lọc.' : 'Chưa có dữ liệu để hiển thị.'} />
      ) : (
        <ul className="question-card-list">
          {filteredQuestions.map((question, index) => (
            <QuestionListItem
              key={question.id}
              question={question}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={setSelectedQuestion}
              busyQuestionId={busyQuestionId}
            />
          ))}
        </ul>
      )}

      <QuestionPreviewModal question={selectedQuestion} onClose={handleCloseModal} />
    </div>
  );
};

export default QuestionList;