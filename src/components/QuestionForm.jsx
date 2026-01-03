import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'bootstrap/dist/css/bootstrap.min.css';
import './QuestionForm.css';

const OptionItemTypes = {
  OPTION: 'OPTION',
};

const OptionRow = ({ index, control, isCorrect, onMarkCorrect, onRemove, moveOption, onTextChange }) => {
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
}) => {
  const titleRef = useRef(null);
  const toolbarRef = useRef(null);
  const [isToolbarVisible, setToolbarVisible] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    link: false,
  });

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
                  text: option.text ?? '',
                  isCorrect: Boolean(option.isCorrect),
                }))
              : [createEmptyOption(), createEmptyOption()])
          : [],
        hint: sourceDraft.hint ?? '',
        category: sourceDraft.category ?? '',
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

  const skipResetRef = useRef(false);
  const lastSerializedDraftRef = useRef(null);

  useEffect(() => {
    if (skipResetRef.current) {
      skipResetRef.current = false;
      return;
    }

    reset(buildFormValuesFromDraft(draft));
    if (!isEditing) {
      setValue('category', '', { shouldDirty: false, shouldValidate: false });
      clearErrors('category');
    }
  }, [draft, reset, buildFormValuesFromDraft, isEditing, setValue, clearErrors]);

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

  useLayoutEffect(() => {
    adjustTitleHeight();
  }, [adjustTitleHeight, watchedValues.content]);

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

  const prevQuestionTypeRef = useRef(questionType);

  useEffect(() => {
    const prevType = prevQuestionTypeRef.current;

    if (!questionType) {
      return;
    }

    const currentValues = getValues();

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
      });
    }

    if (questionType === 'essay' && prevType !== 'essay') {
      clearErrors('options');
      if (currentValues.explanation) {
        setValue('explanation', '', { shouldDirty: false, shouldValidate: false });
      }
      if (currentValues.explanationUrl) {
        setValue('explanationUrl', '', { shouldDirty: false, shouldValidate: false });
      }
    }

    prevQuestionTypeRef.current = questionType;
  }, [questionType, getValues, reset, createEmptyOption, clearErrors, setValue]);

  const handleToggleFormat = (formatKey) => {
    setActiveFormats((prev) => ({
      ...prev,
      [formatKey]: !prev[formatKey],
    }));
  };

  const handleAddOption = () => {
    append(createEmptyOption());
  };

  const handleRemoveOption = (index) => {
    remove(index);
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

  const onSubmit = (values) => {
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

      if (normalizedOptions.length < 1) {
        setError('options', {
          type: 'manual',
          message: 'Cần ít nhất 1 lựa chọn hợp lệ.',
        });
        return;
      }

      if (!normalizedOptions.some((option) => option.isCorrect)) {
        setError('options', {
          type: 'manual',
          message: 'Chọn ít nhất một đáp án đúng.',
        });
        return;
      }

      values.options = normalizedOptions;
      values.explanation = values.explanation?.trim() ?? '';
      values.explanationUrl = values.explanationUrl?.trim() ?? '';
    } else {
      clearErrors('options');
      values.explanation = '';
      values.explanationUrl = '';
    }

    const questionPayload = {
      ...draft,
      ...values,
      id: draft?.id ?? null,
      options: values.type === 'multiple-choice' ? values.options : [],
      hint: values.type === 'essay' ? values.hint : '',
      category: values.category ?? '',
      explanation: values.type === 'multiple-choice' ? (values.explanation ?? '') : '',
      explanationUrl: values.type === 'multiple-choice' ? (values.explanationUrl ?? '') : '',
    };

    onSave(questionPayload);
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
                >
                  Tự luận
                </button>
              </div>
            )}
          />
          {errors.type && <div className="form-error-message">{errors.type.message}</div>}
        </div>

        <div className="question-card shadow-sm">
          <div className="question-card__body">
            <div className="form-heading d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0 fw-semibold">{isEditing ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}</h2>
              {isEditing && (
                <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                  Hủy chỉnh sửa
                </button>
              )}
            </div>

            <div className="question-top">
              <div className="question-input">
                <Controller
                  name="content"
                  control={control}
                  rules={{ required: 'Vui lòng nhập nội dung câu hỏi.' }}
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
                    />
                  )}
                />
                {errors.content && <div className="invalid-feedback d-block">{errors.content.message}</div>}
              </div>

              <div className="question-side-controls">
                <div className="question-category-group">
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
                <div className="question-options">
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
                      />
                    ))}
                  </DndProvider>

                  <div className="add-option-row">
                    <button type="button" className="add-option-btn" onClick={handleAddOption}>
                      <span className="visually-hidden">Thêm tùy chọn</span>
                    </button>
                  </div>

                  {errors.options && <div className="text-danger mt-2">{errors.options.message}</div>}
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
                        />
                      )}
                    />
                  </div>
                </div>
              </>
            )}

            {questionType === 'essay' && (
              <div className="question-essay">
                <label className="form-label text-muted">Gợi ý câu trả lời</label>
                <Controller
                  name="hint"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className="form-control"
                      placeholder="Thêm gợi ý hoặc mô tả"
                      rows={3}
                    />
                  )}
                />
              </div>
            )}
          </div>
        </div>


        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="submit" className="btn btn-primary px-4">
            {isEditing ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default QuestionForm;