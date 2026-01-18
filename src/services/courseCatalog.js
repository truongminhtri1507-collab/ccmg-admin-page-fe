const COURSE_ID_MAP = {
  'co-so': process.env.REACT_APP_COURSE_ID_CO_SO,
  'chuyen-mon': process.env.REACT_APP_COURSE_ID_CHUYEN_MON,
};

export const getCourseIdForCategory = (category) => {
  const normalizedCategory = category?.toString().trim();
  const id = COURSE_ID_MAP[normalizedCategory];

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(
      `Chưa cấu hình courseId cho category "${normalizedCategory}". Vui lòng bổ sung REACT_APP_COURSE_ID_CO_SO / REACT_APP_COURSE_ID_CHUYEN_MON.`
    );
  }

  return id.trim();
};

export const listCourseMappings = () => (
  Object.entries(COURSE_ID_MAP)
    .filter(([, value]) => Boolean(value))
    .map(([category, value]) => ({ category, courseId: value }))
);

export default COURSE_ID_MAP;
