import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { deleteUser as deleteUserApi, getUser, listUsers, updateUser } from '../../services/userApi';
import './UserManagement.css';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
};

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatBodLabel = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN');
};

const genderOptions = [
  { value: '', label: 'Không xác định' },
  { value: 'Nam', label: 'Nam' },
  { value: 'Nữ', label: 'Nữ' },
  { value: 'Khác', label: 'Khác' },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      userName: '',
      email: '',
      phoneNumber: '',
      gender: '',
      occupation: '',
      nickname: '',
      bod: '',
      isActive: true,
    },
  });

  const fetchUsers = useCallback(
    async (keyword = '') => {
      setIsLoading(true);
      try {
        const items = await listUsers({ search: keyword });
        setUsers(items);
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Không thể tải danh sách người dùng.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalUsers = useMemo(() => users.length, [users]);
  const activeUsers = useMemo(
    () => users.filter((user) => user.isActive !== false).length,
    [users]
  );

  const openUserModal = useCallback(
    async (uid) => {
      setDetailLoading(true);
      try {
        const detail = await getUser(uid);
        if (!detail) {
          toast.error('Không tìm thấy người dùng.');
          return;
        }
        setSelectedUser(detail);
        reset({
          userName: detail.userName ?? '',
          email: detail.email ?? '',
          phoneNumber: detail.phoneNumber ?? detail.phone ?? '',
          gender: detail.gender ?? '',
          occupation: detail.occupation ?? '',
          nickname: detail.nickname ?? '',
          bod: formatDateInput(detail.bod),
          isActive: detail.isActive !== false,
        });
        setModalOpen(true);
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Không thể tải thông tin người dùng.');
      } finally {
        setDetailLoading(false);
      }
    },
    [reset]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedUser(null);
    reset({
      userName: '',
      email: '',
      phoneNumber: '',
      gender: '',
      occupation: '',
      nickname: '',
      bod: '',
      isActive: true,
    });
  }, [reset]);

  const handleDeleteUser = useCallback(
    async (uid) => {
      if (!uid || deletingUserId) return;

      const targetUser =
        (selectedUser && (selectedUser.id ?? selectedUser.uid) === uid
          ? selectedUser
          : users.find((user) => (user.id ?? user.uid) === uid)) ?? null;

      const displayName = targetUser?.userName || targetUser?.email || targetUser?.uid || 'người dùng';

      const confirmed = window.confirm(
        `Bạn có chắc chắn muốn xóa ${displayName ? `"${displayName}"` : 'người dùng'}? Hành động này không thể hoàn tác.`
      );

      if (!confirmed) return;

      setDeletingUserId(uid);
      try {
        const payload = await deleteUserApi(uid);
        toast.success(payload?.message || 'Đã xóa người dùng.');

        setUsers((prev) =>
          prev.filter((user) => (user.id ?? user.uid) !== uid)
        );

        if (selectedUser && (selectedUser.id ?? selectedUser.uid) === uid) {
          closeModal();
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Không thể xóa người dùng.');
      } finally {
        setDeletingUserId(null);
      }
    },
    [closeModal, deleteUserApi, deletingUserId, selectedUser, users]
  );

  const onSubmit = async (formValues) => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);
      const payload = {
        userName: formValues.userName,
        email: formValues.email,
        phoneNumber: formValues.phoneNumber,
        gender: formValues.gender,
        occupation: formValues.occupation,
        nickname: formValues.nickname,
        bod: formValues.bod ? new Date(formValues.bod).toISOString() : null,
        isActive: Boolean(formValues.isActive),
      };

      const updated = await updateUser(selectedUser.id ?? selectedUser.uid, payload);
      if (!updated) {
        throw new Error('Máy chủ không trả về dữ liệu sau khi cập nhật.');
      }

      toast.success('Đã cập nhật thông tin người dùng.');
      setSelectedUser(updated);
      setUsers((prev) =>
        prev.map((user) => (user.id === updated.id || user.uid === updated.uid ? updated : user))
      );
      reset({
        userName: updated.userName ?? '',
        email: updated.email ?? '',
        phoneNumber: updated.phoneNumber ?? '',
        gender: updated.gender ?? '',
        occupation: updated.occupation ?? '',
        nickname: updated.nickname ?? '',
        bod: formatDateInput(updated.bod),
        isActive: updated.isActive !== false,
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Không thể cập nhật người dùng.');
    } finally {
      setIsSaving(false);
    }
  };

  const isActiveValue = watch('isActive');

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchUsers(search);
  };

  const handleRefresh = () => {
    if (deletingUserId) return;
    fetchUsers(search);
  };

  const selectedUserKey = selectedUser ? selectedUser.id ?? selectedUser.uid : null;
  const isDeletingSelectedUser = selectedUserKey ? deletingUserId === selectedUserKey : false;

  return (
    <div className="user-management container py-4">
      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Tổng quan người dùng</h2>
              <div className="user-metric">
                <span className="user-metric__label">Tổng số người dùng</span>
                <span className="user-metric__value">{totalUsers}</span>
              </div>
              <div className="user-metric">
                <span className="user-metric__label">Đang hoạt động</span>
                <span className="user-metric__value text-success">{activeUsers}</span>
              </div>
              <div className="user-metric">
                <span className="user-metric__label">Ngừng hoạt động</span>
                <span className="user-metric__value text-danger">{totalUsers - activeUsers}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <form className="user-search row g-3 align-items-center" onSubmit={handleSearchSubmit}>
                <div className="col-md-8">
                  <label htmlFor="user-search" className="form-label text-muted small mb-1">
                    Tìm kiếm người dùng theo tên, email, số điện thoại
                  </label>
                  <input
                    id="user-search"
                    type="search"
                    className="form-control"
                    placeholder="Nhập từ khóa..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="col-md-4 d-flex gap-2 mt-3 mt-md-4">
                  <button type="submit" className="btn btn-primary w-50" disabled={isLoading}>
                    {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-50"
                    onClick={() => {
                      setSearch('');
                      fetchUsers('');
                    }}
                    disabled={isLoading}
                  >
                    Đặt lại
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h3 className="h5 mb-0">Danh sách người dùng</h3>
            <p className="text-muted small mb-0">Quản lý thông tin tài khoản và trạng thái hoạt động.</p>
          </div>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            disabled={isLoading || Boolean(deletingUserId)}
          >
            Làm mới
          </button>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th scope="col">Tên người dùng</th>
                <th scope="col">Email</th>
                <th scope="col">Số điện thoại</th>
                <th scope="col" className="text-center">Giới tính</th>
                <th scope="col" className="text-center">Sinh nhật</th>
                <th scope="col" className="text-center">Trạng thái</th>
                <th scope="col" className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Đang tải dữ liệu người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Không có người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const userKey = user.id ?? user.uid;
                  const isDeletingRow = deletingUserId === userKey;
                  const isDetailBusy =
                    detailLoading &&
                    selectedUser &&
                    (selectedUser.id ?? selectedUser.uid) === userKey;

                  return (
                    <tr key={userKey}>
                    <td>
                      <div className="fw-semibold">{user.userName || '—'}</div>
                      <div className="text-muted small">UID: {user.uid}</div>
                    </td>
                    <td>{user.email || '—'}</td>
                    <td>{user.phoneNumber || '—'}</td>
                    <td className="text-center">{user.gender || '—'}</td>
                    <td className="text-center">{formatBodLabel(user.bod)}</td>
                    <td className="text-center">
                      {user.isActive !== false ? (
                        <span className="badge bg-success-subtle text-success">Hoạt động</span>
                      ) : (
                        <span className="badge bg-secondary">Ngừng</span>
                      )}
                    </td>
                    <td className="text-end">
                        <div className="btn-group" role="group" aria-label="Hành động người dùng">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openUserModal(userKey)}
                            disabled={isDetailBusy || isDeletingRow}
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteUser(userKey)}
                            disabled={isDeletingRow}
                          >
                            {isDeletingRow ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                  aria-hidden="true"
                                />
                                Đang xóa...
                              </>
                            ) : (
                              'Xóa'
                            )}
                          </button>
                        </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedUser && (
        <div className="user-modal" role="dialog" aria-modal="true">
          <div className="user-modal__backdrop" onClick={closeModal} />
          <div className="user-modal__content">
            <div className="user-modal__header">
              <div>
                <h3 className="h5 mb-1">Chỉnh sửa người dùng</h3>
                <p className="text-muted small mb-0">UID: {selectedUser.uid}</p>
              </div>
              <button type="button" className="btn-close" aria-label="Đóng" onClick={closeModal} />
            </div>

            <div className="user-modal__body">
              <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
                <div className="col-md-6">
                  <label htmlFor="userName" className="form-label">Họ và tên</label>
                  <input
                    id="userName"
                    type="text"
                    className={`form-control ${errors.userName ? 'is-invalid' : ''}`}
                    {...register('userName', {
                      required: 'Tên người dùng là bắt buộc.',
                      minLength: {
                        value: 2,
                        message: 'Tên người dùng phải có ít nhất 2 ký tự.',
                      },
                    })}
                    disabled={isSaving}
                  />
                  {errors.userName && <div className="invalid-feedback">{errors.userName.message}</div>}
                </div>
                <div className="col-md-6">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    {...register('email', {
                      required: 'Email là bắt buộc.',
                      pattern: {
                        value: /.+@.+\..+/,
                        message: 'Địa chỉ email không hợp lệ.',
                      },
                    })}
                    disabled={isSaving}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                </div>
                <div className="col-md-6">
                  <label htmlFor="phoneNumber" className="form-label">Số điện thoại</label>
                  <input
                    id="phoneNumber"
                    type="text"
                    className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                    {...register('phoneNumber', {
                      pattern: {
                        value: /^[0-9+()\-\s]{8,20}$/,
                        message: 'Số điện thoại không hợp lệ.',
                      },
                    })}
                    disabled={isSaving}
                  />
                  {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber.message}</div>}
                </div>
                <div className="col-md-6">
                  <label htmlFor="gender" className="form-label">Giới tính</label>
                  <select id="gender" className="form-select" {...register('gender')} disabled={isSaving}>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label htmlFor="occupation" className="form-label">Nghề nghiệp</label>
                  <input
                    id="occupation"
                    type="text"
                    className="form-control"
                    {...register('occupation')}
                    disabled={isSaving}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="nickname" className="form-label">Biệt danh</label>
                  <input
                    id="nickname"
                    type="text"
                    className="form-control"
                    {...register('nickname')}
                    disabled={isSaving}
                  />
                </div>
                <div className="col-md-6">
                  <label htmlFor="bod" className="form-label">Ngày sinh</label>
                  <input
                    id="bod"
                    type="date"
                    className={`form-control ${errors.bod ? 'is-invalid' : ''}`}
                    {...register('bod')}
                    disabled={isSaving}
                  />
                  {errors.bod && <div className="invalid-feedback">{errors.bod.message}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Trạng thái</label>
                  <div className="form-check form-switch">
                    <input
                      id="isActive"
                      type="checkbox"
                      className="form-check-input"
                      {...register('isActive')}
                      disabled={isSaving}
                    />
                    <label className="form-check-label" htmlFor="isActive">
                      {isActiveValue ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </label>
                  </div>
                </div>
                <div className="col-12">
                  <div className="user-meta d-flex flex-wrap gap-3">
                    <span className="text-muted small">
                      Ngày tạo: <strong>{formatDateTime(selectedUser.createdAt)}</strong>
                    </span>
                    <span className="text-muted small">
                      Lần cập nhật gần nhất: <strong>{formatDateTime(selectedUser.updatedAt)}</strong>
                    </span>
                  </div>
                </div>
                <div className="col-12 d-flex flex-wrap justify-content-between align-items-center gap-2 pt-3">
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => handleDeleteUser(selectedUserKey)}
                    disabled={!selectedUserKey || isDeletingSelectedUser}
                  >
                    {isDeletingSelectedUser ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                        Đang xóa...
                      </>
                    ) : (
                      'Xóa người dùng'
                    )}
                  </button>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={isSaving || isDeletingSelectedUser}>
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving || isDeletingSelectedUser}>
                      {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
