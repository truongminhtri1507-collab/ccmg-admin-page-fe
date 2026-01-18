import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'bootstrap/dist/css/bootstrap.min.css';
import './QuestionForm.css';

const OptionItemTypes = {
  OPTION: 'OPTION',
};

const MIN_OPTIONS_COUNT = 2;
const MAX_OPTIONS_COUNT = 10;

const OptionRow = ({
  index,
  control,
  isCorrect,
  onMarkCorrect,
  onRemove,
  moveOption,
  onTextChange,
  isDisabled,
  canRemove,
}) => {
  const ref = useRef(null);
  const dragHandleRef = useRef(null);

  const [, drop] = useDrop({
    accept: OptionItemTypes.OPTION,
    hover(item, monitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveOption(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: OptionItemTypes.OPTION,
    item: () => ({ index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drop(ref);
  preview(ref);
  drag(dragHandleRef);

  return (
    <div ref={ref} className={`question-option-item ${isDragging ? 'dragging' : ''}`}>
      <span
        ref={dragHandleRef}
        className="option-drag-handle"
        role="button"
        tabIndex={0}
        aria-label={`Kéo để sắp xếp tùy chọn ${index + 1}`}
      >
        <span className="option-drag-dot" aria-hidden="true" />
        <span className="option-drag-dot" aria-hidden="true" />
      </span>
      <div className="option-radio">
        <input
          className="form-check-input"
          type="radio"
          name="correctOption"
          checked={isCorrect}
          onChange={() => onMarkCorrect(index)}
          disabled={isDisabled}
        />
      </div>
      <div className="option-input flex-grow-1">
        <Controller
          name={`options.${index}.text`}
          control={control}
          render={({ field, fieldState }) => (
            <>
              <input
                {...field}
                onChange={(event) => {
                  field.onChange(event);
                  if (typeof onTextChange === 'function') {
                    onTextChange(index, event.target.value);
                  }
                }}
                className={`form-control option-text ${fieldState.error ? 'is-invalid' : ''}`}
                placeholder={`Tùy chọn ${index + 1}`}
                disabled={isDisabled}
              />
              {fieldState.error && (
                <div className="invalid-feedback d-block option-error-message">
                  {fieldState.error.message}
                </div>
              )}
            </>
          )}
        />
      </div>
      <button
        type="button"
        className="option-remove-btn"
        onClick={() => onRemove(index)}
        disabled={isDisabled || !canRemove}
        aria-label={`Xóa tùy chọn ${index + 1}`}
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
};

const QuestionForm = ({
  draft,
  createEmptyOption,
  onSave,
  onDraftChange,
  isEditing,
  onCancel,
  isSaving = false,
}) => {
  const titleRef = useRef(null);
  const toolbarRef = useRef(null);
  const keywordInputRef = useRef(null);
  const optionsSectionRef = useRef(null);
  const optionsErrorRef = useRef(null);
  const categorySectionRef = useRef(null);
  const categoryFirstOptionRef = useRef(null);
  const highlightTimeoutsRef = useRef(new Map());
  const lastCategoryErrorRef = useRef(null);
  const [isToolbarVisible, setToolbarVisible] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    link: false,
  });
  const [submitError, setSubmitError] = useState(null);
  const [keywordDraft, setKeywordDraft] = useState('');
  const contentCacheRef = useRef({ 'multiple-choice': '', essay: '' });
  const categoryCacheRef = useRef({ 'multiple-choice': '', essay: '' });
  const lastContentTypeRef = useRef(draft?.type ?? 'multiple-choice');
  const lastCategoryTypeRef = useRef(draft?.type ?? 'multiple-choice');

  const adjustTitleHeight = useCallback(() => {
    const textarea = titleRef.current;
    if (!textarea) return;

    const minHeight = 34;
    textarea.style.height = 'auto';
    const nextHeight = Math.max(textarea.scrollHeight, minHeight);
    textarea.style.height = `${nextHeight}px`;
  }, []);

  const buildFormValuesFromDraft = useCallback(
    (sourceDraft) => {
      if (!sourceDraft) {
        return {
          type: 'multiple-choice',
          content: '',
          options: [createEmptyOption(), createEmptyOption()],
          hint: '',
          category: '',
          group: '',
          keywords: [],
          isVerified: false,
          explanation: '',
          explanationUrl: '',
        };
      }

      const isMultipleChoice = (sourceDraft.type ?? 'multiple-choice') === 'multiple-choice';
      return {
        type: sourceDraft.type ?? 'multiple-choice',
        content: sourceDraft.content ?? '',
        options: isMultipleChoice
          ? (sourceDraft.options && sourceDraft.options.length > 0
              ? sourceDraft.options.map((option) => ({
                  id: option.id || createEmptyOption().id,
                  label: option.label ?? null,
                  text: option.text ?? '',
                  isCorrect: Boolean(option.isCorrect),
                }))
              : [createEmptyOption(), createEmptyOption()])
          : [],
        hint: sourceDraft.hint ?? '',
        category: sourceDraft.category ?? '',
        group: sourceDraft.group ?? '',
        keywords: Array.isArray(sourceDraft.keywords)
          ? sourceDraft.keywords.filter((keyword) => typeof keyword === 'string')
          : [],
        isVerified: Boolean(sourceDraft.isVerified),
        explanation: isMultipleChoice ? sourceDraft.explanation ?? '' : '',
        explanationUrl: isMultipleChoice ? sourceDraft.explanationUrl ?? '' : '',
      };
    },
    [createEmptyOption]
  );

  const defaultValues = useMemo(() => buildFormValuesFromDraft(draft), [draft, buildFormValuesFromDraft]);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    clearErrors,
    setFocus,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'options',
  });

  const questionType = watch('type');
  const categoryValue = watch('category');
  const watchedValues = watch();
  const watchedOptions = watch('options') ?? [];
  const keywordsValue = watch('keywords') ?? [];
  const contentValue = watch('content');
  const minContentLength = questionType === 'essay' ? 10 : 5;

  const skipResetRef = useRef(false);
  const lastSerializedDraftRef = useRef(null);

  useEffect(() => {
    if (skipResetRef.current) {
      skipResetRef.current = false;
      return;
    }

    reset(buildFormValuesFromDraft(draft));
    const initialType = draft?.type ?? 'multiple-choice';
    const initialContent = draft?.content ?? '';
    const initialCategory = draft?.category ?? '';
    contentCacheRef.current = {
      'multiple-choice': initialType === 'multiple-choice' ? initialContent : '',
      essay: initialType === 'essay' ? initialContent : '',
    };
    categoryCacheRef.current = {
      'multiple-choice': initialType === 'multiple-choice' ? initialCategory : '',
      essay: initialType === 'essay' ? initialCategory : '',
    };
    lastContentTypeRef.current = initialType;
    lastCategoryTypeRef.current = initialType;
    if (!isEditing) {
      setValue('category', '', { shouldDirty: false, shouldValidate: false });
      clearErrors('category');
    }
  }, [draft, reset, buildFormValuesFromDraft, isEditing, setValue, clearErrors]);

  useEffect(() => {
    if (!isSaving) {
      setSubmitError(null);
    }
  }, [isSaving]);

  useEffect(() => {
    setSubmitError(null);
  }, [draft?.id, isEditing]);

  useEffect(() => () => {
    highlightTimeoutsRef.current.forEach((timeoutId, element) => {
      clearTimeout(timeoutId);
      if (element && element.classList) {
        element.classList.remove('scroll-highlight');
      }
    });
    highlightTimeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!onDraftChange) return;

    const transformed = {
      ...draft,
      ...watchedValues,
      options:
        watchedValues.type === 'multiple-choice'
          ? watchedOptions.map((option, index) => ({
              ...option,
              id: option.id ?? draft?.options?.[index]?.id ?? `option-${index}`,
            }))
          : [],
      hint: watchedValues.type === 'essay' ? watchedValues.hint : '',
      category: watchedValues.category ?? draft?.category ?? '',
      group: watchedValues.type === 'essay' ? watchedValues.group ?? draft?.group ?? '' : draft?.group ?? '',
      keywords:
        watchedValues.type === 'essay'
          ? (Array.isArray(watchedValues.keywords)
              ? watchedValues.keywords.filter((keyword) => typeof keyword === 'string' && keyword.trim().length > 0)
              : [])
          : [],
      isVerified:
        watchedValues.type === 'essay' ? Boolean(watchedValues.isVerified ?? draft?.isVerified) : false,
      explanation:
        watchedValues.type === 'multiple-choice'
          ? watchedValues.explanation ?? draft?.explanation ?? ''
          : '',
      explanationUrl:
        watchedValues.type === 'multiple-choice'
          ? watchedValues.explanationUrl ?? draft?.explanationUrl ?? ''
          : '',
    };

    const serialized = JSON.stringify(transformed);
    if (lastSerializedDraftRef.current === serialized) {
      return;
    }

    lastSerializedDraftRef.current = serialized;
    skipResetRef.current = true;
    onDraftChange(transformed);
  }, [watchedValues, watchedOptions, onDraftChange, draft]);

  useEffect(() => {
    const activeType = questionType ?? 'multiple-choice';
    const previousType = lastContentTypeRef.current ?? activeType;

    if (activeType !== previousType) {
      lastContentTypeRef.current = activeType;
      return;
    }

    contentCacheRef.current = {
      ...contentCacheRef.current,
      [activeType]: contentValue ?? '',
    };
  }, [contentValue, questionType]);

  useLayoutEffect(() => {
    adjustTitleHeight();
  }, [adjustTitleHeight, watchedValues.content]);

  useEffect(() => {
    const activeType = questionType ?? 'multiple-choice';
    const previousType = lastCategoryTypeRef.current ?? activeType;

    if (activeType !== previousType) {
      lastCategoryTypeRef.current = activeType;
      return;
    }

    categoryCacheRef.current = {
      ...categoryCacheRef.current,
      [activeType]: categoryValue ?? '',
    };
  }, [categoryValue, questionType]);

  useEffect(() => {
    if (questionType !== 'multiple-choice') {
      setToolbarVisible(false);
      setActiveFormats({ bold: false, italic: false, underline: false, link: false });
    }
  }, [questionType]);

  useEffect(() => {
    if (questionType) {
      clearErrors('type');
    }
  }, [questionType, clearErrors]);

  useEffect(() => {
    if (categoryValue) {
      clearErrors('category');
    }
  }, [categoryValue, clearErrors]);

  useEffect(() => {
    if ((keywordsValue ?? []).length > 0) {
      clearErrors('keywords');
    }
  }, [keywordsValue, clearErrors]);

  const prevQuestionTypeRef = useRef(questionType);

  useEffect(() => {
    const prevType = prevQuestionTypeRef.current;

    if (!questionType) {
      return;
    }

    const currentValues = getValues();
    if (prevType) {
      contentCacheRef.current = {
        ...contentCacheRef.current,
        [prevType]: currentValues.content ?? contentCacheRef.current[prevType] ?? '',
      };
      categoryCacheRef.current = {
        ...categoryCacheRef.current,
        [prevType]: currentValues.category ?? categoryCacheRef.current[prevType] ?? '',
      };
    }

    const cachedContent = contentCacheRef.current[questionType] ?? '';
    const cachedCategory = categoryCacheRef.current[questionType] ?? '';

    if (questionType === 'multiple-choice' && prevType !== 'multiple-choice') {
      const currentOptions = currentValues.options ?? [];
      const nextOptions =
        currentOptions && currentOptions.length > 0
          ? currentOptions
          : [createEmptyOption(), createEmptyOption()];

      reset({
        ...currentValues,
        type: 'multiple-choice',
        options: nextOptions,
        explanation: currentValues.explanation ?? '',
        explanationUrl: currentValues.explanationUrl ?? '',
        content: cachedContent,
        category: cachedCategory,
      });
      clearErrors(['content', 'category']);
    }

    if (questionType === 'essay' && prevType !== 'essay') {
      clearErrors('options');
      if (currentValues.explanation) {
        setValue('explanation', '', { shouldDirty: false, shouldValidate: false });
      }
      if (currentValues.explanationUrl) {
        setValue('explanationUrl', '', { shouldDirty: false, shouldValidate: false });
      }
      if (!Array.isArray(currentValues.keywords)) {
        setValue('keywords', [], { shouldDirty: false, shouldValidate: false });
      }
      if (typeof currentValues.group !== 'string') {
        setValue('group', '', { shouldDirty: false, shouldValidate: false });
      }
      setKeywordDraft('');
      clearErrors(['keywords', 'group']);
      setValue('content', cachedContent, { shouldDirty: false, shouldValidate: false });
      setValue('category', cachedCategory, { shouldDirty: false, shouldValidate: false });
      clearErrors(['content', 'category']);
    }

    prevQuestionTypeRef.current = questionType;
  }, [questionType, getValues, reset, createEmptyOption, clearErrors, setValue]);

  const handleToggleFormat = (formatKey) => {
    setActiveFormats((prev) => ({
      ...prev,
      [formatKey]: !prev[formatKey],
    }));
  };

  const scrollIntoViewWithHighlight = useCallback((elementToHighlight, focusElement) => {
    const highlightElement = elementToHighlight ?? focusElement;
    const focusTarget = focusElement ?? highlightElement;

    if (!highlightElement && !focusTarget) {
      return;
    }

    requestAnimationFrame(() => {
      const scrollTarget = highlightElement ?? focusTarget;
      if (scrollTarget && typeof scrollTarget.scrollIntoView === 'function') {
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (focusTarget && typeof focusTarget.focus === 'function') {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch {
          focusTarget.focus();
        }
      }

      if (highlightElement && highlightElement.classList) {
        const existingTimeout = highlightTimeoutsRef.current.get(highlightElement);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        highlightElement.classList.add('scroll-highlight');
        const timeoutId = setTimeout(() => {
          highlightElement.classList.remove('scroll-highlight');
          highlightTimeoutsRef.current.delete(highlightElement);
        }, 1200);
        highlightTimeoutsRef.current.set(highlightElement, timeoutId);
      }
    });
  }, []);

  const scrollOptionsErrorIntoView = useCallback(() => {
    const containerElement = optionsSectionRef.current;
    const errorElement = optionsErrorRef.current;
    scrollIntoViewWithHighlight(containerElement ?? errorElement ?? null, errorElement ?? containerElement ?? null);
  }, [scrollIntoViewWithHighlight]);

  useEffect(() => {
    const message = errors.category?.message ?? null;
    if (message && lastCategoryErrorRef.current !== message) {
      scrollIntoViewWithHighlight(categorySectionRef.current, categoryFirstOptionRef.current);
    }
    lastCategoryErrorRef.current = message;
  }, [errors.category, scrollIntoViewWithHighlight]);

  const handleAddOption = () => {
    if (fields.length >= MAX_OPTIONS_COUNT) {
      setError('options', {
        type: 'manual',
        message: `Tối đa ${MAX_OPTIONS_COUNT} lựa chọn cho một câu hỏi trắc nghiệm.`,
      });
      scrollOptionsErrorIntoView();
      return;
    }

    clearErrors('options');
    append(createEmptyOption());
  };

  const handleRemoveOption = (index) => {
    if (fields.length <= MIN_OPTIONS_COUNT) {
      setError('options', {
        type: 'manual',
        message: `Cần ít nhất ${MIN_OPTIONS_COUNT} lựa chọn hợp lệ.`,
      });
      scrollOptionsErrorIntoView();
      return;
    }

    remove(index);
    clearErrors(['options', `options.${index}.text`]);
  };

  const handleMoveOption = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      move(fromIndex, toIndex);
    },
    [move]
  );

  const handleOptionTextChange = useCallback(
    (optionIndex, nextValue) => {
      if (nextValue.trim().length > 0) {
        clearErrors(`options.${optionIndex}.text`);
      }
    },
    [clearErrors]
  );

  const handleMarkCorrect = (selectedIndex) => {
    const currentOptions = watch('options');
    const updated = currentOptions.map((option, index) => ({
      ...option,
      isCorrect: index === selectedIndex,
    }));
    setValue('options', updated, { shouldValidate: true, shouldDirty: true });
    clearErrors('options');
  };

  const handleKeywordCommit = useCallback(
    (rawValue) => {
      const normalized = (rawValue ?? '').trim().replace(/\s+/g, ' ');
      if (normalized.length === 0) {
        setKeywordDraft('');
        return;
      }

      if (keywordsValue.length >= 20) {
        setError('keywords', {
          type: 'manual',
          message: 'Tối đa 20 từ khóa cho mỗi câu hỏi.',
        });
        return;
      }

      const isDuplicate = keywordsValue.some(
        (keyword) => keyword.toLowerCase() === normalized.toLowerCase()
      );
      if (isDuplicate) {
        setKeywordDraft('');
        return;
      }

      const nextKeywords = [...keywordsValue, normalized];
      setValue('keywords', nextKeywords, { shouldDirty: true, shouldValidate: true });
      clearErrors('keywords');
      setKeywordDraft('');
      requestAnimationFrame(() => {
        if (keywordInputRef.current) {
          keywordInputRef.current.focus();
        }
      });
    },
    [keywordsValue, setValue, clearErrors, setError]
  );

  const handleKeywordSubmit = useCallback(() => {
    handleKeywordCommit(keywordDraft);
  }, [handleKeywordCommit, keywordDraft]);

  const handleKeywordRemove = useCallback(
    (index) => {
      const nextKeywords = keywordsValue.filter((_, keywordIndex) => keywordIndex !== index);
      setValue('keywords', nextKeywords, { shouldDirty: true, shouldValidate: true });
      if (nextKeywords.length === 0) {
        setError('keywords', {
          type: 'manual',
          message: 'Vui lòng thêm ít nhất một từ khóa.',
        });
      }
      requestAnimationFrame(() => {
        keywordInputRef.current?.focus();
      });
    },
    [keywordsValue, setValue, setError]
  );

  const handleKeywordKeyDown = useCallback(
    (event) => {
      if (['Enter', 'Tab', ','].includes(event.key)) {
        event.preventDefault();
        handleKeywordCommit(keywordDraft);
      } else if (event.key === 'Backspace' && keywordDraft.length === 0 && keywordsValue.length > 0) {
        event.preventDefault();
        handleKeywordRemove(keywordsValue.length - 1);
      }
    },
    [handleKeywordCommit, handleKeywordRemove, keywordDraft, keywordsValue]
  );

  const handleKeywordBlur = useCallback(() => {
    if (keywordDraft.trim().length > 0) {
      handleKeywordCommit(keywordDraft);
    }
  }, [handleKeywordCommit, keywordDraft]);

  const onSubmit = async (values) => {
    setSubmitError(null);
    if (!values.type) {
      setError('type', {
        type: 'manual',
        message: 'Vui lòng chọn kiểu câu hỏi.',
      });
      return;
    }

    clearErrors('type');

    if (!values.category) {
      setError('category', {
        type: 'manual',
        message: 'Vui lòng chọn lĩnh vực câu hỏi.',
      });
      scrollIntoViewWithHighlight(categorySectionRef.current, categoryFirstOptionRef.current);
      return;
    }

    clearErrors('category');

    if (values.type === 'multiple-choice') {
      const normalizedOptions = (values.options ?? []).map((option) => ({
        ...option,
        text: option.text?.trim() ?? '',
      }));

      const optionFieldPaths = normalizedOptions.map((_, index) => `options.${index}.text`);
      clearErrors(['options', ...optionFieldPaths]);

      const emptyOptionIndexes = normalizedOptions
        .map((option, index) => (option.text.length === 0 ? index : null))
        .filter((index) => index !== null);

      if (emptyOptionIndexes.length > 0) {
        emptyOptionIndexes.forEach((index) => {
          setError(`options.${index}.text`, {
            type: 'manual',
            message: 'Vui lòng nhập nội dung cho tùy chọn này.',
          });
        });
        if (typeof setFocus === 'function') {
          setFocus(`options.${emptyOptionIndexes[0]}.text`);
        }
        return;
      }

      if (normalizedOptions.length < MIN_OPTIONS_COUNT) {
        setError('options', {
          type: 'manual',
          message: `Cần ít nhất ${MIN_OPTIONS_COUNT} lựa chọn hợp lệ.`,
        });
        scrollOptionsErrorIntoView();
        return;
      }

      if (normalizedOptions.length > MAX_OPTIONS_COUNT) {
        setError('options', {
          type: 'manual',
          message: `Không được vượt quá ${MAX_OPTIONS_COUNT} lựa chọn cho một câu hỏi.`,
        });
        scrollOptionsErrorIntoView();
        return;
      }

      if (!normalizedOptions.some((option) => option.isCorrect)) {
        setError('options', {
          type: 'manual',
          message: 'Chọn ít nhất một đáp án đúng.',
        });
        scrollOptionsErrorIntoView();
        return;
      }

      values.options = normalizedOptions;
      values.explanation = values.explanation?.trim() ?? '';
      values.explanationUrl = values.explanationUrl?.trim() ?? '';
    } else {
      clearErrors('options');
      values.explanation = '';
      values.explanationUrl = '';

      const trimmedGroup = values.group?.trim?.() ?? '';
      if (trimmedGroup.length === 0) {
        setError('group', {
          type: 'manual',
          message: 'Vui lòng nhập nhóm câu hỏi.',
        });
        if (typeof setFocus === 'function') {
          setFocus('group');
        }
        return;
      }

      const normalizedKeywords = Array.isArray(values.keywords)
        ? values.keywords
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0)
        : [];

      if (normalizedKeywords.length === 0) {
        setError('keywords', {
          type: 'manual',
          message: 'Vui lòng thêm ít nhất một từ khóa.',
        });
        requestAnimationFrame(() => {
          keywordInputRef.current?.focus();
        });
        return;
      }

      if (normalizedKeywords.length > 20) {
        setError('keywords', {
          type: 'manual',
          message: 'Tối đa 20 từ khóa cho một câu hỏi.',
        });
        return;
      }

      values.group = trimmedGroup;
      values.keywords = normalizedKeywords;
      values.hint = values.hint?.trim() ?? '';
      values.isVerified = Boolean(values.isVerified);
    }

    const questionPayload = {
      ...draft,
      ...values,
      id: draft?.id ?? null,
      options: values.type === 'multiple-choice' ? values.options : [],
      hint: values.type === 'essay' ? values.hint : '',
      category: values.category ?? '',
  group: values.type === 'essay' ? values.group : '',
      keywords: values.type === 'essay' ? values.keywords : [],
      isVerified: values.type === 'essay' ? Boolean(values.isVerified) : false,
      explanation: values.type === 'multiple-choice' ? (values.explanation ?? '') : '',
      explanationUrl: values.type === 'multiple-choice' ? (values.explanationUrl ?? '') : '',
    };

    try {
      await onSave(questionPayload);
    } catch (error) {
      const detailMessage = Array.isArray(error.details) && error.details.length > 0
        ? error.details[0].message
        : null;
      setSubmitError(detailMessage || error.message || 'Không thể lưu câu hỏi.');
      return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="question-form-wrapper">
      <div className="question-form-inner container">
        <div className="question-type-section">
          <Controller
            name="type"
            control={control}
            defaultValue="multiple-choice"
            render={({ field }) => (
              <div className="question-type-toggle" role="group" aria-label="Kiểu câu hỏi">
                <button
                  type="button"
                  className={`type-toggle-btn ${field.value === 'multiple-choice' ? 'is-active' : ''}`}
                  aria-pressed={field.value === 'multiple-choice'}
                  onClick={() => {
                    field.onChange('multiple-choice');
                    clearErrors('type');
                  }}
                  disabled={isSaving}
                >
                  Trắc nghiệm
                </button>
                <button
                  type="button"
                  className={`type-toggle-btn ${field.value === 'essay' ? 'is-active' : ''}`}
                  aria-pressed={field.value === 'essay'}
                  onClick={() => {
                    field.onChange('essay');
                    clearErrors('type');
                  }}
                  disabled={isSaving}
                >
                  Tự luận
                </button>
              </div>
            )}
          />
          {errors.type && <div className="form-error-message">{errors.type.message}</div>}
        </div>

        {submitError && (
          <div className="alert alert-danger" role="alert">
            {submitError}
          </div>
        )}

        <div className="question-card shadow-sm">
          <div className="question-card__body">
            <div className="form-heading d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0 fw-semibold">{isEditing ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}</h2>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>

            <div className="question-top">
              <div className="question-input">
                <Controller
                  name="content"
                  control={control}
                  rules={{
                    required: 'Vui lòng nhập nội dung câu hỏi.',
                    validate: (value) => {
                      const trimmed = value?.trim?.() ?? '';
                      if (trimmed.length < minContentLength) {
                        return `Nội dung câu hỏi ${
                          questionType === 'essay' ? 'tự luận' : ''
                        } phải có ít nhất ${minContentLength} ký tự.`.replace('  ', ' ');
                      }

                      if (trimmed.length > 2000) {
                        return 'Nội dung câu hỏi tối đa 2000 ký tự.';
                      }

                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      ref={(node) => {
                        titleRef.current = node;
                        field.ref(node);
                      }}
                      onInput={(event) => {
                        field.onChange(event);
                        requestAnimationFrame(adjustTitleHeight);
                      }}
                      onFocus={() => setToolbarVisible(true)}
                      onBlur={(event) => {
                        field.onBlur(event);
                        const nextFocused = event.relatedTarget;
                        if (
                          nextFocused &&
                          toolbarRef.current &&
                          toolbarRef.current.contains(nextFocused)
                        ) {
                          return;
                        }
                        setToolbarVisible(false);
                      }}
                      className={`question-title-input ${errors.content ? 'is-invalid' : ''}`}
                      placeholder="Nhập nội dung câu hỏi"
                      rows={1}
                      disabled={isSaving}
                    />
                  )}
                />
                {errors.content && <div className="invalid-feedback d-block">{errors.content.message}</div>}
              </div>

              <div className="question-side-controls">
                <div className="question-category-group" ref={categorySectionRef}>
                  <span className="form-label small text-muted d-block mb-2">Loại câu hỏi</span>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <div className="btn-group category-toggle" role="group" aria-label="Loại câu hỏi">
                        <input
                          type="radio"
                          className="btn-check"
                          id="category-co-so"
                          value="co-so"
                          checked={field.value === 'co-so'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            clearErrors('category');
                          }}
                          disabled={isSaving}
                          ref={(node) => {
                            field.ref(node);
                            categoryFirstOptionRef.current = node;
                          }}
                        />
                        <label
                          className={`btn btn-outline-secondary ${field.value === 'co-so' ? 'is-active' : ''}`}
                          htmlFor="category-co-so"
                        >
                          Cơ sở
                        </label>
                        <input
                          type="radio"
                          className="btn-check"
                          id="category-chuyen-mon"
                          value="chuyen-mon"
                          checked={field.value === 'chuyen-mon'}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            clearErrors('category');
                          }}
                          disabled={isSaving}
                          ref={field.ref}
                        />
                        <label
                          className={`btn btn-outline-secondary ${field.value === 'chuyen-mon' ? 'is-active' : ''}`}
                          htmlFor="category-chuyen-mon"
                        >
                          Chuyên môn
                        </label>
                      </div>
                    )}
                  />
                  {errors.category && <div className="form-error-message">{errors.category.message}</div>}
                </div>
              </div>
            </div>

            {questionType === 'multiple-choice' && (
              <>
                <div
                  className={`question-options ${errors.options ? 'has-error' : ''}`}
                  ref={optionsSectionRef}
                  data-error-active={Boolean(errors.options)}
                >
                  <div
                    className={`question-toolbar ${isToolbarVisible ? 'is-visible' : ''}`}
                    ref={toolbarRef}
                    aria-hidden={!isToolbarVisible}
                    onMouseDown={() => setToolbarVisible(true)}
                    onTouchStart={() => setToolbarVisible(true)}
                  >
                    <div className="toolbar-actions">
                      <button
                        type="button"
                        className="toolbar-btn"
                        aria-pressed={activeFormats.bold}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault();
                          handleToggleFormat('bold');
                        }}
                        aria-label="Định dạng đậm"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        className="toolbar-btn"
                        aria-pressed={activeFormats.italic}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault();
                          handleToggleFormat('italic');
                        }}
                        aria-label="Định dạng nghiêng"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        className="toolbar-btn"
                        aria-pressed={activeFormats.underline}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault();
                          handleToggleFormat('underline');
                        }}
                        aria-label="Gạch chân"
                      >
                        U
                      </button>
                      <button
                        type="button"
                        className="toolbar-btn"
                        aria-pressed={activeFormats.link}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.preventDefault();
                          handleToggleFormat('link');
                        }}
                        aria-label="Chèn liên kết"
                      >
                        <span className="icon-link" aria-hidden="true">
                          ⛓
                        </span>
                      </button>
                    </div>
                  </div>

                  <DndProvider backend={HTML5Backend}>
                    {fields.map((field, index) => (
                      <OptionRow
                        key={field.id}
                        index={index}
                        control={control}
                        isCorrect={watchedOptions[index]?.isCorrect ?? false}
                        onMarkCorrect={handleMarkCorrect}
                        onRemove={handleRemoveOption}
                        moveOption={handleMoveOption}
                        onTextChange={handleOptionTextChange}
                        isDisabled={isSaving}
                        canRemove={fields.length > MIN_OPTIONS_COUNT}
                      />
                    ))}
                  </DndProvider>

                  <div className="add-option-row">
                    <button
                      type="button"
                      className="add-option-btn"
                      onClick={handleAddOption}
                      disabled={isSaving || fields.length >= MAX_OPTIONS_COUNT}
                    >
                      <span className="visually-hidden">Thêm tùy chọn</span>
                    </button>
                  </div>
                  {errors.options && (
                    <div
                      ref={optionsErrorRef}
                      className="options-error-banner"
                      role="alert"
                      tabIndex={-1}
                    >
                      <span className="options-error-icon" aria-hidden="true">
                        ⚠
                      </span>
                      <span>{errors.options.message}</span>
                    </div>
                  )}
                </div>

                <div className="question-explanation">
                  <div className="explanation-text-field">
                    <label className="form-label text-muted" htmlFor="question-explanation-text">
                      Giải thích câu hỏi
                    </label>
                    <Controller
                      name="explanation"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          id="question-explanation-text"
                          className="form-control explanation-input"
                          placeholder="Thêm giải thích hoặc lý do cho đáp án"
                          rows={3}
                          disabled={isSaving}
                        />
                      )}
                    />
                  </div>
                  <div className="explanation-link-field">
                    <label className="form-label text-muted" htmlFor="question-explanation-link">
                      Liên kết giải thích (URL)
                    </label>
                    <Controller
                      name="explanationUrl"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          id="question-explanation-link"
                          type="url"
                          className="form-control explanation-link-input"
                          placeholder="https://ví dụ.com/tai-lieu"
                          inputMode="url"
                          disabled={isSaving}
                        />
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            {questionType === 'essay' && (
              <div className="essay-section">
                <div className="essay-grid">
                  <div className="essay-card">
                    <div className="mb-4">
                      <label className="form-label text-muted" htmlFor="essay-group-input">
                        Nhóm câu hỏi
                      </label>
                      <Controller
                        name="group"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            id="essay-group-input"
                            type="text"
                            className={`form-control essay-group-input ${errors.group ? 'is-invalid' : ''}`}
                            placeholder="Ví dụ: Kỹ năng mềm, An toàn, Tổng quan..."
                            maxLength={200}
                            disabled={isSaving}
                            onChange={(event) => {
                              field.onChange(event.target.value);
                              clearErrors('group');
                            }}
                          />
                        )}
                      />
                      {errors.group && (
                        <div className="invalid-feedback d-block">{errors.group.message}</div>
                      )}
                      <small className="text-muted d-block mt-1">
                        Dùng để phân nhóm câu hỏi theo chủ đề hoặc chương trình đào tạo.
                      </small>
                    </div>

                    <div className="essay-verify-toggle">
                      <Controller
                        name="isVerified"
                        control={control}
                        render={({ field }) => (
                          <div className="form-check form-switch">
                            <input
                              {...field}
                              id="essay-verified-toggle"
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              checked={Boolean(field.value)}
                              onChange={(event) => field.onChange(event.target.checked)}
                              disabled={isSaving}
                            />
                            <label className="form-check-label" htmlFor="essay-verified-toggle">
                              Đã duyệt nội bộ
                            </label>
                          </div>
                        )}
                      />
                      <small className="text-muted">Đánh dấu nếu câu hỏi đã được kiểm duyệt và có thể xuất bản.</small>
                    </div>
                  </div>

                  <div className="essay-card">
                    <label className="form-label text-muted" htmlFor="essay-keyword-input">
                      Từ khóa nổi bật
                    </label>
                    <div className={`keyword-input-shell ${errors.keywords ? 'has-error' : ''}`}>
                      <div className="keyword-chip-list">
                        {keywordsValue.map((keyword, index) => (
                          <span key={`${keyword}-${index}`} className="keyword-chip">
                            <span className="keyword-chip-text">{keyword}</span>
                            <button
                              type="button"
                              className="keyword-chip-remove"
                              onClick={() => handleKeywordRemove(index)}
                              aria-label={`Xóa từ khóa ${keyword}`}
                              disabled={isSaving}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="keyword-input-row">
                        <input
                          ref={keywordInputRef}
                          id="essay-keyword-input"
                          type="text"
                          value={keywordDraft}
                          onChange={(event) => setKeywordDraft(event.target.value)}
                          onKeyDown={handleKeywordKeyDown}
                          onBlur={handleKeywordBlur}
                          className="keyword-input-control"
                          placeholder="Nhấn Enter hoặc dấu phẩy để thêm"
                          maxLength={120}
                          disabled={isSaving}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-primary keyword-add-btn"
                          onClick={handleKeywordSubmit}
                          disabled={isSaving || keywordDraft.trim().length === 0}
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                    <small className="text-muted d-block mt-2">
                      Tối đa 20 từ khóa. Mỗi từ khóa tối thiểu 1 ký tự và không trùng nhau.
                    </small>
                    {errors.keywords && (
                      <div className="form-error-message mt-2">{errors.keywords.message}</div>
                    )}
                  </div>
                </div>

                <div className="essay-card">
                  <label className="form-label text-muted" htmlFor="essay-hint-textarea">
                    Gợi ý câu trả lời
                  </label>
                  <Controller
                    name="hint"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        id="essay-hint-textarea"
                        className="form-control essay-hint-textarea"
                        placeholder="Thêm gợi ý, dàn ý hoặc tiêu chí chấm điểm"
                        rows={4}
                        disabled={isSaving}
                      />
                    )}
                  />
                  <small className="text-muted d-block mt-1">
                    Phần này sẽ hỗ trợ giảng viên hoặc AI trong việc gợi ý đánh giá câu trả lời.
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="submit" className="btn btn-primary px-4" disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : isEditing ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default QuestionForm;