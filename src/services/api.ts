const API_BASE_URL = 'http://localhost:8080'

function getToken(): string | null {
  return localStorage.getItem('token')
}

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>()
const RATE_LIMIT_RETRY_DELAY = 2000 // 2 seconds

function getRequestKey(endpoint: string, options: RequestInit): string {
  return `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || '')}`
}

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  username: string
  email: string
  password: string
}

interface CreateProjectRequest {
  name: string
  description: string
}

interface UpdateProjectRequest {
  name: string
  description: string
}

interface CreateTaskRequest {
  title: string
  description: string
}

interface UpdateTaskRequest {
  title: string
  description: string
}

interface UpdateTaskStatusRequest {
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
}

interface MoveTaskRequest {
  toStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
  toPosition: number
}

interface AssignTaskRequest {
  assigneeId: number | null
}

interface RespondInvitationRequest {
  isAccept: boolean
}

interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface User {
  id: number
  username: string
  email: string
  isVerified: boolean
}

interface AuthData {
  accessToken: string
  tokenType: string
}

export interface Project {
  id: number
  name: string
  description: string
  ownerId: number
  createdAt: string
  memberCount?: number
  members?: { userId: number; username: string; isVerified?: boolean }[]
}

export interface Task {
  id: number
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
  projectId: number
  assigneeId: number | null
  position: number
}

export interface Invitation {
  id: number
  projectId: number
  projectName: string
  role: 'OWNER' | 'MEMBER'
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

export interface ProjectMember {
  userId: number
  username: string
  email: string
  role: 'OWNER' | 'MEMBER'
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  isVerified?: boolean
}

export interface ProjectDetail extends Project {
  members: ProjectMember[]
  taskSummary: {
    totalTasks: number
    todoCount: number
    inProgressCount: number
    doneCount: number
    cancelledCount: number
  }
}

export interface ActivityLog {
  id: number
  user: {
    id: number
    username: string
  }
  actionType: string
  entityType: string
  entityId: number
  description: string
  metadata: Record<string, any>
  createdAt: string
}

async function fetchApiWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getToken()

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)
  const data = await response.json()

  // Handle 429 rate limit with retry
  if (response.status === 429 && retryCount < 2) {
    console.log(`[API] Rate limited (429), retrying after ${RATE_LIMIT_RETRY_DELAY}ms...`)
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_RETRY_DELAY))
    return fetchApiWithRetry<T>(endpoint, options, retryCount + 1)
  }

  if (!response.ok) {
    const error = new Error(data.message || `HTTP error! status: ${response.status}`)
    ;(error as any).status = response.status
    throw error
  }

  return data
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const requestKey = getRequestKey(endpoint, options)

  // Check for pending request (deduplication)
  if (pendingRequests.has(requestKey)) {
    console.log('[API] Deduplicating request:', requestKey)
    return pendingRequests.get(requestKey) as Promise<ApiResponse<T>>
  }

  // Create new request
  const requestPromise = fetchApiWithRetry<T>(endpoint, options).finally(() => {
    // Remove from pending after completion
    pendingRequests.delete(requestKey)
  })

  // Store in pending requests
  pendingRequests.set(requestKey, requestPromise)

  return requestPromise
}

// Auth APIs
export async function login(request: LoginRequest): Promise<ApiResponse<AuthData>> {
  return fetchApi<AuthData>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function register(request: RegisterRequest): Promise<ApiResponse<{ id: number; username: string; email: string }>> {
  return fetchApi<{ id: number; username: string; email: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function loginWithGoogle(idToken: string): Promise<ApiResponse<AuthData>> {
  return fetchApi<AuthData>('/api/auth/login/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })
}

export async function verifyEmail(token: string): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/api/auth/verify?token=${token}`, {
    method: 'GET',
  })
}

export async function resendVerification(email: string): Promise<ApiResponse<null>> {
  return fetchApi<null>('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// Project APIs
export async function getProjects(): Promise<ApiResponse<{ projects: Project[]; totalProjects: number }>> {
  return fetchApi<{ projects: Project[]; totalProjects: number }>('/api/projects', {
    method: 'GET',
  })
}

export async function createProject(request: CreateProjectRequest): Promise<ApiResponse<Project>> {
  return fetchApi<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function updateProject(projectId: number, request: UpdateProjectRequest): Promise<ApiResponse<Project>> {
  return fetchApi<Project>(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export async function deleteProject(projectId: number): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/api/projects/${projectId}`, {
    method: 'DELETE',
  })
}

// Task APIs
export async function getTasks(projectId: number, status?: string): Promise<ApiResponse<Task[]>> {
  const query = status ? `?status=${status}` : ''
  return fetchApi<Task[]>(`/api/projects/${projectId}/tasks${query}`, {
    method: 'GET',
  })
}

export async function getTaskDetail(projectId: number, taskId: number): Promise<ApiResponse<Task & { project: { id: number; name: string }; assignee: { id: number; username: string; email: string } | null }>> {
  return fetchApi<Task & { project: { id: number; name: string }; assignee: { id: number; username: string; email: string } | null }>(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'GET',
  })
}

export async function createTask(projectId: number, request: CreateTaskRequest): Promise<ApiResponse<Task>> {
  return fetchApi<Task>(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function moveTask(projectId: number, taskId: number, request: MoveTaskRequest): Promise<ApiResponse<Task[]>> {
  return fetchApi<Task[]>(`/api/projects/${projectId}/tasks/${taskId}/move`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function assignTask(projectId: number, taskId: number, request: AssignTaskRequest): Promise<ApiResponse<Task>> {
  return fetchApi<Task>(`/api/projects/${projectId}/tasks/${taskId}/assign`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function updateTask(projectId: number, taskId: number, request: UpdateTaskRequest): Promise<ApiResponse<Task>> {
  return fetchApi<Task>(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export async function updateTaskStatus(projectId: number, taskId: number, request: UpdateTaskStatusRequest): Promise<ApiResponse<Task>> {
  return fetchApi<Task>(`/api/projects/${projectId}/tasks/${taskId}/status`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export async function deleteTask(projectId: number, taskId: number): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

export async function searchTasks(projectId: number, keyword: string): Promise<ApiResponse<{ tasks: Task[]; totalCount: number }>> {
  return fetchApi<{ tasks: Task[]; totalCount: number }>(`/api/projects/${projectId}/tasks/search?keyword=${encodeURIComponent(keyword)}`, {
    method: 'GET',
  })
}

// Invitation APIs
export async function inviteMember(projectId: number, inviteeEmail: string): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/api/projects/${projectId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ inviteeEmail }),
  })
}

export async function getMyInvitations(): Promise<Invitation[]> {
  // Use fetchApi with retry logic, then extract the array data
  const response = await fetchApi<Invitation[]>('/api/users/me/invitations', {
    method: 'GET',
  })
  // API trả về array trực tiếp trong data
  return response.data || []
}

export async function respondToInvitation(projectId: number, request: RespondInvitationRequest): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/api/projects/${projectId}/invitations/respond`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// Project Detail API (includes members)
export async function getProjectDetail(projectId: number): Promise<ApiResponse<ProjectDetail>> {
  return fetchApi<ProjectDetail>(`/api/projects/${projectId}`, {
    method: 'GET',
  })
}

// User Profile APIs
export async function getCurrentUser(): Promise<ApiResponse<User & { totalProjects: number; totalTasks: number }>> {
  return fetchApi<User & { totalProjects: number; totalTasks: number }>('/api/users/me', {
    method: 'GET',
  })
}

export async function updateUserProfile(username: string): Promise<ApiResponse<User & { totalProjects: number; totalTasks: number }>> {
  return fetchApi<User & { totalProjects: number; totalTasks: number }>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify({ username }),
  })
}

export async function changeUserPassword(currentPassword: string, newPassword: string): Promise<ApiResponse<null>> {
  return fetchApi<null>('/api/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

// Activity Logs APIs
export async function getActivityLogs(projectId: number, page: number = 0, size: number = 20): Promise<ApiResponse<{
  content: ActivityLog[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}>> {
  return fetchApi<{
    content: ActivityLog[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }>(`/api/projects/${projectId}/activity-logs?page=${page}&size=${size}`, {
    method: 'GET',
  })
}