import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { login as loginApi } from '../../services/authApi';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const [isSubmitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const usernameError = useMemo(() => {
    if (errors.username) {
      return errors.username.message || 'Tên đăng nhập không hợp lệ.';
    }
    return null;
  }, [errors.username]);

  const passwordError = useMemo(() => {
    if (errors.password) {
      return errors.password.message || 'Mật khẩu không hợp lệ.';
    }
    return null;
  }, [errors.password]);

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      const session = await loginApi({
        username: values.username.trim(),
        password: values.password,
      });

      if (!session?.token) {
        throw new Error('Máy chủ không trả về thông tin đăng nhập.');
      }

      login(session);
      toast.success('Đăng nhập thành công.');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-screen login-page">
      <div className="login-card shadow-lg">
        <div className="login-card__header">
          <h1>CCMG Admin</h1>
          <p>Vui lòng đăng nhập để quản lý ngân hàng câu hỏi và bộ đề.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-floating mb-3">
            <input
              id="username"
              type="text"
              className={`form-control ${usernameError && touchedFields.username ? 'is-invalid' : ''}`}
              placeholder="Tên đăng nhập"
              autoComplete="username"
              disabled={isSubmitting}
              {...register('username', {
                required: 'Tên đăng nhập là bắt buộc.',
                minLength: {
                  value: 3,
                  message: 'Tên đăng nhập phải có ít nhất 3 ký tự.',
                },
              })}
            />
            <label htmlFor="username">Tên đăng nhập</label>
            {usernameError && touchedFields.username && (
              <div className="invalid-feedback d-block">{usernameError}</div>
            )}
          </div>

          <div className="form-floating mb-3 position-relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`form-control ${passwordError && touchedFields.password ? 'is-invalid' : ''}`}
              placeholder="Mật khẩu"
              autoComplete="current-password"
              disabled={isSubmitting}
              {...register('password', {
                required: 'Mật khẩu là bắt buộc.',
                minLength: {
                  value: 6,
                  message: 'Mật khẩu phải có ít nhất 6 ký tự.',
                },
              })}
            />
            <label htmlFor="password">Mật khẩu</label>
            <button
              type="button"
              className="toggle-password btn btn-sm btn-link"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
            >
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
            {passwordError && touchedFields.password && (
              <div className="invalid-feedback d-block">{passwordError}</div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <footer className="login-card__footer text-muted">
          © {new Date().getFullYear()} CCMG Admin. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
