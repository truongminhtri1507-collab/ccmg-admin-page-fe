import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QuestionForm from './components/QuestionForm';
import QuestionList from './components/QuestionList';
import QuestionPreview from './components/QuestionPreview';
import Tabbar from './components/Tabbar';
import ExamBuilder from './components/ExamBuilder/ExamBuilder';
import UserManagement from './components/UserManagement/UserManagement';
import LoginPage from './components/LoginPage/LoginPage';
import { useAuth } from './context/AuthContext';
import useQuestionState from './hooks/useQuestionState';
import {
  createOrUpdateQuestion,
  deleteQuestion as deleteQuestionApi,
  listQuestionsByCategory,
} from './services/questionApi';

const App = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const {
    state: { questions, activeTab, draft, editingQuestionId },
    dispatch,
    helpers,
  } = useQuestionState();

  const [isBootstrapping, setBootstrapping] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [busyQuestionIds, setBusyQuestionIds] = useState({ deleting: null });
  const isMountedRef = useRef(true);

  const loadQuestions = useCallback(
    async ({ showSuccessToast = false } = {}) => {
      if (!isMountedRef.current || !isAuthenticated) return;

      setBootstrapping(true);
      try {
        const results = await Promise.allSettled([
          listQuestionsByCategory('co-so'),
          listQuestionsByCategory('chuyen-mon'),
        ]);

        if (!isMountedRef.current) return;

        const aggregated = [];
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            aggregated.push(...result.value);
          } else {
            const category = index === 0 ? 'cơ sở' : 'chuyên môn';
            console.error(`Không thể tải câu hỏi ${category}:`, result.reason);
            toast.error(
              `Không thể tải danh sách câu hỏi ${category}. Vui lòng kiểm tra cấu hình và thử lại.`
            );
          }
        });

        aggregated.sort((a, b) => {
          const aTime = a?.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const bTime = b?.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        });

        dispatch({ type: 'HYDRATE_QUESTIONS', payload: aggregated });

        if (showSuccessToast) {
          toast.success('Đã làm mới danh sách câu hỏi.');
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error(error);
        toast.error(error.message || 'Không thể tải danh sách câu hỏi.');
      } finally {
        if (isMountedRef.current) {
          setBootstrapping(false);
        }
      }
    },
    [dispatch, isAuthenticated]
  );

  useEffect(() => {
    isMountedRef.current = true;
    if (isAuthenticated) {
      loadQuestions();
    } else {
      dispatch({ type: 'HYDRATE_QUESTIONS', payload: [] });
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [dispatch, isAuthenticated, loadQuestions]);

  const previewQuestion = useMemo(() => {
    if (!draft) return null;
    if (!draft.content && draft.type !== 'essay') return null;
    return draft;
  }, [draft]);

  const handleTabChange = (tabId) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tabId });
  };

  const handleSaveQuestion = async (question) => {
    setSaving(true);
    try {
      const persisted = await createOrUpdateQuestion(question);
      dispatch({ type: 'SAVE_QUESTION', payload: persisted });
      toast.success(question.id ? 'Đã cập nhật câu hỏi.' : 'Đã lưu câu hỏi mới.');
      return persisted;
    } catch (error) {
      console.error(error);
      const detailMessage = Array.isArray(error.details) && error.details.length > 0
        ? error.details[0].message
        : null;
      toast.error(detailMessage || error.message || 'Không thể lưu câu hỏi.');
      return null;
    } finally {
      setSaving(false);
    }
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

  const handleDeleteQuestion = async (questionId) => {
    const target = questions.find((question) => question.id === questionId);
    if (!target) return;

    if (target.type === 'essay') {
      toast.info('Chức năng xóa câu hỏi tự luận sẽ được bổ sung sau.');
      return;
    }

    setBusyQuestionIds({ deleting: questionId });
    try {
      await deleteQuestionApi(target.category, questionId);
      dispatch({ type: 'DELETE_QUESTION', payload: questionId });
      toast.success('Đã xóa câu hỏi.');
    } catch (error) {
      console.error(error);
      const detailMessage = Array.isArray(error.details) && error.details.length > 0
        ? error.details[0].message
        : null;
      toast.error(detailMessage || error.message || 'Không thể xóa câu hỏi.');
      throw error;
    } finally {
      setBusyQuestionIds({ deleting: null });
    }
  };

  const handleRefreshQuestions = useCallback(() => {
    if (isBootstrapping) return Promise.resolve();
    return loadQuestions({ showSuccessToast: true });
  }, [isBootstrapping, loadQuestions]);

  const handleCancelEdit = () => {
    dispatch({ type: 'RESET_DRAFT' });
  };

  const handleLogout = () => {
    logout();
    dispatch({ type: 'HYDRATE_QUESTIONS', payload: [] });
    toast.info('Đã đăng xuất.');
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
      </>
    );
  }

  return (
    <div className="app-shell min-vh-100">
      <header className="bg-light border-bottom">
        <div className="container py-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="fw-semibold">Xin chào, {user?.displayName || user?.username || 'Admin'}</span>
            {user?.roles && user.roles.length > 0 && (
              <span className="badge bg-primary-subtle text-primary-emphasis ms-2 text-uppercase">
                {user.roles.join(', ')}
              </span>
            )}
          </div>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>
      <Tabbar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="py-4">
        {(isBootstrapping || isSaving || busyQuestionIds.deleting) && (
          <div className="container mb-3">
            <div className="alert alert-info" role="status">
              {isBootstrapping
                ? 'Đang tải danh sách câu hỏi...'
                : isSaving
                ? 'Đang lưu câu hỏi...'
                : 'Đang xóa câu hỏi...'}
            </div>
          </div>
        )}
        {activeTab === 'question-list' && (
          <QuestionList
            questions={questions}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
            busyQuestionId={busyQuestionIds.deleting}
            onRefresh={handleRefreshQuestions}
            isRefreshing={isBootstrapping}
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
            isSaving={isSaving}
          />
        )}

        {activeTab === 'preview-question' && <QuestionPreview question={previewQuestion} />}

        {activeTab === 'exam-builder' && <ExamBuilder />}

        {activeTab === 'user-management' && <UserManagement />}
      </main>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
    </div>
  );
};

export default App;