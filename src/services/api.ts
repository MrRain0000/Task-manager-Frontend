const API_BASE_URL = 'https://task-managementclean-architecture-production.up.railway.app'

function getToken(): string | null {
  return localStorage.getItem('token')
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

interface CreateTaskRequest {
  title: string
  description: string
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
  user: User
}

export interface Project {
  id: number
  name: string
  description: string
  ownerId: number
  createdAt: string
  updatedAt: string
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
  id: number
  userId: number
  username: string
  email: string
  role: 'OWNER' | 'MEMBER'
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
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

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`)
  }

  return data
}

// Auth APIs
export async function login(request: LoginRequest): Promise<ApiResponse<AuthData>> {
  return fetchApi<AuthData>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function register(request: RegisterRequest): Promise<ApiResponse<AuthData>> {
  return fetchApi<AuthData>('/api/auth/register', {
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

// Project APIs
export async function createProject(request: CreateProjectRequest): Promise<ApiResponse<Project>> {
  return fetchApi<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function deleteProject(projectId: number): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/api/projects/${projectId}`, {
    method: 'DELETE',
  })
}

export async function getProjects(): Promise<ApiResponse<Project[]>> {
  return fetchApi<Project[]>('/api/projects', {
    method: 'GET',
  })
}

// Task APIs
export async function createTask(projectId: number, request: CreateTaskRequest): Promise<ApiResponse<Task>> {
  return fetchApi<Task>(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export async function getTasks(projectId: number, status?: string): Promise<ApiResponse<Task[]>> {
  const query = status ? `?status=${status}` : ''
  return fetchApi<Task[]>(`/api/projects/${projectId}/tasks${query}`, {
    method: 'GET',
  })
}

export async function moveTask(projectId: number, taskId: number, request: MoveTaskRequest): Promise<ApiResponse<Task>> {
  return fetchApi<Task>(`/api/projects/${projectId}/tasks/${taskId}/move`, {
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

// Invitation APIs
export async function inviteMember(projectId: number, inviteeEmail: string): Promise<ApiResponse<Invitation>> {
  return fetchApi<Invitation>(`/api/projects/${projectId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ inviteeEmail }),
  })
}

export async function getMyInvitations(): Promise<ApiResponse<Invitation[]>> {
  return fetchApi<Invitation[]>('/api/users/me/invitations', {
    method: 'GET',
  })
}

export async function respondToInvitation(projectId: number, request: RespondInvitationRequest): Promise<ApiResponse<null>> {
  return fetchApi<null>(`/api/projects/${projectId}/invitations/respond`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// Team/Members APIs
export async function getProjectMembers(projectId: number): Promise<ApiResponse<ProjectMember[]>> {
  return fetchApi<ProjectMember[]>(`/api/projects/${projectId}/members`, {
    method: 'GET',
  })
}
