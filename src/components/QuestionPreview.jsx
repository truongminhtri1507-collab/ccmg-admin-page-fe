import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const QuestionPreview = ({ question }) => {
  if (!question || !question.content) {
    return (
      <div className="container py-4">
        <div className="alert alert-info text-center">
          Chưa có câu hỏi nào để xem trước.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Xem trước câu hỏi</h2>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
            <span className="badge bg-secondary">
              {question.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Tự luận'}
            </span>
            <span className="badge bg-light text-secondary border">
              {question.category === 'chuyen-mon' ? 'Chuyên môn' : 'Cơ sở'}
            </span>
          </div>
          <p className="fs-5 mb-4">{question.content}</p>

          {question.type === 'multiple-choice' && (
            <>
              <ul className="list-group list-group-flush">
                {question.options?.map((option) => (
                  <li
                    key={option.id}
                    className={`list-group-item d-flex justify-content-between align-items-center ${
                      option.isCorrect ? 'list-group-item-success' : ''
                    }`}
                  >
                    <span>{option.text}</span>
                    {option.isCorrect && <span className="badge bg-success">Đáp án đúng</span>}
                  </li>
                ))}
              </ul>

              {(question.explanation || question.explanationUrl) && (
                <div className="mt-4 p-4 rounded-4 border border-1" style={{ background: 'rgba(248, 250, 252, 0.9)' }}>
                  <h6 className="fw-semibold text-secondary text-uppercase mb-3" style={{ letterSpacing: '0.05em' }}>
                    Thông tin bổ sung
                  </h6>
                  <div className="d-flex flex-column gap-3">
                    {question.explanation && (
                      <div>
                        <span className="d-block text-muted small text-uppercase mb-1">Giải thích câu hỏi</span>
                        <p className="mb-0 text-body-secondary">{question.explanation}</p>
                      </div>
                    )}
                    {question.explanationUrl && (
                      <div>
                        <span className="d-block text-muted small text-uppercase mb-1">Liên kết giải thích</span>
                        <a
                          href={question.explanationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-primary text-break"
                        >
                          {question.explanationUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {question.type === 'essay' && (
            <div className="mt-4 d-flex flex-column gap-3">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {question.group && (
                  <span className="badge bg-primary-subtle text-primary fw-semibold px-3 py-2 rounded-pill">
                    Nhóm: {question.group}
                  </span>
                )}
                <span
                  className={`badge px-3 py-2 rounded-pill ${
                    question.isVerified ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                  }`}
                >
                  {question.isVerified ? 'Đã duyệt' : 'Chưa duyệt'}
                </span>
              </div>

              {Array.isArray(question.keywords) && question.keywords.length > 0 && (
                <div className="d-flex flex-column gap-2">
                  <span className="text-muted small text-uppercase fw-semibold">Từ khóa</span>
                  <div className="d-flex flex-wrap gap-2">
                    {question.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="badge bg-light text-secondary border rounded-pill px-3 py-2"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="alert alert-secondary mb-0">
                <strong>Gợi ý:</strong> {question.hint || 'Không có'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionPreview;