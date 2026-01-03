import React, { useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import QuestionForm from './components/QuestionForm';
import QuestionList from './components/QuestionList';
import QuestionPreview from './components/QuestionPreview';
import Tabbar from './components/Tabbar';
import useQuestionState from './hooks/useQuestionState';

const App = () => {
  const {
    state: { questions, activeTab, draft, editingQuestionId },
    dispatch,
    helpers,
  } = useQuestionState();

  const previewQuestion = useMemo(() => {
    if (!draft) return null;
    if (!draft.content && draft.type !== 'essay') return null;
    return draft;
  }, [draft]);

  const handleTabChange = (tabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
  };

  const handleSaveQuestion = (question) => {
    dispatch({ type: 'SAVE_QUESTION', payload: question });
  };

  const handleDraftChange = (nextDraft) => {
    dispatch({ type: 'SET_DRAFT', payload: nextDraft });
  };

  const handleEditQuestion = (questionId) => {
    const target = questions.find((q) => q.id === questionId);
    if (target) {
      dispatch({ type: 'START_EDIT', payload: target });
    }
  };

  const handleDeleteQuestion = (questionId) => {
    dispatch({ type: 'DELETE_QUESTION', payload: questionId });
  };

  const handleReorder = (fromIndex, toIndex) => {
    dispatch({ type: 'REORDER_QUESTIONS', payload: { fromIndex, toIndex } });
  };

  const handleCancelEdit = () => {
    dispatch({ type: 'RESET_DRAFT' });
  };

  return (
    <div className="app-shell min-vh-100">
      <Tabbar activeTab={activeTab} onTabChange={handleTabChange} />
  <main className="py-4">
        {activeTab === 'question-list' && (
          <QuestionList
            questions={questions}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
            onReorder={handleReorder}
          />
        )}

        {activeTab === 'add-question' && (
          <QuestionForm
            draft={draft}
            isEditing={Boolean(editingQuestionId)}
            onSave={handleSaveQuestion}
            onDraftChange={handleDraftChange}
            onCancel={handleCancelEdit}
            createEmptyOption={helpers.createEmptyOption}
          />
        )}

        {activeTab === 'preview-question' && <QuestionPreview question={previewQuestion} />}
      </main>
    </div>
  );
};

export default App;