import React, { useMemo, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'bootstrap/dist/css/bootstrap.min.css';

const ItemTypes = {
  QUESTION: 'QUESTION',
};

const QuestionListItem = ({ question, index, moveQuestion, onEdit, onDelete }) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ItemTypes.QUESTION,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveQuestion(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.QUESTION,
    item: { id: question.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <li
      ref={ref}
      className={`list-group-item d-flex justify-content-between align-items-start ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div>
        <div className="mb-1">
          <span className="badge bg-primary me-2">#{index + 1}</span>
          <span className="fw-semibold">{question.content || 'Chưa có nội dung'}</span>
        </div>
        <div className="text-muted small d-flex gap-2 align-items-center">
          <span>{question.type === 'multiple-choice' ? 'Trắc nghiệm' : 'Tự luận'}</span>
          <span className="badge bg-light text-secondary border">
            {question.category === 'chuyen-mon' ? 'Chuyên môn' : 'Cơ sở'}
          </span>
        </div>
      </div>
      <div className="btn-group" role="group">
        <button className="btn btn-outline-secondary" onClick={() => onEdit(question.id)}>
          Chỉnh sửa
        </button>
        <button className="btn btn-outline-danger" onClick={() => onDelete(question.id)}>
          Xóa
        </button>
      </div>
    </li>
  );
};

const EmptyState = () => (
  <div className="alert alert-light border text-center py-5">
    <p className="mb-1 fw-semibold">Chưa có câu hỏi nào</p>
    <p className="mb-0 text-muted">Hãy chuyển sang tab "Thêm câu hỏi" để bắt đầu.</p>
  </div>
);

const QuestionList = ({ questions, onEdit, onDelete, onReorder }) => {
  const moveQuestion = useMemo(
    () =>
      (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        onReorder(fromIndex, toIndex);
      },
    [onReorder]
  );

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Danh sách câu hỏi</h2>
      {questions.length === 0 ? (
        <EmptyState />
      ) : (
        <DndProvider backend={HTML5Backend}>
          <ul className="list-group gap-2">
            {questions.map((question, index) => (
              <QuestionListItem
                key={question.id}
                question={question}
                index={index}
                moveQuestion={moveQuestion}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </DndProvider>
      )}
    </div>
  );
};

export default QuestionList;