const TOKEN_STORAGE_KEY = 'ccmg_admin_token';
const USER_STORAGE_KEY = 'ccmg_admin_user';

export const loadSession = () => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY) || null;
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    const user = rawUser ? JSON.parse(rawUser) : null;

    return {
      token,
      user,
    };
  } catch (error) {
    console.error('Không thể đọc thông tin phiên đăng nhập:', error);
    return {
      token: null,
      user: null,
    };
  }
};

export const saveSession = ({ token, user }) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error('Không thể lưu phiên đăng nhập:', error);
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Không thể xóa phiên đăng nhập:', error);
  }
};

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Không thể truy cập token đăng nhập:', error);
    return null;
  }
};

export const getUserProfile = () => {
  try {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    console.error('Không thể đọc thông tin người dùng:', error);
    return null;
  }
};

export default {
  loadSession,
  saveSession,
  clearSession,
  getToken,
  getUserProfile,
};
