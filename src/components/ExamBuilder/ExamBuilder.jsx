import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  createEssayExam,
  createMultipleChoiceExam,
  updateEssayExam,
  updateMultipleChoiceExam,
  deleteEssayExam,
  deleteMultipleChoiceExam,
  listEssayExams,
  listMultipleChoiceExams,
} from '../../services/examApi';
import { listQuestionsByCategory } from '../../services/questionApi';
import './ExamBuilder.css';

const EXAM_TYPES = [
  {
    id: 'multiple-choice',
    label: 'Bộ đề trắc nghiệm',
    description: 'Chọn câu hỏi trắc nghiệm thuộc khối kiến thức cơ sở hoặc chuyên môn.',
  },
  {
    id: 'essay',
    label: 'Bộ đề tự luận',
    description: 'Tập hợp câu hỏi tự luận để phục vụ các kỳ thi tự luận.',
  },
];

const CATEGORY_OPTIONS = [
  { id: 'co-so', label: 'Khối kiến thức cơ sở' },
  { id: 'chuyen-mon', label: 'Khối kiến thức chuyên môn' },
];

const MAX_QUESTIONS_PER_EXAM = 50;
const MAX_EXAM_NAME_LENGTH = 120;
const RANDOM_PICK_COUNT = MAX_QUESTIONS_PER_EXAM;

const stripHtml = (value) => {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ');
};

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();

const normalizeSearchText = (value) =>
  normalizeWhitespace(stripHtml(value || ''))
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const toExcerpt = (value, maxLength = 160) => {
  const normalized = normalizeWhitespace(stripHtml(value));
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
};

const formatDateTime = (value) => {
  if (!(value instanceof Date)) return '';
  return value.toLocaleString('vi-VN');
};

const ExamBuilder = () => {
  const [examType, setExamType] = useState(EXAM_TYPES[0].id);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].id);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('60');
  const [questionPool, setQuestionPool] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [examList, setExamList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingExam, setEditingExam] = useState(null);
  const [deletingExamId, setDeletingExamId] = useState(null);

  const isMultipleChoice = examType === 'multiple-choice';
  const selectedCount = selectedQuestionIds.length;
  const normalizedSearch = useMemo(() => normalizeSearchText(searchTerm), [searchTerm]);
  const isEditing = Boolean(editingExam);

  const selectedQuestions = useMemo(
    () =>
      selectedQuestionIds
        .map((id) => questionPool.find((question) => question.id === id))
        .filter(Boolean),
    [selectedQuestionIds, questionPool]
  );

  const filteredQuestionPool = useMemo(() => {
    if (!normalizedSearch) return questionPool;

    return questionPool.filter((question) =>
      normalizeSearchText(question.content).includes(normalizedSearch)
    );
  }, [questionPool, normalizedSearch]);

  const visibleQuestionCount = filteredQuestionPool.length;
  const currentExamType = useMemo(
    () => EXAM_TYPES.find((type) => type.id === examType) ?? EXAM_TYPES[0],
    [examType]
  );

  const refreshExamList = async (nextType = examType, nextCategory = category) => {
    try {
      setLoadingExams(true);
      if (nextType === 'multiple-choice') {
        const exams = await listMultipleChoiceExams(nextCategory);
        setExamList(exams);
      } else {
        const exams = await listEssayExams(nextCategory);
        setExamList(exams);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Không thể tải danh sách bộ đề.');
      setExamList([]);
    } finally {
      setLoadingExams(false);
    }
  };

  const refreshQuestionPool = async (nextType = examType, nextCategory = category) => {
    try {
      setLoadingQuestions(true);
      const docs = await listQuestionsByCategory(nextCategory);
      const filtered = docs.filter((question) =>
        nextType === 'multiple-choice'
          ? question.type === 'multiple-choice'
          : question.type === 'essay'
      );
      setQuestionPool(filtered);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Không thể tải danh sách câu hỏi.');
      setQuestionPool([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    refreshQuestionPool(examType, category);
    refreshExamList(examType, category);
  }, [examType, category]);

  const resetFormToDefault = () => {
    setEditingExam(null);
    setName('');
    setDuration('60');
    setSelectedQuestionIds([]);
    setSearchTerm('');
  };

  const handleExamTypeChange = (nextType) => {
    if (examType === nextType) return;
    resetFormToDefault();
    setExamType(nextType);
  };

  const handleCategoryChange = (nextCategory) => {
    if (category === nextCategory) return;
    resetFormToDefault();
    setCategory(nextCategory);
  };

  const handleCancelEditing = () => {
    resetFormToDefault();
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestionIds((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      }

      if (prev.length >= MAX_QUESTIONS_PER_EXAM) {
        toast.error(`Mỗi bộ đề chỉ được chứa tối đa ${MAX_QUESTIONS_PER_EXAM} câu hỏi.`);
        return prev;
      }

      return [...prev, questionId];
    });
  };

  const removeQuestion = (questionId) => {
    setSelectedQuestionIds((prev) => prev.filter((id) => id !== questionId));
  };

  const handleRandomPick = () => {
    const remainingSlots = MAX_QUESTIONS_PER_EXAM - selectedQuestionIds.length;

    if (remainingSlots <= 0) {
      toast.info(`Mỗi bộ đề chỉ được chứa tối đa ${MAX_QUESTIONS_PER_EXAM} câu hỏi.`);
      return;
    }

    const candidatePool = normalizedSearch ? filteredQuestionPool : questionPool;
    const available = candidatePool.filter((question) => !selectedQuestionIds.includes(question.id));

    if (available.length === 0) {
      toast.info('Không còn câu hỏi phù hợp để chọn.');
      return;
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const pickCount = Math.min(RANDOM_PICK_COUNT, available.length, remainingSlots);
    const picked = shuffled.slice(0, pickCount);

    const pickedIds = picked.map((question) => question.id);

    setSelectedQuestionIds((prev) => [...prev, ...pickedIds]);

    toast.success(`Đã thêm ngẫu nhiên ${pickedIds.length} câu hỏi.`);
  };

  const handleClearAll = () => {
    if (selectedQuestionIds.length === 0) {
      return;
    }

    // eslint-disable-next-line no-alert
    if (window.confirm('Bạn có chắc chắn muốn gỡ toàn bộ câu hỏi đã chọn?')) {
      setSelectedQuestionIds([]);
    }
  };

  const beginEditExam = (exam) => {
    if (!exam) return;

    setEditingExam({ ...exam });
    setExamType(exam.type);
    setCategory(exam.category);
    setName(exam.name ?? '');
    setDuration(String(exam.durationMinutes ?? '60'));
    setSelectedQuestionIds(Array.isArray(exam.questions) ? exam.questions : []);
    setSearchTerm('');

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteExam = async (exam) => {
    if (!exam) return;

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa "${exam.name}"?`);
    if (!confirmed) return;

    try {
      setDeletingExamId(exam.id);
      if (exam.type === 'multiple-choice') {
        await deleteMultipleChoiceExam(exam.category, exam.id);
      } else {
        await deleteEssayExam(exam.category, exam.id);
      }

      toast.success('Đã xóa bộ đề.');

      if (editingExam?.id === exam.id) {
        resetFormToDefault();
      }

      await refreshExamList();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Không thể xóa bộ đề.');
    } finally {
      setDeletingExamId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const parsedDuration = Number.parseInt(duration, 10);
    const questionCount = selectedQuestionIds.length;

    if (trimmedName.length < 3) {
      toast.error('Tên bộ đề phải có ít nhất 3 ký tự.');
      return;
    }

    if (trimmedName.length > MAX_EXAM_NAME_LENGTH) {
      toast.error(`Tên bộ đề không được vượt quá ${MAX_EXAM_NAME_LENGTH} ký tự.`);
      return;
    }

    if (!Number.isFinite(parsedDuration) || parsedDuration < 1 || parsedDuration > 1440) {
      toast.error('Thời gian làm bài phải nằm trong khoảng 1 - 1440 phút.');
      return;
    }

    if (isMultipleChoice) {
      if (questionCount !== MAX_QUESTIONS_PER_EXAM) {
        toast.error(`Bộ đề trắc nghiệm phải chứa đủ ${MAX_QUESTIONS_PER_EXAM} câu hỏi.`);
        return;
      }
    } else if (questionCount === 0) {
      toast.error('Vui lòng chọn ít nhất 1 câu hỏi cho bộ đề.');
      return;
    }

    if (questionCount > MAX_QUESTIONS_PER_EXAM) {
      toast.error(`Mỗi bộ đề chỉ được chứa tối đa ${MAX_QUESTIONS_PER_EXAM} câu hỏi.`);
      return;
    }

    const payload = {
      name: trimmedName,
      durationMinutes: parsedDuration,
      category,
      questions: selectedQuestionIds,
    };

    try {
      setSaving(true);
      if (isEditing) {
        if (isMultipleChoice) {
          await updateMultipleChoiceExam(editingExam.id, payload);
        } else {
          await updateEssayExam(editingExam.id, payload);
        }
        toast.success('Đã cập nhật bộ đề thành công.');
      } else if (isMultipleChoice) {
        await createMultipleChoiceExam(payload);
        toast.success('Đã tạo bộ đề trắc nghiệm thành công.');
      } else {
        await createEssayExam(payload);
        toast.success('Đã tạo bộ đề tự luận thành công.');
      }

  resetFormToDefault();
  await refreshExamList();
    } catch (error) {
      console.error(error);
      toast.error(error.message || (isEditing ? 'Không thể cập nhật bộ đề.' : 'Không thể lưu bộ đề.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="exam-builder-wrapper py-5">
      <div className="container exam-builder">
        <form onSubmit={handleSubmit} className="exam-hero">
          <div className="exam-hero__grid">
            <div className="exam-hero__main">
              <span className="exam-hero__eyebrow">Tạo bộ đề</span>
              <h2 className="exam-hero__title">{isEditing ? 'Cập nhật bộ đề' : 'Tạo bộ đề mới'}</h2>
              <p className="exam-hero__description">{currentExamType?.description}</p>
              <div className="exam-toggle-group" role="group" aria-label="Kiểu bộ đề">
                {EXAM_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={`exam-toggle-btn ${examType === type.id ? 'is-active' : ''}`}
                    onClick={() => handleExamTypeChange(type.id)}
                    disabled={isEditing && examType !== type.id}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="exam-hero__side">
              <span className="exam-label text-uppercase">Loại môn</span>
              <div className="exam-chip-group" role="group" aria-label="Chọn danh mục">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`exam-chip ${category === option.id ? 'is-active' : ''}`}
                    onClick={() => handleCategoryChange(option.id)}
                    disabled={isEditing && category !== option.id}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="exam-banner exam-banner--warning" role="status">
              <span>
                Đang chỉnh sửa: <strong>{editingExam?.name}</strong>
              </span>
              <button
                type="button"
                className="exam-banner__action"
                onClick={handleCancelEditing}
                disabled={saving}
              >
                Hủy chỉnh sửa
              </button>
            </div>
          )}

          <div className="exam-hero__form-grid">
            <div className="exam-field">
              <label htmlFor="exam-name" className="exam-label">Tên bộ đề</label>
              <input
                id="exam-name"
                type="text"
                className="exam-input"
                placeholder="Ví dụ: Bộ đề số 1"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={saving}
                maxLength={MAX_EXAM_NAME_LENGTH}
                minLength={3}
                required
              />
            </div>
            <div className="exam-field exam-field--compact">
              <label htmlFor="exam-duration" className="exam-label">Thời gian (phút)</label>
              <input
                id="exam-duration"
                type="number"
                min="1"
                max="1440"
                className="exam-input"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                disabled={saving}
                required
              />
            </div>
            <div className="exam-actions">
              <button
                type="submit"
                className="exam-actions__primary"
                disabled={
                  saving ||
                  (isMultipleChoice
                    ? selectedCount !== MAX_QUESTIONS_PER_EXAM
                    : selectedCount === 0)
                }
              >
                {saving ? 'Đang xử lý...' : isEditing ? 'Cập nhật bộ đề' : 'Lưu bộ đề'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="exam-actions__secondary"
                  onClick={handleCancelEditing}
                  disabled={saving}
                >
                  Hủy
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="exam-content-grid">
          <section className="exam-panel">
            <header className="exam-panel__header">
              <div>
                <h3 className="exam-panel__title">Danh sách câu hỏi</h3>
                <p className="exam-panel__subtitle">
                  Đã tải {questionPool.length} câu hỏi khả dụng.
                  {normalizedSearch && ` Đang hiển thị ${visibleQuestionCount} câu phù hợp.`}
                </p>
              </div>
              <div className="exam-panel__toolbar">
                <div className="exam-search">
                  <input
                    type="text"
                    className="exam-search__input"
                    placeholder="Tìm kiếm theo nội dung câu hỏi..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    disabled={loadingQuestions}
                  />
                </div>
                <button
                  type="button"
                  className="exam-btn exam-btn--outline"
                  onClick={handleRandomPick}
                  disabled={
                    loadingQuestions || saving || questionPool.length === 0 || selectedCount >= MAX_QUESTIONS_PER_EXAM
                  }
                >
                  <span>Chọn nhanh</span>
                  <small>(tối đa {RANDOM_PICK_COUNT} câu)</small>
                </button>
              </div>
            </header>
            <div className="exam-panel__body">
              {loadingQuestions ? (
                <div className="exam-empty">Đang tải câu hỏi...</div>
              ) : filteredQuestionPool.length === 0 ? (
                <div className="exam-empty">Chưa có câu hỏi phù hợp.</div>
              ) : (
                <ul className="exam-question-list">
                  {filteredQuestionPool.map((question, index) => {
                    const isSelected = selectedQuestionIds.includes(question.id);
                    return (
                      <li
                        key={question.id}
                        className={`exam-question-item ${isSelected ? 'is-selected' : ''}`}
                      >
                        <div className="exam-question-item__inner">
                          <input
                            className="exam-question-item__checkbox"
                            type="checkbox"
                            value={question.id}
                            id={`question-${question.id}`}
                            checked={isSelected}
                            onChange={() => toggleQuestionSelection(question.id)}
                            disabled={!isSelected && selectedCount >= MAX_QUESTIONS_PER_EXAM}
                          />
                          <label className="exam-question-item__label" htmlFor={`question-${question.id}`}>
                            <span className="exam-question-item__index">#{index + 1}</span>
                            <span className="exam-question-item__text">{toExcerpt(question.content)}</span>
                          </label>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="exam-panel exam-panel--selected">
            <header className="exam-panel__header">
              <div>
                <h3 className="exam-panel__title">Câu hỏi đã chọn</h3>
                <p className="exam-panel__subtitle">
                  {selectedCount}/{MAX_QUESTIONS_PER_EXAM} câu hỏi đã được thêm.
                  {isMultipleChoice && selectedCount !== MAX_QUESTIONS_PER_EXAM && (
                    <span className="exam-panel__hint">Bộ đề trắc nghiệm cần đủ 50 câu hỏi trước khi lưu.</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                className="exam-btn exam-btn--ghost"
                onClick={handleClearAll}
                disabled={selectedQuestionIds.length === 0}
              >
                Gỡ tất cả
              </button>
            </header>
            <div className="exam-panel__body exam-panel__body--selected">
              {selectedQuestions.length === 0 ? (
                <div className="exam-empty">Chưa có câu hỏi nào được chọn.</div>
              ) : (
                <ul className="exam-selected-list">
                  {selectedQuestions.map((question, index) => (
                    <li key={question.id} className="exam-selected-item">
                      <div className="exam-selected-item__text">
                        <span className="exam-selected-item__index">{index + 1}</span>
                        <span className="exam-selected-item__content">{toExcerpt(question.content, 120)}</span>
                      </div>
                      <button
                        type="button"
                        className="exam-btn exam-btn--chip"
                        onClick={() => removeQuestion(question.id)}
                      >
                        Gỡ
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <section className="exam-panel exam-panel--table">
          <header className="exam-panel__header">
            <div>
              <h3 className="exam-panel__title">Danh sách bộ đề đã tạo</h3>
              <p className="exam-panel__subtitle">
                Hiển thị các bộ đề {isMultipleChoice ? 'trắc nghiệm' : 'tự luận'} thuộc danh mục được chọn.
              </p>
            </div>
            <button
              type="button"
              className="exam-btn exam-btn--outline"
              onClick={() => refreshExamList()}
              disabled={loadingExams || saving || Boolean(deletingExamId)}
            >
              Làm mới danh sách
            </button>
          </header>
          <div className="exam-table-wrapper">
            <table className="exam-table">
              <thead>
                <tr>
                  <th scope="col">Tên bộ đề</th>
                  <th scope="col" className="text-center">Số câu hỏi</th>
                  <th scope="col" className="text-center">Thời gian (phút)</th>
                  <th scope="col">Ngày tạo</th>
                  <th scope="col" className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loadingExams ? (
                  <tr>
                    <td colSpan="5" className="exam-empty-row">Đang tải danh sách bộ đề...</td>
                  </tr>
                ) : examList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="exam-empty-row">Chưa có bộ đề nào.</td>
                  </tr>
                ) : (
                  examList.map((exam) => {
                    const isEditingThisExam = editingExam?.id === exam.id;
                    const isDeletingThisExam = deletingExamId === exam.id;
                    const disableActions = saving || Boolean(deletingExamId) || loadingExams;

                    return (
                      <tr key={exam.id} className={isEditingThisExam ? 'is-active' : undefined}>
                        <td>
                          <div className="exam-table__name">{exam.name}</div>
                          <div className="exam-table__meta">
                            {CATEGORY_OPTIONS.find((option) => option.id === exam.category)?.label ?? exam.category}
                          </div>
                        </td>
                        <td className="text-center fw-semibold">
                          {exam.questionCount ?? exam.questions?.length ?? 0}
                        </td>
                        <td className="text-center">{exam.durationMinutes}</td>
                        <td>
                          <div>{formatDateTime(exam.createdAt)}</div>
                        </td>
                        <td className="text-center">
                          <div className="exam-table__actions">
                            <button
                              type="button"
                              className={`exam-btn exam-btn--ghost ${isEditingThisExam ? 'is-active' : ''}`}
                              onClick={() => beginEditExam(exam)}
                              disabled={disableActions}
                            >
                              {isEditingThisExam && saving ? 'Đang lưu...' : 'Sửa'}
                            </button>
                            <button
                              type="button"
                              className="exam-btn exam-btn--danger"
                              onClick={() => handleDeleteExam(exam)}
                              disabled={disableActions}
                            >
                              {isDeletingThisExam ? 'Đang xóa...' : 'Xóa'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExamBuilder;
