import { apiFetch, handleResponse } from './apiClient';
import { getCourseIdForCategory } from './courseCatalog';

const normalizeCategory = (value) => {
  const normalized = value?.toString().trim();
  if (!normalized) {
    throw new Error('Thiếu thông tin danh mục cho bộ đề.');
  }
  return normalized;
};

const normalizeExamPayload = (payload) => ({
  name: payload.name?.trim() ?? '',
  durationMinutes: Number.parseInt(payload.durationMinutes, 10),
  category: normalizeCategory(payload.category),
  questions: Array.isArray(payload.questions) ? payload.questions : [],
});

const mapTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1e6));
  }
  if (typeof value === 'object' && typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000 + Math.floor((value._nanoseconds ?? 0) / 1e6));
  }
  return null;
};

const mapExamFromApi = (doc, fallback = {}) => ({
  id: doc?.id,
  name: doc?.name ?? fallback.name ?? '',
  category: doc?.category ?? fallback.category ?? '',
  type: doc?.type ?? fallback.type ?? 'multiple-choice',
  durationMinutes: doc?.durationMinutes ?? fallback.durationMinutes ?? 0,
  questions: Array.isArray(doc?.questions) ? doc.questions : Array.isArray(fallback.questions) ? fallback.questions : [],
  questionCount:
    doc?.questionCount ?? (Array.isArray(doc?.questions) ? doc.questions.length : fallback.questionCount ?? 0),
  createdAt: mapTimestamp(doc?.createdAt) ?? fallback.createdAt ?? null,
  updatedAt: mapTimestamp(doc?.updatedAt) ?? fallback.updatedAt ?? null,
});

export const createMultipleChoiceExam = async (payload) => {
  const prepared = normalizeExamPayload(payload);
  const courseId = getCourseIdForCategory(prepared.category);

  const response = await apiFetch(`/api/courses/${courseId}/exams`, {
    method: 'POST',
    body: JSON.stringify(prepared),
  });

  const data = await handleResponse(response);
  return mapExamFromApi(data?.data ?? {}, {
    category: prepared.category,
    type: 'multiple-choice',
  });
};

export const updateMultipleChoiceExam = async (examId, payload) => {
  const prepared = normalizeExamPayload(payload);
  const courseId = getCourseIdForCategory(prepared.category);

  const response = await apiFetch(`/api/courses/${courseId}/exams/${examId}`, {
    method: 'PUT',
    body: JSON.stringify(prepared),
  });

  const data = await handleResponse(response);
  return mapExamFromApi(data?.data ?? {}, {
    category: prepared.category,
    type: 'multiple-choice',
  });
};

export const listMultipleChoiceExams = async (category) => {
  const courseId = getCourseIdForCategory(category);
  const params = new URLSearchParams();
  if (category) {
    params.set('category', category);
  }
  const query = params.toString();
  const response = await apiFetch(query ? `/api/courses/${courseId}/exams?${query}` : `/api/courses/${courseId}/exams`);
  const data = await handleResponse(response);
  const docs = Array.isArray(data?.data) ? data.data : [];
  return docs.map((doc) =>
    mapExamFromApi(doc, {
      category,
      type: 'multiple-choice',
    })
  );
};

export const deleteMultipleChoiceExam = async (category, examId) => {
  const courseId = getCourseIdForCategory(category);
  const response = await apiFetch(`/api/courses/${courseId}/exams/${examId}`, {
    method: 'DELETE',
  });

  await handleResponse(response);
  return true;
};

export const createEssayExam = async (payload) => {
  const prepared = normalizeExamPayload(payload);

  const response = await apiFetch('/api/essay-exams', {
    method: 'POST',
    body: JSON.stringify(prepared),
  });

  const data = await handleResponse(response);
  return mapExamFromApi(data?.data ?? {}, {
    category: prepared.category,
    type: 'essay',
  });
};

export const updateEssayExam = async (examId, payload) => {
  const prepared = normalizeExamPayload(payload);
  const response = await apiFetch(`/api/essay-exams/${prepared.category}/${examId}`, {
    method: 'PUT',
    body: JSON.stringify(prepared),
  });

  const data = await handleResponse(response);
  return mapExamFromApi(data?.data ?? {}, {
    category: prepared.category,
    type: 'essay',
  });
};

export const listEssayExams = async (category) => {
  const params = new URLSearchParams();
  if (category) {
    params.set('category', category);
  }

  const query = params.toString();
  const response = await apiFetch(query ? `/api/essay-exams?${query}` : '/api/essay-exams');
  const data = await handleResponse(response);
  const docs = Array.isArray(data?.data) ? data.data : [];
  return docs.map((doc) =>
    mapExamFromApi(doc, {
      category,
      type: 'essay',
    })
  );
};

export const deleteEssayExam = async (category, examId) => {
  const normalizedCategory = normalizeCategory(category);
  const response = await apiFetch(`/api/essay-exams/${normalizedCategory}/${examId}`, {
    method: 'DELETE',
  });

  await handleResponse(response);
  return true;
};

export default {
  createMultipleChoiceExam,
  updateMultipleChoiceExam,
  listMultipleChoiceExams,
  deleteMultipleChoiceExam,
  createEssayExam,
  listEssayExams,
  updateEssayExam,
  deleteEssayExam,
};
