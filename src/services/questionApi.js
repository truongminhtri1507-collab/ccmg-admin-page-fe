import { apiFetch, handleResponse } from './apiClient';
import { getCourseIdForCategory } from './courseCatalog';

const letterFromIndex = (index) => String.fromCharCode(65 + index);

const convertTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1e6));
  }
  if (typeof value === 'object' && typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000 + Math.floor((value._nanoseconds ?? 0) / 1e6));
  }
  return null;
};

const mapQuestionFromApi = (doc, category) => {
  const answers = doc?.answers ?? {};
  const correctIndex = Number.parseInt(doc?.correctIndex ?? '-1', 10);
  const options = Object.entries(answers)
    .sort(([labelA], [labelB]) => labelA.localeCompare(labelB))
    .map(([label, text], index) => ({
      id: `${doc.id || 'question'}-option-${label}`,
      label,
      text,
      isCorrect: index === correctIndex,
    }));

  return {
    id: doc.id,
    type: 'multiple-choice',
    content: doc.content ?? '',
    options,
    explanation: doc.explanation ?? '',
    explanationUrl: doc.youtubeUrl ?? '',
    hint: '',
    category,
    createdAt: convertTimestamp(doc.createdAt ?? doc.created_at),
    updatedAt: convertTimestamp(doc.updatedAt ?? doc.updated_at),
  };
};

const mapEssayFromApi = (doc, fallbackCategory) => ({
  id: doc?.id,
  type: 'essay',
  content: doc?.content ?? '',
  hint: doc?.hint ?? '',
  category: doc?.category ?? fallbackCategory ?? 'co-so',
  group: doc?.group ?? '',
  keywords: Array.isArray(doc?.keywords)
    ? doc.keywords.filter((keyword) => typeof keyword === 'string' && keyword.trim().length > 0)
    : [],
  isVerified: Boolean(doc?.isVerified),
  createdAt: convertTimestamp(doc?.createdAt ?? doc?.created_at),
  updatedAt: convertTimestamp(doc?.updatedAt ?? doc?.updated_at),
});

const buildMultipleChoicePayload = (question) => {
  const options = question.options ?? [];
  const answers = options.map((option, index) => ({
    label: option.label || letterFromIndex(index),
    text: option.text?.trim() ?? '',
  }));

  const correctIndex = options.findIndex((option) => option.isCorrect);
  const correctLabel =
    correctIndex >= 0 && answers[correctIndex] ? answers[correctIndex].label : undefined;

  return {
    id: question.id ?? undefined,
    content: question.content?.trim() ?? '',
    answers,
    correctIndex: correctIndex >= 0 ? String(correctIndex) : undefined,
    correctLabel,
    explanation: question.explanation?.trim() ?? '',
    youtubeUrl: question.explanationUrl?.trim() ?? '',
  };
};

const buildEssayPayload = (question) => {
  const rawKeywords = Array.isArray(question.keywords) ? question.keywords : [];
  const normalizedKeywords = [];
  const seen = new Set();

  rawKeywords
    .map((keyword) => keyword?.trim?.() ?? '')
    .filter((keyword) => keyword.length > 0)
    .forEach((keyword) => {
      const dedupKey = keyword.toLowerCase();
      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        normalizedKeywords.push(keyword);
      }
    });

  return {
    id: question.id ?? undefined,
    content: question.content?.trim() ?? '',
    group: question.group?.trim() ?? '',
    category: question.category ?? '',
    keywords: normalizedKeywords,
    isVerified: Boolean(question.isVerified),
    hint: question.hint?.trim?.() ? question.hint.trim() : undefined,
  };
};

const fetchMultipleChoiceQuestions = async (category) => {
  const courseId = getCourseIdForCategory(category);
  const response = await apiFetch(`/api/courses/${courseId}/questions`);
  const payload = await handleResponse(response);
  const docs = Array.isArray(payload?.data) ? payload.data : [];
  return docs.map((doc) => mapQuestionFromApi(doc, category));
};

const fetchEssayQuestions = async (category) => {
  const params = new URLSearchParams();
  if (category) {
    params.set('category', category);
  }
  const queryString = params.toString();
  const response = await apiFetch(queryString ? `/api/essays?${queryString}` : '/api/essays');
  const payload = await handleResponse(response);
  const docs = Array.isArray(payload?.data) ? payload.data : [];
  return docs.map((doc) => mapEssayFromApi(doc, category));
};

export const listQuestionsByCategory = async (category) => {
  const aggregated = [];
  const results = await Promise.allSettled([
    fetchMultipleChoiceQuestions(category),
    fetchEssayQuestions(category),
  ]);

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      aggregated.push(...result.value);
    } else {
      const typeLabel = index === 0 ? 'trắc nghiệm' : 'tự luận';
      console.error(`Không thể tải câu hỏi ${typeLabel} cho category ${category}:`, result.reason);
    }
  });

  aggregated.sort((a, b) => {
    const aTime = a?.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const bTime = b?.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return bTime - aTime;
  });

  return aggregated;
};

export const createOrUpdateQuestion = async (question) => {
  if (question.type === 'essay') {
    const body = buildEssayPayload(question);
    const response = await apiFetch('/api/essays', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const payload = await handleResponse(response);
    return mapEssayFromApi(payload?.data ?? {}, question.category);
  }

  const courseId = getCourseIdForCategory(question.category);
  const body = buildMultipleChoicePayload(question);
  const response = await apiFetch(`/api/courses/${courseId}/questions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  const payload = await handleResponse(response);
  return mapQuestionFromApi(payload?.data ?? {}, question.category);
};

export const deleteQuestion = async (category, questionId) => {
  const courseId = getCourseIdForCategory(category);
  const response = await apiFetch(`/api/courses/${courseId}/questions/${questionId}`, {
    method: 'DELETE',
  });

  await handleResponse(response);
  return true;
};

export default {
  listQuestionsByCategory,
  createOrUpdateQuestion,
  deleteQuestion,
};
