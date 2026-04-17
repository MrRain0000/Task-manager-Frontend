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
    "data": {
        "projects": [
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
        ],
        "totalProjects": 2
    }
}
```
- **Note**: Trả về toàn bộ dự án mà user đang là thành viên với trạng thái `ACCEPTED` (bao gồm cả `OWNER` và `MEMBER`). Nếu vừa được mời vào dự án, user cần chấp nhận lời mời (API 3.3) thì dự án mới xuất hiện trong danh sách.

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

### 2.3 Cập nhật dự án
- **URL**: `PUT /api/projects/{projectId}`
- **Auth Required**: Yes (Yêu cầu phải là `OWNER` của dự án)
- **Body** (JSON):
```json
{
    "name": "Dự án Thiết kế Website - Updated",
    "description": "Mô tả cập nhật cho dự án"
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Dự án đã được cập nhật thành công",
    "data": {
        "id": 1,
        "name": "Dự án Thiết kế Website - Updated",
        "description": "Mô tả cập nhật cho dự án",
        "ownerId": 1
    }
}
```
- **Business Rules**:
  - Chỉ `OWNER` của dự án mới có quyền cập nhật.
  - Tên và mô tả sẽ được normalize (trim whitespace, xử lý ký tự đặc biệt) trước khi lưu.
  - `PROJECT_UPDATED` activity log sẽ được tạo tự động.
- **Error Cases**:
  - `403`: User không phải `OWNER` của dự án.
  - `404`: Dự án không tồn tại.

### 2.4 Xóa dự án
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

### 4.3 Lấy chi tiết Task
- **URL**: `GET /api/projects/{projectId}/tasks/{taskId}`
- **Auth Required**: Yes (Thành viên ACCEPTED của dự án)
- **Path Params**:
  - `projectId` (Long, Required): ID của dự án
  - `taskId` (Long, Required): ID của task cần lấy chi tiết
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Lấy chi tiết task thành công",
    "data": {
        "id": 1,
        "title": "Thiết kế màn hình Login",
        "description": "Làm theo Figma đã được duyệt",
        "status": "TODO",
        "position": 1,
        "project": {
            "id": 1,
            "name": "Dự án Thiết kế Website"
        },
        "assignee": {
            "id": 5,
            "username": "Nguyen Van A",
            "email": "nguyenvana@gmail.com"
        }
    }
}
```
- **Business Rules**:
  - Task phải tồn tại và thuộc project được chỉ định.
  - User phải là thành viên ACCEPTED của project.
  - `assignee` sẽ là `null` nếu task chưa được giao cho ai.
- **Error Cases**:
  - `403`: User không phải thành viên ACCEPTED của project.
  - `404`: Task không tồn tại hoặc không thuộc project.

### 4.4 Di chuyển Task (Drag & Drop Kanban)
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

- **Response** (200 OK) - Incremental Sync:

  Response trả về map của các **columns bị ảnh hưởng** thay vì toàn bộ project.

  - **Trường hợp 1: Move trong cùng column** (e.g., TODO→TODO)
    ```json
    {
        "status": 200,
        "message": "Di chuyển task thành công",
        "data": {
            "TODO": [
                { "id": 2, "title": "Task B", "status": "TODO", "position": 0 },
                { "id": 3, "title": "Task C", "status": "TODO", "position": 1 },
                { "id": 1, "title": "Task A", "status": "TODO", "position": 2 }
            ]
        }
    }
    ```
    → Frontend chỉ cần update column `TODO`

  - **Trường hợp 2: Move sang column khác** (e.g., TODO→IN_PROGRESS)
    ```json
    {
        "status": 200,
        "message": "Di chuyển task thành công",
        "data": {
            "TODO": [
                { "id": 2, "title": "Task B", "status": "TODO", "position": 0 }
            ],
            "IN_PROGRESS": [
                { "id": 3, "title": "Task C", "status": "IN_PROGRESS", "position": 0 },
                { "id": 1, "title": "Task A", "status": "IN_PROGRESS", "position": 1 }
            ]
        }
    }
    ```
    → Frontend update cả 2 columns `TODO` và `IN_PROGRESS`

- **Notes**:
  - **Bulk Update**: Positions được update trực tiếp trong DB bằng JPQL, không load entity vào memory
  - **Incremental Sync**: Chỉ query lại columns bị ảnh hưởng, không query toàn bộ project
  - Frontend dùng key của map để biết columns nào cần update
  - Không cần gọi thêm API GET /tasks sau khi move
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

### 4.5 Cập nhật thông tin Task
- **URL**: `PUT /api/projects/{projectId}/tasks/{taskId}`
- **Auth Required**: Yes (Thành viên ACCEPTED của dự án)
- **Body** (JSON):
```json
{
    "title": "Thiết kế màn hình Login - Updated",
    "description": "Mô tả cập nhật cho task"
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Cập nhật task thành công",
    "data": {
        "id": 1,
        "title": "Thiết kế màn hình Login - Updated",
        "description": "Mô tả cập nhật cho task",
        "status": "TODO",
        "projectId": 1,
        "assigneeId": 5,
        "position": 0
    }
}
```
- **Business Rules**:
  - Chỉ cập nhật `title` và `description` của task.
  - Title và description sẽ được normalize (trim whitespace) trước khi lưu.
  - `TASK_UPDATED` activity log sẽ được tạo tự động với thông tin old/new values.
- **Error Cases**:
  - `403`: User không phải thành viên ACCEPTED của project.
  - `404`: Task không tồn tại hoặc không thuộc project.

### 4.6 Cập nhật trạng thái Task
- **URL**: `PUT /api/projects/{projectId}/tasks/{taskId}/status`
- **Auth Required**: Yes (Thành viên ACCEPTED của dự án)
- **Body** (JSON):
```json
{
    "status": "IN_PROGRESS"
}
```
- **Valid Status Values**: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Cập nhật trạng thái task thành công",
    "data": {
        "id": 1,
        "title": "Thiết kế màn hình Login",
        "description": "Mô tả task",
        "status": "IN_PROGRESS",
        "projectId": 1,
        "assigneeId": 5,
        "position": 0
    }
}
```
- **Business Rules**:
  - Các chuyển đổi trạng thái hợp lệ:
    - `TODO` → `IN_PROGRESS` (Bắt đầu task)
    - `IN_PROGRESS` → `DONE` (Hoàn thành task)
    - `TODO`/`IN_PROGRESS` → `CANCELLED` (Hủy task)
    - `CANCELLED` → `TODO` (Restart task)
    - `DONE` → `IN_PROGRESS` (Reopen task)
  - **Task chính chỉ được DONE khi tất cả sub-tasks đã DONE**:
    - Nếu còn bất kỳ sub-task nào chưa hoàn thành (khác DONE), task chính sẽ bị từ chối chuyển sang DONE.
    - Error message: `"Không thể hoàn thành task vì còn X sub-task chưa xong: [tên sub-task]. Vui lòng hoàn thành tất cả sub-task trước khi đánh dấu task chính hoàn thành."`
  - `TASK_STATUS_UPDATED` activity log sẽ được tạo tự động với thông tin old/new status.
- **Error Cases**:
  - `400`: Chuyển đổi trạng thái không hợp lệ (ví dụ: DONE → TODO trực tiếp).
  - `400`: Task chính không thể hoàn thành vì còn sub-task chưa hoàn thành.
  - `403`: User không phải thành viên ACCEPTED của project.
  - `404`: Task không tồn tại hoặc không thuộc project.

### 4.7 Xóa Task
- **URL**: `DELETE /api/projects/{projectId}/tasks/{taskId}`
- **Auth Required**: Yes (Thành viên ACCEPTED của dự án)
- **Path Params**:
  - `projectId` (Long, Required): ID của dự án
  - `taskId` (Long, Required): ID của task cần xóa
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Xóa task thành công",
    "data": null
}
```
- **Business Rules**:
  - Task phải tồn tại và thuộc project được chỉ định.
  - User phải là thành viên ACCEPTED của project.
  - `TASK_DELETED` activity log sẽ được tạo tự động.
- **Error Cases**:
  - `403`: User không phải thành viên ACCEPTED của project.
  - `404`: Task không tồn tại hoặc không thuộc project.

---

## 5. Audit Logs (Activity Logs)

> Ghi lại toàn bộ hoạt động trong project. Logs được ghi bất đồng bộ (async) để không ảnh hưởng hiệu năng.

### 5.1 Lấy Activity Logs của Project
- **URL**: `GET /api/projects/{projectId}/activity-logs`
- **Auth Required**: Yes (Thành viên ACCEPTED của project)
- **Query Params**:
  - `page` (Integer, optional, default: 0): Số trang
  - `size` (Integer, optional, default: 20, max: 100): Số logs mỗi trang
- **Ví dụ**: `GET /api/projects/1/activity-logs?page=0&size=20`
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Lấy activity logs thành công",
    "data": {
        "content": [
            {
                "id": 1,
                "user": {
                    "id": 5,
                    "username": "Nguyen Van A"
                },
                "actionType": "TASK_MOVED",
                "entityType": "TASK",
                "entityId": 10,
                "description": "Moved task from TODO to IN_PROGRESS",
                "metadata": {
                    "fromStatus": "TODO",
                    "toStatus": "IN_PROGRESS",
                    "fromPosition": 0,
                    "toPosition": 2
                },
                "createdAt": "2024-01-15T10:30:00"
            }
        ],
        "pageable": {
            "offset": 0,
            "pageNumber": 0,
            "pageSize": 20,
            "paged": true,
            "sort": {
                "empty": false,
                "sorted": true,
                "unsorted": false
            },
            "unpaged": false
        },
        "totalElements": 150,
        "totalPages": 8,
        "size": 20,
        "number": 0,
        "numberOfElements": 1,
        "first": true,
        "last": false,
        "empty": false,
        "sort": {
            "empty": false,
            "sorted": true,
            "unsorted": false
        }
    }
}
```
- **Action Types**:
  - `TASK_CREATED`: Tạo task mới
  - `TASK_UPDATED`: Update task (title, description)
  - `TASK_DELETED`: Xóa task
  - `TASK_MOVED`: Di chuyển task trong Kanban
  - `TASK_ASSIGNED`: Giao task cho user
  - `PROJECT_CREATED`: Tạo project
  - `PROJECT_UPDATED`: Cập nhật project
  - `PROJECT_DELETED`: Xóa project
  - `MEMBER_INVITED`: Mời thành viên
  - `MEMBER_JOINED`: Chấp nhận lời mời vào project
  - `SUBTASK_CREATED`: Tạo sub-task
  - `SUBTASK_UPDATED`: Cập nhật sub-task
  - `SUBTASK_DELETED`: Xóa sub-task
  - `ATTACHMENT_UPLOADED`: Upload file đính kèm
  - `ATTACHMENT_DELETED`: Xóa file đính kèm
- **Business Rules**:
  - Logs được sắp xếp theo `createdAt` giảm dần (mới nhất trước).
  - Pagination hỗ trợ tối đa 100 records mỗi request.
  - Logs là immutable - không thể sửa/xóa sau khi tạo.
- **Error Cases**:
  - `403`: User không phải thành viên của project.
  - `404`: Project không tồn tại.

---

## 6. Project Detail

### 6.1 Lấy chi tiết Project
- **URL**: `GET /api/projects/{projectId}`
- **Auth Required**: Yes (Thành viên ACCEPTED của project)
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Lấy chi tiết dự án thành công",
    "data": {
        "id": 1,
        "name": "Project Alpha",
        "description": "Mô tả dự án",
        "ownerId": 1,
        "members": [
            {
                "userId": 1,
                "username": "Nguyen Van A",
                "email": "a@example.com",
                "role": "OWNER",
                "invitationStatus": "ACCEPTED"
            },
            {
                "userId": 2,
                "username": "Tran Van B",
                "email": "b@example.com",
                "role": "MEMBER",
                "invitationStatus": "ACCEPTED"
            }
        ],
        "taskSummary": {
            "totalTasks": 10,
            "todoCount": 3,
            "inProgressCount": 4,
            "doneCount": 2,
            "cancelledCount": 1
        }
    }
}
```
- **Business Rules**:
  - Chỉ thành viên đã ACCEPTED lời mời mới có thể xem chi tiết project.
  - Task summary được tính tự động dựa trên số lượng task theo từng status.
- **Error Cases**:
  - `403`: User chưa chấp nhận lời mời vào project.
  - `404`: Project không tồn tại.

---

## 7. Task Search

### 7.1 Tìm kiếm Task theo từ khóa
- **URL**: `GET /api/projects/{projectId}/tasks/search?keyword={keyword}`
- **Auth Required**: Yes (Thành viên ACCEPTED của project)
- **Query Params**:
  - `keyword` (String, required): Từ khóa tìm kiếm trong title và description
- **Ví dụ**: `GET /api/projects/1/tasks/search?keyword=login`
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Tìm kiếm task thành công",
    "data": {
        "tasks": [
            {
                "id": 1,
                "title": "Implement login page",
                "description": "Create login form with validation",
                "status": "IN_PROGRESS",
                "projectId": 1,
                "assigneeId": 5,
                "position": 0
            }
        ],
        "totalCount": 1
    }
}
```
- **Business Rules**:
  - Tìm kiếm không phân biệt hoa thường (case-insensitive).
  - Tìm kiếm trong cả title và description của task.
  - Chỉ tìm kiếm trong project được chỉ định.
- **Error Cases**:
  - `403`: User không phải thành viên ACCEPTED của project.

---

## 8. User Profile

### 8.1 Lấy thông tin Profile User hiện tại
- **URL**: `GET /api/users/me`
- **Auth Required**: Yes
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Lấy thông tin profile thành công",
    "data": {
        "id": 1,
        "username": "Nguyen Van A",
        "email": "a@example.com",
        "isVerified": true,
        "totalProjects": 5,
        "totalTasks": 12
    }
}
```
- **Business Rules**:
  - `totalProjects`: Số project mà user là thành viên (kể cả PENDING, ACCEPTED).
  - `totalTasks`: Số task được assign cho user.

### 8.2 Cập nhật Profile User
- **URL**: `PUT /api/users/me`
- **Auth Required**: Yes
- **Request Body**:
```json
{
    "username": "Nguyen Van A Updated"
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Cập nhật profile thành công",
    "data": {
        "id": 1,
        "username": "Nguyen Van A Updated",
        "email": "a@example.com",
        "isVerified": true,
        "totalProjects": 5,
        "totalTasks": 12
    }
}
```
- **Validation Rules**:
  - `username`: Không được để trống.
- **Error Cases**:
  - `400`: Username để trống.

### 8.3 Đổi mật khẩu
- **URL**: `PUT /api/users/me/password`
- **Auth Required**: Yes
- **Request Body**:
```json
{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword456"
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Đổi mật khẩu thành công",
    "data": null
}
```
- **Validation Rules**:
  - `currentPassword`: Không được để trống.
  - `newPassword`: Tối thiểu 6 ký tự.
- **Business Rules**:
  - `currentPassword` phải khớp với mật khẩu hiện tại.
  - Mật khẩu mới được hash trước khi lưu.
- **Error Cases**:
  - `400`: Mật khẩu hiện tại không đúng.
  - `400`: Mật khẩu mới ít hơn 6 ký tự.

---

## 9. Attachments (File đính kèm Task)

> Quản lý file đính kèm cho từng task. File được upload lên server và lưu đường dẫn/URL trong database.

### 9.1 Upload file đính kèm
- **URL**: `POST /api/tasks/{taskId}/attachments`
- **Auth Required**: Yes (Thành viên ACCEPTED của project chứa task)
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file` (File, Required): File cần upload (max 10MB)
  - `description` (String, Optional): Mô tả file
- **Response** (201 Created):
```json
{
    "status": 201,
    "message": "Upload file thành công",
    "data": {
        "id": 1,
        "fileName": "design-mockup.png",
        "fileType": "image/png",
        "fileSize": 2048000,
        "fileUrl": "/uploads/attachments/2024/01/15/design-mockup-uuid.png",
        "description": "Mockup màn hình login",
        "uploadedBy": {
            "id": 1,
            "username": "Nguyen Van A"
        },
        "uploadedAt": "2024-01-15T10:30:00",
        "taskId": 5
    }
}
```
- **Business Rules**:
  - User phải là thành viên ACCEPTED của project chứa task.
  - File size tối đa: 10MB.
  - Allowed types: `image/*`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`.
  - File được lưu trữ với tên unique (UUID) để tránh trùng lặp.
  - `ATTACHMENT_UPLOADED` activity log sẽ được tạo tự động.
- **Error Cases**:
  - `400`: File quá lớn (>10MB) hoặc định dạng không hỗ trợ.
  - `403`: User không phải thành viên ACCEPTED của project.
  - `404`: Task không tồn tại.

### 9.2 Lấy danh sách file đính kèm của Task
- **URL**: `GET /api/tasks/{taskId}/attachments`
- **Auth Required**: Yes (Thành viên ACCEPTED của project chứa task)
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Lấy danh sách file đính kèm thành công",
    "data": [
        {
            "id": 1,
            "fileName": "design-mockup.png",
            "fileType": "image/png",
            "fileSize": 2048000,
            "fileUrl": "/uploads/attachments/2024/01/15/design-mockup-uuid.png",
            "description": "Mockup màn hình login",
            "uploadedBy": {
                "id": 1,
                "username": "Nguyen Van A"
            },
            "uploadedAt": "2024-01-15T10:30:00",
            "taskId": 5
        },
        {
            "id": 2,
            "fileName": "requirements.docx",
            "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "fileSize": 1024000,
            "fileUrl": "/uploads/attachments/2024/01/15/requirements-uuid.docx",
            "description": "Tài liệu yêu cầu",
            "uploadedBy": {
                "id": 2,
                "username": "Tran Van B"
            },
            "uploadedAt": "2024-01-15T11:00:00",
            "taskId": 5
        }
    ]
}
```
- **Business Rules**:
  - Trả về danh sách file sắp xếp theo `uploadedAt` giảm dần (mới nhất trước).
  - Chỉ thành viên ACCEPTED của project mới có thể xem.
- **Error Cases**:
  - `403`: User không phải thành viên ACCEPTED của project.
  - `404`: Task không tồn tại.

### 9.3 Xóa file đính kèm
- **URL**: `DELETE /api/attachments/{attachmentId}`
- **Auth Required**: Yes (Người upload file HOẶC OWNER của project)
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Xóa file thành công",
    "data": null
}
```
- **Business Rules**:
  - Chỉ người upload file hoặc OWNER của project mới có quyền xóa.
  - File vật lý trên server cũng bị xóa.
  - `ATTACHMENT_DELETED` activity log sẽ được tạo tự động.
- **Error Cases**:
  - `403`: User không phải người upload và không phải OWNER.
  - `404`: File đính kèm không tồn tại.

### 9.4 Download file đính kèm
- **URL**: `GET /api/attachments/{attachmentId}/download`
- **Auth Required**: Yes (Thành viên ACCEPTED của project)
- **Response**: File binary với headers:
  - `Content-Type`: MIME type của file
  - `Content-Disposition`: `attachment; filename="original-filename.png"`
- **Business Rules**:
  - Chỉ thành viên ACCEPTED của project mới có thể download.
  - Trả về file gốc từ server.
- **Error Cases**:
  - `403`: User không phải thành viên ACCEPTED của project.
  - `404`: File đính kèm không tồn tại.

---

## 10. Dashboard Statistics (Thống kê tổng quan)

> API tổng hợp dữ liệu thống kê từ tất cả projects của user. Dùng cho dashboard overview để tránh gọi nhiều API riêng lẻ.

### 10.1 Get User Dashboard Stats
- **URL**: `GET /api/users/me/dashboard-stats`
- **Auth Required**: Yes
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Lấy thống kê dashboard thành công",
    "data": {
        "totalProjects": 5,
        "totalTasks": 42,
        "taskSummary": {
            "todoCount": 12,
            "inProgressCount": 8,
            "doneCount": 18,
            "cancelledCount": 4
        },
        "recentCompletedTasks": 3,
        "activeTasks": 20,
        "pendingInvitations": 2,
        "weeklyVelocity": [
            {"date": "2024-01-15", "completedCount": 2},
            {"date": "2024-01-16", "completedCount": 1},
            {"date": "2024-01-17", "completedCount": 3},
            {"date": "2024-01-18", "completedCount": 0},
            {"date": "2024-01-19", "completedCount": 4},
            {"date": "2024-01-20", "completedCount": 2},
            {"date": "2024-01-21", "completedCount": 1}
        ],
        "topProjects": [
            {
                "projectId": 1,
                "projectName": "Website Redesign",
                "totalTasks": 15,
                "doneCount": 8
            },
            {
                "projectId": 2,
                "projectName": "Mobile App",
                "totalTasks": 12,
                "doneCount": 5
            }
        ]
    }
}
```
- **Business Rules**:
  - Chỉ tính các project mà user là thành viên ACCEPTED.
  - `taskSummary` tổng hợp từ tất cả projects.
  - `recentCompletedTasks`: Số task DONE trong 7 ngày gần nhất.
  - `activeTasks`: Tổng số task có status TODO hoặc DOING.
  - `weeklyVelocity`: Thống kê task hoàn thành theo ngày trong 7 ngày gần nhất.
  - `topProjects`: 5 projects có nhiều task nhất (sắp xếp theo totalTasks giảm dần).
- **Performance**:
  - Backend thực hiện aggregation query thay vì gọi nhiều API riêng lẻ.
  - Nên cache kết quả 5 phút ở backend để giảm load database.
- **Error Cases**:
  - `401`: User chưa đăng nhập.
  - `429`: Rate limit nếu gọi quá nhiều (giới hạn 30 requests/phút).

---

## 11. File Upload Configuration

### 11.1 Storage Configuration
- **Storage Type**: Local filesystem (có thể mở rộng S3/Cloud sau)
- **Upload Directory**: `./uploads/attachments/{year}/{month}/{day}/`
- **Max File Size**: 10MB
- **Allowed MIME Types**:
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - Text: `text/plain`

---

## 12. Sub-tasks (Công việc con)

> Quản lý sub-tasks cho từng task chính. Sub-task có thể được thêm, sửa, xóa riêng biệt sau khi task chính được tạo.

### 12.1 Create Sub-task (Thêm công việc con)
- **URL**: `POST /api/tasks/{taskId}/subtasks`
- **Auth Required**: Yes (Thành viên ACCEPTED của project)
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
    "title": "Implement login UI",
    "description": "Tạo form đăng nhập với email và password",
    "assigneeId": 2,
    "priority": "HIGH"
}
```
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | String | Yes | Tiêu đề sub-task |
| description | String | No | Mô tả chi tiết |
| assigneeId | Long | No | ID người được giao |
| priority | String | No | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Default: `MEDIUM` |

- **Response** (201 Created):
```json
{
    "status": 201,
    "message": "Tạo sub-task thành công",
    "data": {
        "id": 1,
        "taskId": 5,
        "title": "Implement login UI",
        "description": "Tạo form đăng nhập với email và password",
        "assignee": {
            "id": 2,
            "name": "Nguyen Van B"
        },
        "priority": "HIGH",
        "status": "TODO",
        "position": 0,
        "createdAt": "2024-01-15T10:30:00",
        "updatedAt": "2024-01-15T10:30:00"
    }
}
```
- **Business Rules**:
  - User phải là thành viên ACCEPTED của project chứa task chính.
  - `assigneeId` nếu có, phải là thành viên của project.
  - `position` tự động tính (append vào cuối danh sách sub-tasks).
  - Activity log `SUBTASK_CREATED` được tạo.
- **Error Cases**:
  - `400`: Title trống hoặc quá dài (>200 ký tự).
  - `403`: User không có quyền.
  - `404`: Task chính không tồn tại.
  - `400`: Assignee không phải thành viên project.

### 12.2 Update Sub-task (Sửa công việc con)
- **URL**: `PUT /api/subtasks/{subtaskId}`
- **Auth Required**: Yes (Thành viên ACCEPTED của project)
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
    "title": "Implement login UI with validation",
    "description": "Thêm validate email format",
    "assigneeId": 3,
    "priority": "CRITICAL",
    "status": "IN_PROGRESS"
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Cập nhật sub-task thành công",
    "data": {
        "id": 1,
        "taskId": 5,
        "title": "Implement login UI with validation",
        "description": "Thêm validate email format",
        "assignee": {
            "id": 3,
            "name": "Tran Van C"
        },
        "priority": "CRITICAL",
        "status": "IN_PROGRESS",
        "position": 0,
        "createdAt": "2024-01-15T10:30:00",
        "updatedAt": "2024-01-15T14:20:00"
    }
}
```
- **Business Rules**:
  - Chỉ thành viên ACCEPTED mới được cập nhật.
  - Các field không gửi sẽ giữ nguyên giá trị cũ.
  - Nếu `status` chuyển sang `DONE`, có thể trigger update progress task chính.
  - Activity log `SUBTASK_UPDATED` được tạo.
- **Error Cases**:
  - `404`: Sub-task không tồn tại.
  - `403`: User không có quyền.
  - `400`: Assignee không hợp lệ.

### 12.3 Delete Sub-task (Xóa công việc con)
- **URL**: `DELETE /api/subtasks/{subtaskId}`
- **Auth Required**: Yes (Thành viên ACCEPTED của project)
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Xóa sub-task thành công",
    "data": null
}
```
- **Business Rules**:
  - Sub-task bị xóa hoàn toàn (hard delete).
  - Reorder position của các sub-task còn lại.
  - Activity log `SUBTASK_DELETED` được tạo.
- **Error Cases**:
  - `404`: Sub-task không tồn tại.
  - `403`: User không có quyền.

### 12.4 Get Sub-tasks of Task (Lấy danh sách công việc con)
- **URL**: `GET /api/tasks/{taskId}/subtasks`
- **Auth Required**: Yes (Thành viên ACCEPTED của project)
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Lấy danh sách sub-tasks thành công",
    "data": [
        {
            "id": 1,
            "taskId": 5,
            "title": "Implement login UI",
            "description": "...",
            "assignee": {
                "id": 2,
                "name": "Nguyen Van B"
            },
            "priority": "HIGH",
            "status": "DONE",
            "position": 0,
            "createdAt": "2024-01-15T10:30:00",
            "updatedAt": "2024-01-15T16:00:00"
        },
        {
            "id": 2,
            "taskId": 5,
            "title": "Implement register UI",
            "description": "...",
            "assignee": null,
            "priority": "MEDIUM",
            "status": "TODO",
            "position": 1,
            "createdAt": "2024-01-15T11:00:00",
            "updatedAt": "2024-01-15T11:00:00"
        }
    ]
}
```
- **Query Parameters**:
  - `status` (optional): Filter theo status (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`).
  - `sort` (optional): `position`, `createdAt`, `priority`. Default: `position`.
- **Business Rules**:
  - Trả về danh sách sorted theo `position` ASC.
  - Include thông tin assignee (nếu có).

### 12.5 Reorder Sub-tasks (Sắp xếp lại vị trí)
- **URL**: `PUT /api/tasks/{taskId}/subtasks/reorder`
- **Auth Required**: Yes (Thành viên ACCEPTED của project)
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
    "subtaskIds": [2, 1, 3]
}
```
- **Response** (200 OK):
```json
{
    "status": 200,
    "message": "Sắp xếp lại sub-tasks thành công",
    "data": null
}
```
- **Business Rules**:
  - `subtaskIds` phải chứa đủ và đúng các ID hiện có.
  - Position sẽ được update theo thứ tự trong array.

