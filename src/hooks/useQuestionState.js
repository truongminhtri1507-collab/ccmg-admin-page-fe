import { useReducer } from 'react';

const generateId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const createEmptyOption = () => ({
  id: generateId('option'),
  label: null,
  text: '',
  isCorrect: false,
});

const createEmptyDraft = () => ({
  id: null,
  type: 'multiple-choice',
  content: '',
  options: [createEmptyOption(), createEmptyOption()],
  hint: '',
  category: 'co-so',
  group: '',
  keywords: [],
  isVerified: false,
});

const initialState = {
  questions: [],
  activeTab: 'add-question',
  editingQuestionId: null,
  draft: createEmptyDraft(),
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };
    case 'SET_DRAFT':
      return {
        ...state,
        draft: action.payload,
      };
    case 'RESET_DRAFT':
      return {
        ...state,
        editingQuestionId: null,
        draft: createEmptyDraft(),
      };
    case 'START_EDIT':
      return {
        ...state,
        editingQuestionId: action.payload.id,
        activeTab: 'add-question',
        draft: {
          ...action.payload,
          options:
            action.payload.type === 'multiple-choice'
              ? action.payload.options.map((option) => ({
                  id: option.id || generateId('option'),
                  label: option.label,
                  text: option.text,
                  isCorrect: Boolean(option.isCorrect),
                }))
              : [],
          category: action.payload.category ?? 'co-so',
          group: action.payload.group ?? '',
          keywords: Array.isArray(action.payload.keywords)
            ? action.payload.keywords.filter((keyword) => typeof keyword === 'string')
            : [],
          isVerified: Boolean(action.payload.isVerified),
        },
      };
    case 'HYDRATE_QUESTIONS':
      return {
        ...state,
        questions: Array.isArray(action.payload) ? action.payload : [],
      };
    case 'SAVE_QUESTION': {
      const questionWithId = {
        ...action.payload,
        id: action.payload.id ?? generateId('question'),
        category: action.payload.category ?? 'co-so',
      };

      const nextQuestions = state.editingQuestionId
        ? state.questions.map((q) => (q.id === state.editingQuestionId ? questionWithId : q))
        : [...state.questions, questionWithId];

      return {
        ...state,
        questions: nextQuestions,
        editingQuestionId: null,
        draft: createEmptyDraft(),
      };
    }
    case 'DELETE_QUESTION': {
      const remainingQuestions = state.questions.filter((q) => q.id !== action.payload);
      const shouldResetDraft = state.editingQuestionId === action.payload;

      return {
        ...state,
        questions: remainingQuestions,
        ...(shouldResetDraft
          ? {
              editingQuestionId: null,
              draft: createEmptyDraft(),
            }
          : {}),
      };
    }
    default:
      return state;
  }
};

const useQuestionState = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    state,
    dispatch,
    helpers: {
      createEmptyOption,
      createEmptyDraft,
      generateId,
    },
  };
};

export default useQuestionState;