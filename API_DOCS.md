# Tài Liệu API - Task Management System

Mọi API yêu cầu Authen đều phải đính kèm Header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Xác thực & Phân quyền (Auth)

### 1.1 Đăng ký tài khoản hệ thống
- **URL**: `POST /api/auth/register`
- **Auth Required**: No
- **Body** (JSON):
```json
{
    "username": "Nguyen Thinh",
    "email": "nguyenthinhh4@gmail.com",
    "password": "password123"
}
```
- **Response** (201 Created):
```json
{
    "status": 201,
    "message": "Đăng ký thành công",
    "data": {
        "id": 1,
        "username": "Nguyen Thinh",
        "email": "nguyenthinhh4@gmail.com"
    }
}
```

### 1.2 Đăng nhập hệ thống (Mật khẩu)
- **URL**: `POST /api/auth/login`
- **Auth Required**: No
- **Body** (JSON):
```json
{
    "email": "nguyenthinhh4@gmail.com",
    "password": "password123"
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Đăng nhập thành công",
    "data": {
        "accessToken": "eyJhbGciOiJSUz...",
        "tokenType": "Bearer"
    }
}
```

### 1.3 Đăng nhập bằng Google
- **URL**: `POST /api/auth/login/google`
- **Auth Required**: No
- **Body** (JSON):
```json
{
    "idToken": "eyJhbGciOiJSUz..."
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Đăng nhập Google thành công",
    "data": {
        "accessToken": "eyJhbGciOiJSUz...",
        "tokenType": "Bearer"
    }
}
```
- **Note**: `isVerified` tự động gạt sang `true`.

### 1.4 Xác thực Email (Verify Email)
- **URL**: `GET /api/auth/verify?token={token}`
- **Auth Required**: No
- **Query Params**: 
  - `token` (String, Required): Verification token từ email
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Xác thực email thành công",
    "data": null
}
```
- **Business Rules**:
  - Token phải tồn tại và chưa được sử dụng.
  - Token hết hạn sau 24 giờ.
  - User phải chưa được xác thực trước đó.
- **Error Cases**:
  - `400`: Token không hợp lệ, đã hết hạn, hoặc đã được sử dụng.
  - `400`: User đã được xác thực trước đó.

### 1.5 Gửi lại Email Xác thực (Resend Verification)
- **URL**: `POST /api/auth/resend-verification`
- **Auth Required**: No
- **Body** (JSON):
```json
{
    "email": "nguyenthinhh4@gmail.com"
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.",
    "data": null
}
```
- **Business Rules**:
  - Email phải tồn tại trong hệ thống.
  - User phải chưa được xác thực.
  - Token cũ sẽ bị xóa và tạo token mới.
- **Error Cases**:
  - `400`: Email không tồn tại hoặc đã được xác thực.
  - `400`: Request quá nhanh (chỉ được gửi lại sau 60 giây).

---

## 2. Quản lý Dự án (Project)

### 2.1 Lấy danh sách dự án
- **URL**: `GET /api/projects`
- **Auth Required**: Yes
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Lấy danh sách dự án thành công",
    "data": [
        {
            "id": 1,
            "name": "Dự án Thiết kế Website",
            "description": "Làm giao diện chuẩn UI/UX cho công ty ABC",
            "ownerId": 1
        },
        {
            "id": 2,
            "name": "Dự án Mobile App",
            "description": "Phát triển ứng dụng di động cho iOS và Android",
            "ownerId": 1
        }
    ]
}
```
- **Note**: Chỉ trả về các dự án mà user là owner.

### 2.2 Tạo dự án mới
- **URL**: `POST /api/projects`
- **Auth Required**: Yes
- **Body** (JSON):
```json
{
    "name": "Dự án Thiết kế Website",
    "description": "Làm giao diện chuẩn UI/UX cho công ty ABC"
}
```
- **Response** (201 Created):
```json
{
    "status": 201,
    "message": "Dự án đã được tạo thành công",
    "data": {
        "id": 1,
        "name": "Dự án Thiết kế Website",
        "description": "Làm giao diện chuẩn UI/UX cho công ty ABC",
        "ownerId": 1
    }
}
```
- **Note**: Người tạo tự động trở thành `OWNER` và Status `ACCEPTED`.

### 2.3 Xóa dự án
- **URL**: `DELETE /api/projects/{projectId}`
- **Auth Required**: Yes (Yêu cầu phải là `OWNER` của dự án)
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Dự án đã được xóa thành công",
    "data": null
}
```
- **Note**: Logic xóa cũng bao gồm việc dọn dẹp (cascade delete) toàn bộ các Công việc (`Tasks`) và Thành viên (`ProjectMembers`) thuộc dự án này để tránh rác CSDL.

---

## 3. Lời mời tham gia Dự án (Invitations)

### 3.1 Mời thành viên vào dự án
- **URL**: `POST /api/projects/{projectId}/invite`
- **Auth Required**: Yes (Cần quyền `OWNER` trong `{projectId}`)
- **Body** (JSON):
```json
{
    "inviteeEmail": "nguoi_duoc_moi@gmail.com"
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Gửi lời mời thành công",
    "data": null
}
```
- **Note**: Trạng thái lời mời ban đầu là `PENDING`. Người được mời bắt buộc phải verified.

### 3.2 Nhận danh sách Lời mời của TÔI
- **URL**: `GET /api/users/me/invitations`
- **Auth Required**: Yes
- **Response** (Trả về Array Object):
```json
[
    {
        "id": 1,
        "projectId": 10,
        "projectName": "Dự án Thiết kế Website",
        "role": "MEMBER",
        "status": "PENDING"
    }
]
```

### 3.3 Chấp nhận / Từ chối Lời mời
- **URL**: `POST /api/projects/{projectId}/invitations/respond`
- **Auth Required**: Yes
- **Body** (JSON):
```json
{
    "isAccept": true
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Đã Chấp nhận lời mời vào dự án",
    "data": null
}
```
- **Note**: `true` để ACCEPTED (vào dự án), `false` để REJECTED (từ chối lời mời). Khi từ chối, message sẽ là `"Đã Từ chối lời mời vào dự án"`.

---

## 4. Quản lý Công việc (Tasks)

> Tasks thuộc về một Project cụ thể. Mọi endpoint đều yêu cầu User đã là thành viên **ACCEPTED** của Project.

### 4.1 Tạo task mới trong dự án
- **URL**: `POST /api/projects/{projectId}/tasks`
- **Auth Required**: Yes (Thành viên ACCEPTED của dự án)
- **Body** (JSON):
```json
{
    "title": "Thiết kế màn hình Login",
    "description": "Làm theo Figma đã được duyệt"
}
```
- **Response** (201 Created):
```json
{
    "status": 201,
    "message": "Tạo task thành công",
    "data": {
        "id": 1,
        "title": "Thiết kế màn hình Login",
        "description": "Làm theo Figma đã được duyệt",
        "status": "TODO",
        "projectId": 1,
        "assigneeId": null,
        "position": 1
    }
}
```
- **Note**:
  - `status` mặc định là `TODO`, không được truyền thủ công.
  - `assigneeId` mặc định là `null` (chưa giao việc).
  - `position` tự động = số task hiện có + 1 (gắn vào cuối danh sách).
  - Chuyển trạng thái task dùng các API riêng: `start`, `complete`, `cancel`.

### 4.2 Lấy danh sách Task theo Status
- **URL**: `GET /api/projects/{projectId}/tasks`
- **Auth Required**: Yes (Thành viên ACCEPTED của dự án)
- **Query Params**: `status` (tùy chọn)
  - Không truyền → lấy **tất cả** task, sort theo `position`.
  - Truyền → lọc theo status: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`.
- **Ví dụ**:
  - `GET /api/projects/1/tasks` → tất cả task
  - `GET /api/projects/1/tasks?status=TODO` → chỉ task TODO
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Lấy danh sách task thành công",
    "data": [
        {
            "id": 1,
            "title": "Thiết kế màn hình Login",
            "description": "Làm theo Figma đã được duyệt",
            "status": "TODO",
            "projectId": 1,
            "assigneeId": null,
            "position": 1
        }
    ]
}
```
- **Note**: Nếu truyền `status` không hợp lệ sẽ nhận lỗi `400` với thông báo rõ ràng.

### 4.3 Di chuyển Task (Drag & Drop Kanban)
- **URL**: `POST /api/projects/{projectId}/tasks/{taskId}/move`
- **Auth Required**: Yes (Thành viên ACCEPTED của dự án)
- **Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `toStatus` | String | Yes | Status mới: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED` |
| `toPosition` | Integer | Yes | Vị trí mới trong column (bắt đầu từ 0) |

- **Ví dụ 1: Move trong cùng column (TODO → TODO)**
```json
{
    "toStatus": "TODO",
    "toPosition": 0
}
```

- **Ví dụ 2: Move sang column khác (TODO → IN_PROGRESS)**
```json
{
    "toStatus": "IN_PROGRESS",
    "toPosition": 2
}
```

- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Di chuyển task thành công",
    "data": {
        "id": 1,
        "title": "Thiết kế màn hình Login",
        "description": "Làm theo Figma đã được duyệt",
        "status": "IN_PROGRESS",
        "projectId": 1,
        "assigneeId": null,
        "position": 2
    }
}
```
- **Business Rules**:
  - Task phải tồn tại và thuộc project được chỉ định.
  - User phải là thành viên ACCEPTED của project.
  - `toStatus` phải là giá trị hợp lệ: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`.
  - `toPosition` phải >= 0.
  - Position được tự động normalizelại liên tục (không có khoảng trống).
  - Các task khác trong cùng column sẽ tự động shift position để đảm bảo thứ tự.
  - Nếu move sang column khác: task sẽ được xóa khỏi column cũ và thêm vào column mới với status mới.
- **Error Cases**:
  - `400`: Status không hợp lệ hoặc position < 0.
  - `403`: User không phải thành viên ACCEPTED của project.
  - `404`: Task không tồn tại hoặc không thuộc project.

### 4.4 Giao Task (Assign Task)
- **URL**: `POST /api/projects/{projectId}/tasks/{taskId}/assign`
- **Auth Required**: Yes (Thành viên ACCEPTED của dự án)
- **Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assigneeId` | Long | No | ID của user được giao task. `null` = hủy giao |

- **Ví dụ 1: Giao task cho user**
```json
{
    "assigneeId": 5
}
```

- **Ví dụ 2: Hủy giao task (unassign)**
```json
{
    "assigneeId": null
}
```

- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Giao task thành công",
    "data": {
        "id": 1,
        "title": "Thiết kế màn hình Login",
        "description": "Làm theo Figma đã được duyệt",
        "status": "TODO",
        "projectId": 1,
        "assigneeId": 5,
        "position": 0
    }
}
```

- **Business Rules**:
  - Task phải tồn tại và thuộc project được chỉ định.
  - Assigner (người gọi API) phải là thành viên ACCEPTED của project.
  - Assignee (người được giao) phải tồn tại và là thành viên ACCEPTED của project.
  - Cho phép tự giao task cho chính mình.
  - Cho phép hủy giao bằng cách truyền `assigneeId = null`.

- **Error Cases**:
  - `400`: Assignee không phải thành viên của project hoặc chưa ACCEPTED.
  - `403`: Assigner không phải thành viên ACCEPTED của project.
  - `404`: Task không tồn tại, không thuộc project, hoặc assignee không tồn tại.

