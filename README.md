# CCMG Admin Page

Ứng dụng CCMG Admin Page là một trang quản trị web được xây dựng bằng React, thiết kế với phong cách hiện đại, tập trung vào trải nghiệm quản lý ngân hàng câu hỏi mượt mà, trực quan và dễ dùng.

Ứng dụng nằm trong thư mục gốc dự án.

## Điểm nổi bật

### UI hiện đại, glassmorphism
Thiết kế gọn gàng với hiệu ứng glassmorphism, bố cục trong suốt, bo góc mềm mại, tập trung vào nội dung, dùng font Inter và bảng màu xanh dương chủ đạo để tạo cảm giác trẻ trung, chuyên nghiệp.

### Quy trình tạo câu hỏi mượt mà
Form sử dụng React Hook Form, hỗ trợ cả trắc nghiệm (drag & drop tùy chọn, đánh dấu đáp án đúng) lẫn tự luận (gợi ý trả lời), với validation real-time và preview tức thời.

### Xem trước tức thời
Màn hình preview tái hiện bố cục câu hỏi như khi hiển thị cho học viên, bao gồm giải thích và liên kết tham khảo, giúp admin kiểm tra trước khi publish.

### Cấu trúc rõ ràng, dễ mở rộng
Code được chia theo components, hooks, utils, giúp:
- Dễ bảo trì
- Dễ onboard dev mới
- Dễ tách module / refactor

### Trạng thái có thể lưu nháp
Logic state được tách riêng giúp dễ đồng bộ vào backend hoặc lưu trữ cục bộ trong tương lai.

## Công nghệ chính

- **React 19** & Hooks
- **React Hook Form** cho quản lý và validate biểu mẫu
- **React DnD** để kéo-thả thứ tự tùy chọn
- **Bootstrap 5** và CSS tùy biến cho giao diện
- **Create React App (CRA)** làm scaffold build/bundler

## Cấu trúc thư mục chính

Một số thư mục quan trọng trong dự án:

### `src/`

- **`App.js`**: Entry point chính của ứng dụng, định tuyến các tab chức năng
- **`components/`**
  - `QuestionForm.jsx`: Form tạo/chỉnh sửa câu hỏi, tích hợp hook form và drag-n-drop
  - `QuestionList.jsx`: Danh sách câu hỏi với thao tác kéo sắp xếp, tìm kiếm, lọc
  - `QuestionPreview.jsx`: Màn hình xem trước, hiển thị giải thích và liên kết
  - `Tabbar.jsx`: Thanh điều hướng tab
- **`hooks/`**
  - `useQuestionState.js`: Custom hook quản lý state câu hỏi, hỗ trợ lưu nháp
- **`index.js`, `index.css`**: Khởi tạo ứng dụng và khai báo stylesheet gốc

### `public/`
- Template HTML, favicon, asset tĩnh (images, icons)

### `build/`
- Sinh ra sau khi chạy build production, chứa bundle tối ưu để deploy

## Cách chạy dự án

### Cài đặt môi trường phát triển

1. **Yêu cầu**: Node.js ≥ 18, npm ≥ 9
2. **Cài dependencies**:

```powershell
npm install
```

### Chạy trên môi trường development

```powershell
npm start
```

Ứng dụng mặc định chạy tại `http://localhost:3000`.

### Build bản release

Tạo gói production tối ưu để deploy:

```powershell
npm run build
```

Thư mục `build/` sẽ chứa bundle cuối cùng, có thể serve bằng bất kỳ static host nào (Nginx, Apache, Vercel, Netlify, v.v.).

## Trạng thái hiện tại

**Hiện tại dự án chỉ có Frontend**, tất cả dữ liệu được quản lý bằng state local trong React. Backend API và tích hợp Firebase sẽ được phát triển trong các giai đoạn tiếp theo.

## Định hướng phát triển

### Giai đoạn 1: Backend API & Firebase Integration
- ⏳ Xây dựng Backend API RESTful (Node.js + Express.js)
- ⏳ Tích hợp Firebase (Auth, Firestore) cho authentication và database
- ⏳ Tích hợp API thật để đồng bộ câu hỏi, lưu nháp và phân quyền người dùng
- ⏳ Real-time sync với Firestore để cập nhật tức thời khi có thay đổi
- ⏳ Auto-save draft tự động mỗi 30 giây

### Giai đoạn 2: Quản lý người dùng & Premium
- ⏳ **Quản lý người dùng (User Management)**
  - Dashboard quản lý danh sách người dùng
  - Xem thông tin chi tiết user (profile, activity, subscription)
  - Phân quyền người dùng (Admin, Editor, Viewer)
  - Khóa/mở khóa tài khoản
  - Xem lịch sử hoạt động (activity logs)
  
- ⏳ **Nâng cấp Premium (Premium Upgrade)**
  - Hệ thống subscription với các gói: Free, Basic, Premium
  - Quản lý gói đăng ký của user (upgrade/downgrade)
  - Tính năng Premium:
    - Tạo không giới hạn câu hỏi
    - Export/Import câu hỏi (JSON, CSV)
    - Analytics dashboard nâng cao
    - Priority support
    - Custom categories
  - Thanh toán tích hợp (Stripe, PayPal, hoặc payment gateway địa phương)
  - Quản lý billing và invoices
  - Thông báo khi subscription sắp hết hạn

### Giai đoạn 3: Tính năng nâng cao
- ⏳ Bổ sung tìm kiếm, lọc nâng cao cho danh sách câu hỏi
- ⏳ Viết test (unit & e2e) cho form và luồng kéo-thả
- ⏳ Hỗ trợ đa ngôn ngữ và theme tối
- ⏳ Analytics dashboard cho admin
- ⏳ Notification system cho admin và users

## Requirements (REQ) - Backend & Tính năng tương lai

### Backend API Architecture

#### Công nghệ đề xuất
- **Backend Framework**: Node.js + Express.js (hoặc NestJS)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **API Documentation**: Swagger/OpenAPI
- **Environment**: dotenv cho config

#### API Endpoints

**Questions Management (CRUD)**
```
GET    /api/questions              - Lấy danh sách câu hỏi (pagination, filter, search)
GET    /api/questions/:id          - Lấy chi tiết 1 câu hỏi
POST   /api/questions              - Tạo câu hỏi mới
PUT    /api/questions/:id          - Cập nhật câu hỏi
DELETE /api/questions/:id          - Xóa câu hỏi
PATCH  /api/questions/reorder       - Sắp xếp lại thứ tự câu hỏi
```

**Draft Management**
```
GET    /api/drafts                 - Lấy danh sách draft của user
GET    /api/drafts/:id             - Lấy chi tiết draft
POST   /api/drafts                 - Lưu draft mới
PUT    /api/drafts/:id             - Cập nhật draft
DELETE /api/drafts/:id             - Xóa draft
```

**User Management**
```
GET    /api/users                  - Lấy danh sách users (admin only, với pagination)
GET    /api/users/:id              - Lấy chi tiết user
PUT    /api/users/:id              - Cập nhật thông tin user (admin)
PATCH  /api/users/:id/role         - Thay đổi role của user (admin only)
PATCH  /api/users/:id/status       - Khóa/mở khóa tài khoản (admin only)
GET    /api/users/:id/activity     - Lấy lịch sử hoạt động của user
DELETE /api/users/:id              - Xóa user (admin only)
```

**Subscription & Premium Management**
```
GET    /api/subscriptions          - Lấy danh sách subscriptions (admin)
GET    /api/subscriptions/:userId  - Lấy subscription của user
POST   /api/subscriptions          - Tạo subscription mới (upgrade)
PUT    /api/subscriptions/:id      - Cập nhật subscription
PATCH  /api/subscriptions/:id/cancel - Hủy subscription
GET    /api/subscriptions/:id/invoices - Lấy lịch sử thanh toán
POST   /api/subscriptions/webhook  - Webhook từ payment gateway
```

**Categories Management**
```
GET    /api/categories             - Lấy danh sách categories
POST   /api/categories             - Tạo category mới (admin only)
PUT    /api/categories/:id         - Cập nhật category (admin only)
DELETE /api/categories/:id         - Xóa category (admin only)
```

#### Data Models (Firestore Collections)

**Users Collection**
```javascript
{
  id: string (auto-generated),
  email: string,
  displayName: string,
  photoURL: string | null,
  role: 'admin' | 'editor' | 'viewer',
  status: 'active' | 'suspended' | 'banned',
  subscription: {
    plan: 'free' | 'basic' | 'premium',
    status: 'active' | 'expired' | 'cancelled',
    startDate: timestamp,
    endDate: timestamp,
    autoRenew: boolean
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp
}
```

**Subscriptions Collection**
```javascript
{
  id: string (auto-generated),
  userId: string,
  plan: 'free' | 'basic' | 'premium',
  status: 'active' | 'expired' | 'cancelled',
  startDate: timestamp,
  endDate: timestamp,
  autoRenew: boolean,
  paymentMethod: string,
  billingCycle: 'monthly' | 'yearly',
  price: number,
  currency: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Questions Collection**
```javascript
{
  id: string (auto-generated),
  type: 'multiple-choice' | 'essay',
  content: string,
  options: Array<{
    id: string,
    text: string,
    isCorrect: boolean,
    order: number
  }>,
  hint: string,
  explanation: string,
  referenceLink: string,
  category: string,
  difficulty: 'easy' | 'medium' | 'hard',
  tags: string[],
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string (userId),
  isActive: boolean
}
```

**Drafts Collection**
```javascript
{
  id: string (auto-generated),
  questionId: string | null,
  type: 'multiple-choice' | 'essay',
  content: string,
  options: Array<{...}>,
  hint: string,
  category: string,
  userId: string,
  lastSavedAt: timestamp,
  autoSave: boolean
}
```

#### Premium Features Matrix

| Tính năng | Free | Basic | Premium |
|-----------|------|-------|---------|
| Số câu hỏi tối đa | 50 | 500 | Unlimited |
| Export/Import | ❌ | ✅ (JSON only) | ✅ (JSON, CSV) |
| Analytics Dashboard | ❌ | ✅ (Basic) | ✅ (Advanced) |
| Custom Categories | ❌ | ✅ (5 categories) | ✅ (Unlimited) |
| Priority Support | ❌ | ❌ | ✅ |
| Auto-save Draft | ✅ | ✅ | ✅ |
| Real-time Sync | ✅ | ✅ | ✅ |

#### Authentication & Authorization

- Sử dụng Firebase Auth để xác thực
- JWT token trong header: `Authorization: Bearer <firebase-id-token>`
- Phân quyền:
  - **Admin**: Full CRUD trên tất cả resources, quản lý users, subscriptions
  - **Editor**: Create, Update (own questions), Read all
  - **Viewer**: Read only
  - **Premium User**: Tất cả tính năng Premium theo subscription plan

#### Security & Performance

- Input validation & sanitization
- Rate limiting cho API endpoints
- CORS configuration
- Firestore Security Rules
- Optimistic updates ở frontend
- Real-time sync với Firestore listeners
- Auto-save draft với debounce (30s interval)

## Đóng góp & phát triển thêm

Đề xuất tính năng mới hoặc góp ý UI/UX có thể:
- Tạo issue trên repository GitHub với mô tả rõ ràng
- Tạo pull request với mô tả chi tiết, kèm screenshot hoặc gif demo
- Tuân thủ style guide hiện có (ESLint/Prettier nếu được bổ sung) và đảm bảo `npm run build` thành công trước khi gửi PR

Ứng dụng được xây dựng với tinh thần **quản lý hiệu quả – giao diện gọn – trải nghiệm mượt**, phù hợp với đội ngũ admin và dev thích sự hiện đại, rõ ràng.
