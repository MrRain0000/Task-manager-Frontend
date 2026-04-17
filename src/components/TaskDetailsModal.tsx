import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Avatar,
  Button,
  Icon,
  Separator,
  Card,
  Menu,
} from '@chakra-ui/react'
import {
  FiX,
  FiShare2,
  FiMoreHorizontal,
  FiCheckCircle,
  FiCircle,
  FiPaperclip,
  FiArchive,
  FiCheckSquare,
  FiEdit2,
  FiTrash2,
  FiFile,
  FiImage,
  FiFileText,
} from 'react-icons/fi'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getTaskDetail,
  getActivityLogs,
  updateTask,
  assignTask,
  deleteTask,
  getTaskAttachments,
  uploadAttachment,
  deleteAttachment,
  downloadAttachment,
  getSubTasks,
  createSubTask,
  updateSubTask,
  deleteSubTask,
  reorderSubTasks,
  type Task,
  type ActivityLog,
  type ProjectMember,
  type Attachment,
  type SubTask,
} from '../services/api'

interface TaskDetailsModalProps {
  projectId: number
  taskId: number
  isOpen: boolean
  onClose: () => void
  members: ProjectMember[]
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: number) => void
}


export default function TaskDetailsModal({
  projectId,
  taskId,
  isOpen,
  onClose,
  members,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailsModalProps) {
  const [task, setTask] = useState<Task | null>(null)
  const [assignee, setAssignee] = useState<{ id: number; username: string; email: string } | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')

  // Subtasks state
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  const [isLoadingSubTasks, setIsLoadingSubTasks] = useState(false)
  const [isAddingSubTask, setIsAddingSubTask] = useState(false)
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('')
  const [editingSubTaskId, setEditingSubTaskId] = useState<number | null>(null)
  const [editingSubTaskTitle, setEditingSubTaskTitle] = useState('')

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock labels
  const [labels] = useState<string[]>(['UI/UX', 'High Priority'])

  const loadTaskData = useCallback(async () => {
    if (!isOpen) return
    
    setIsLoading(true)
    try {
      const [taskRes, logsRes, attachmentsRes] = await Promise.all([
        getTaskDetail(projectId, taskId),
        getActivityLogs(projectId, 0, 10),
        getTaskAttachments(taskId),
      ])
      
      setTask(taskRes.data)
      setAssignee(taskRes.data.assignee)
      setEditedTitle(taskRes.data.title)
      setEditedDescription(taskRes.data.description || '')
      
      // Filter activity logs for this task
      const taskLogs = logsRes.data.content.filter(
        (log) => log.entityType === 'TASK' && log.entityId === taskId
      )
      setActivityLogs(taskLogs)

      // Load attachments
      setAttachments(attachmentsRes.data || [])

      // Load subtasks
      setIsLoadingSubTasks(true)
      try {
        const subTasksRes = await getSubTasks(taskId)
        setSubTasks(subTasksRes.data || [])
      } catch (error) {
        console.error('Failed to load subtasks:', error)
      } finally {
        setIsLoadingSubTasks(false)
      }
    } catch (error) {
      console.error('Failed to load task details:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, taskId, isOpen])

  useEffect(() => {
    loadTaskData()
  }, [loadTaskData])

  const handleUpdateTask = async () => {
    if (!task) return
    
    try {
      const res = await updateTask(projectId, taskId, {
        title: editedTitle,
        description: editedDescription,
      })
      setTask(res.data)
      onTaskUpdated?.(res.data)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleAssignTask = async (memberId: number | null) => {
    try {
      const res = await assignTask(projectId, taskId, { assigneeId: memberId })
      setTask(res.data)
      
      if (memberId) {
        const member = members.find((m) => m.userId === memberId)
        if (member) {
          setAssignee({ id: member.userId, username: member.username, email: member.email })
        }
      } else {
        setAssignee(null)
      }
      
      onTaskUpdated?.(res.data)
    } catch (error) {
      console.error('Failed to assign task:', error)
    }
  }

  const handleDeleteTask = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa task này?')) return
    
    try {
      await deleteTask(projectId, taskId)
      onTaskDeleted?.(taskId)
      onClose()
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Xóa task thất bại')
    }
  }

  const handleAddAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const res = await uploadAttachment(taskId, file)
        setAttachments(prev => [...prev, res.data])
      }
    } catch (error) {
      console.error('Failed to upload attachment:', error)
      alert('Upload file thất bại')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAttachment = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa file này?')) return

    try {
      await deleteAttachment(id)
      setAttachments(prev => prev.filter(a => a.id !== id))
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      alert('Xóa file thất bại')
    }
  }

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const blob = await downloadAttachment(attachment.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download attachment:', error)
      alert('Download file thất bại')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return FiImage
    if (fileType.includes('pdf')) return FiFileText
    return FiFile
  }

  const getFileColor = (fileType: string) => {
    if (fileType.startsWith('image/')) return { bg: 'blue.50', color: 'blue.500' }
    if (fileType.includes('pdf')) return { bg: 'red.50', color: 'red.500' }
    return { bg: 'gray.50', color: 'gray.500' }
  }

  // Toggle subtask status (TODO <-> DONE)
  const toggleSubTask = async (subTaskId: number) => {
    const subTask = subTasks.find(st => st.id === subTaskId)
    if (!subTask) return

    const newStatus = subTask.status === 'DONE' ? 'TODO' : 'DONE'
    try {
      const res = await updateSubTask(subTaskId, { status: newStatus })
      setSubTasks(prev => prev.map(st => st.id === subTaskId ? res.data : st))
    } catch (error) {
      console.error('Failed to update subtask:', error)
      alert('Cập nhật sub-task thất bại')
    }
  }

  // Handle create subtask
  const handleCreateSubTask = async () => {
    if (!newSubTaskTitle.trim()) return
    try {
      const res = await createSubTask(taskId, { title: newSubTaskTitle.trim() })
      setSubTasks(prev => [...prev, res.data])
      setNewSubTaskTitle('')
      setIsAddingSubTask(false)
    } catch (error) {
      console.error('Failed to create subtask:', error)
      alert('Tạo sub-task thất bại')
    }
  }

  // Handle update subtask
  const handleUpdateSubTask = async (subtaskId: number) => {
    if (!editingSubTaskTitle.trim()) return
    try {
      const res = await updateSubTask(subtaskId, { title: editingSubTaskTitle.trim() })
      setSubTasks(prev => prev.map(st => st.id === subtaskId ? res.data : st))
      setEditingSubTaskId(null)
      setEditingSubTaskTitle('')
    } catch (error) {
      console.error('Failed to update subtask:', error)
      alert('Cập nhật sub-task thất bại')
    }
  }

  // Handle delete subtask
  const handleDeleteSubTask = async (subtaskId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa sub-task này?')) return
    try {
      await deleteSubTask(subtaskId)
      setSubTasks(prev => prev.filter(st => st.id !== subtaskId))
    } catch (error) {
      console.error('Failed to delete subtask:', error)
      alert('Xóa sub-task thất bại')
    }
  }

  // Start editing subtask
  const startEditingSubTask = (subTask: SubTask) => {
    setEditingSubTaskId(subTask.id)
    setEditingSubTaskTitle(subTask.title)
  }

  const completedSubTasks = subTasks.filter(st => st.status === 'DONE').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'orange'
      case 'IN_PROGRESS':
        return 'blue'
      case 'DONE':
        return 'green'
      case 'CANCELLED':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'To Do'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'DONE':
        return 'Done'
      case 'CANCELLED':
        return 'Cancelled'
      default:
        return status
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    return `${diffInDays} days ago`
  }

  if (!isOpen) return null

  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.500"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      onClick={onClose}
    >
      <Card.Root
        bg="white"
        borderRadius="2xl"
        w="full"
        maxW="900px"
        maxH="90vh"
        overflow="hidden"
        boxShadow="2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <Box p={8} textAlign="center">
            <Text color="gray.500">Loading...</Text>
          </Box>
        ) : task ? (
          <HStack align="stretch" gap={0} h="full">
            {/* Main Content */}
            <VStack
              align="stretch"
              gap={6}
              p={6}
              flex={1}
              overflowY="auto"
              maxH="90vh"
            >
              {/* Header */}
              <HStack justify="space-between" align="start">
                <HStack gap={3}>
                  <Icon as={FiCheckSquare} color="brand.500" boxSize={5} />
                  <Text fontSize="sm" color="gray.500" fontFamily="mono">
                    TASK-{task.id}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Button variant="ghost" size="sm">
                    <Icon as={FiShare2} />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Icon as={FiMoreHorizontal} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <Icon as={FiX} />
                  </Button>
                </HStack>
              </HStack>

              {/* Title */}
              {isEditing ? (
                <VStack align="stretch" gap={2}>
                  <input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      padding: '0.5rem',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.375rem',
                      width: '100%',
                    }}
                  />
                  <HStack gap={2}>
                    <Button size="sm" colorPalette="brand" onClick={handleUpdateTask}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Box onClick={() => setIsEditing(true)} cursor="pointer">
                  <Text fontSize="2xl" fontWeight="bold">
                    {task.title}
                  </Text>
                </Box>
              )}

              {/* Description */}
              {isEditing ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                    minHeight: '100px',
                    width: '100%',
                    resize: 'vertical',
                  }}
                />
              ) : (
                <Box onClick={() => setIsEditing(true)} cursor="pointer">
                  <Text color="gray.600" lineHeight="relaxed">
                    {task.description || 'No description provided.'}
                  </Text>
                </Box>
              )}

              {/* Sub-tasks */}
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <HStack gap={2}>
                    <Icon as={FiCheckSquare} color="gray.400" />
                    <Text fontWeight="semibold">Sub-tasks</Text>
                  </HStack>
                  <HStack gap={3}>
                    <Text fontSize="sm" color="gray.500">
                      {completedSubTasks}/{subTasks.length} Complete
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setIsAddingSubTask(true)}
                      disabled={isAddingSubTask}
                    >
                      + Thêm
                    </Button>
                  </HStack>
                </HStack>

                {/* Add subtask form */}
                {isAddingSubTask && (
                  <HStack gap={2} pl={6}>
                    <input
                      value={newSubTaskTitle}
                      onChange={(e) => setNewSubTaskTitle(e.target.value)}
                      placeholder="Nhập tên sub-task..."
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                      }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSubTask()
                        if (e.key === 'Escape') {
                          setIsAddingSubTask(false)
                          setNewSubTaskTitle('')
                        }
                      }}
                    />
                    <Button size="xs" colorPalette="brand" onClick={handleCreateSubTask}>
                      Lưu
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingSubTask(false)
                        setNewSubTaskTitle('')
                      }}
                    >
                      Hủy
                    </Button>
                  </HStack>
                )}

                {/* Loading state */}
                {isLoadingSubTasks ? (
                  <Box pl={6} py={2}>
                    <Text fontSize="sm" color="gray.400">Đang tải...</Text>
                  </Box>
                ) : (
                  <VStack align="stretch" gap={2} pl={6}>
                    {subTasks.length === 0 ? (
                      <Text fontSize="sm" color="gray.400" fontStyle="italic">
                        Chưa có sub-task nào. Nhấn "+ Thêm" để tạo mới.
                      </Text>
                    ) : (
                      subTasks.map((subTask) => {
                        const isDone = subTask.status === 'DONE'
                        const isEditing = editingSubTaskId === subTask.id

                        return (
                          <HStack
                            key={subTask.id}
                            gap={3}
                            p={2}
                            borderRadius="md"
                            cursor="pointer"
                            onClick={() => !isEditing && toggleSubTask(subTask.id)}
                            _hover={{ bg: 'gray.50' }}
                            justify="space-between"
                          >
                            {isEditing ? (
                              <HStack gap={2} flex={1}>
                                <input
                                  value={editingSubTaskTitle}
                                  onChange={(e) => setEditingSubTaskTitle(e.target.value)}
                                  style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                  }}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateSubTask(subTask.id)
                                    if (e.key === 'Escape') {
                                      setEditingSubTaskId(null)
                                      setEditingSubTaskTitle('')
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button size="xs" colorPalette="brand" onClick={(e) => { e.stopPropagation(); handleUpdateSubTask(subTask.id) }}>
                                  Lưu
                                </Button>
                                <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingSubTaskId(null); setEditingSubTaskTitle('') }}>
                                  Hủy
                                </Button>
                              </HStack>
                            ) : (
                              <>
                                <HStack gap={3} flex={1}>
                                  <Icon
                                    as={isDone ? FiCheckCircle : FiCircle}
                                    color={isDone ? 'brand.500' : 'gray.400'}
                                    boxSize={5}
                                  />
                                  <Text
                                    fontSize="sm"
                                    textDecoration={isDone ? 'line-through' : 'none'}
                                    color={isDone ? 'gray.400' : 'gray.700'}
                                  >
                                    {subTask.title}
                                  </Text>
                                  {subTask.assignee && (
                                    <Badge size="sm" variant="subtle" colorPalette="gray">
                                      {subTask.assignee.name}
                                    </Badge>
                                  )}
                                </HStack>
                                <Menu.Root>
                                  <Menu.Trigger asChild>
                                    <Box
                                      p={1}
                                      borderRadius="md"
                                      _hover={{ bg: 'gray.200' }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Icon as={FiMoreHorizontal} boxSize={4} color="gray.400" />
                                    </Box>
                                  </Menu.Trigger>
                                  <Menu.Content>
                                    <Menu.Item value="edit" onClick={() => startEditingSubTask(subTask)}>
                                      <HStack gap={2}>
                                        <Icon as={FiEdit2} boxSize={4} />
                                        <Text>Chỉnh sửa</Text>
                                      </HStack>
                                    </Menu.Item>
                                    <Menu.Item value="delete" color="red.500" onClick={() => handleDeleteSubTask(subTask.id)}>
                                      <HStack gap={2}>
                                        <Icon as={FiTrash2} boxSize={4} />
                                        <Text>Xóa</Text>
                                      </HStack>
                                    </Menu.Item>
                                  </Menu.Content>
                                </Menu.Root>
                              </>
                            )}
                          </HStack>
                        )
                      })
                    )}
                  </VStack>
                )}
              </VStack>

              {/* Activity */}
              <VStack align="stretch" gap={3}>
                <HStack gap={2}>
                  <Box w={5} h={5} display="flex" alignItems="center" justifyContent="center">
                    <Box w={4} h={4} bg="gray.300" borderRadius="sm" />
                  </Box>
                  <Text fontWeight="semibold">Activity</Text>
                </HStack>

                <VStack align="stretch" gap={3} pl={6}>
                  {activityLogs.length === 0 ? (
                    <Text fontSize="sm" color="gray.400" fontStyle="italic">
                      No activity yet
                    </Text>
                  ) : (
                    activityLogs.map((log) => (
                      <HStack key={log.id} gap={3} align="start">
                        <Avatar.Root size="sm">
                          <Avatar.Fallback name={log.user.username} />
                        </Avatar.Root>
                        <VStack align="stretch" gap={0}>
                          <HStack gap={1}>
                            <Text fontSize="sm" fontWeight="medium">
                              {log.user.username}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              {formatTimeAgo(log.createdAt)}
                            </Text>
                          </HStack>
                          <Box
                            bg="gray.50"
                            p={2}
                            borderRadius="md"
                            borderLeft="3px solid"
                            borderLeftColor="brand.200"
                          >
                            <Text fontSize="sm" color="gray.600">
                              {log.description}
                            </Text>
                          </Box>
                        </VStack>
                      </HStack>
                    ))
                  )}
                </VStack>
              </VStack>
            </VStack>

            {/* Sidebar */}
            <VStack
              align="stretch"
              gap={6}
              p={6}
              w="280px"
              bg="gray.50"
              borderLeft="1px solid"
              borderColor="gray.100"
            >
              {/* Assignee */}
              <VStack align="stretch" gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">
                  Assignee
                </Text>
                <VStack align="stretch" gap={1}>
                  {assignee ? (
                    <HStack gap={2}>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback name={assignee.username} />
                      </Avatar.Root>
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {assignee.username}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Design Lead
                        </Text>
                      </VStack>
                    </HStack>
                  ) : (
                    <Text fontSize="sm" color="gray.400" fontStyle="italic">
                      Unassigned
                    </Text>
                  )}
                  
                  {/* Member selection dropdown */}
                  <select
                    style={{
                      fontSize: '0.875rem',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #E5E7EB',
                      backgroundColor: 'white',
                      width: '100%',
                    }}
                    onChange={(e) => {
                      const value = e.target.value
                      handleAssignTask(value ? parseInt(value) : null)
                    }}
                    value={assignee?.id || ''}
                  >
                    <option value="">Assign to...</option>
                    {members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.username}
                      </option>
                    ))}
                  </select>
                </VStack>
              </VStack>

              {/* Status */}
              <VStack align="stretch" gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">
                  Status
                </Text>
                <Badge
                  colorPalette={getStatusColor(task.status)}
                  size="md"
                  py={1}
                  px={3}
                  borderRadius="md"
                  w="fit-content"
                >
                  <HStack gap={1}>
                    <Box w={2} h={2} bg="currentColor" borderRadius="full" />
                    <Text>{getStatusLabel(task.status)}</Text>
                  </HStack>
                </Badge>
              </VStack>

              {/* Due Date */}
              <VStack align="stretch" gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">
                  Due Date
                </Text>
                <Text fontSize="sm" color="gray.700">
                  Oct 24, 2023
                </Text>
              </VStack>

              <Separator />

              {/* Labels */}
              <VStack align="stretch" gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">
                  Labels
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  {labels.map((label) => (
                    <Badge
                      key={label}
                      variant="subtle"
                      colorPalette={label === 'High Priority' ? 'red' : 'blue'}
                      size="sm"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                    >
                      {label}
                    </Badge>
                  ))}
                  <Button variant="ghost" size="xs" borderRadius="full">
                    +
                  </Button>
                </HStack>
              </VStack>

              {/* Attachments */}
              <VStack align="stretch" gap={2}>
                <HStack justify="space-between">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase">
                    Attachments ({attachments.length})
                  </Text>
                  <Text
                    fontSize="xs"
                    color="brand.500"
                    cursor="pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    + Add
                  </Text>
                </HStack>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAddAttachment}
                  multiple
                />
                <VStack align="stretch" gap={2}>
                  {isUploading && (
                    <Text fontSize="sm" color="brand.500" textAlign="center" py={2}>
                      Đang upload...
                    </Text>
                  )}
                  {attachments.map((attachment) => {
                    const fileColors = getFileColor(attachment.fileType)
                    const FileIcon = getFileIcon(attachment.fileType)
                    return (
                      <HStack
                        key={attachment.id}
                        gap={3}
                        p={2}
                        bg="white"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.100"
                        cursor="pointer"
                        _hover={{ borderColor: 'gray.200', bg: 'gray.50' }}
                        onClick={() => handleDownloadAttachment(attachment)}
                      >
                        <Box
                          w={10}
                          h={10}
                          bg={fileColors.bg}
                          borderRadius="md"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FileIcon} color={fileColors.color} boxSize={5} />
                        </Box>
                        <VStack align="start" gap={0} flex={1}>
                          <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                            {attachment.fileName}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {formatFileSize(attachment.fileSize)}
                          </Text>
                        </VStack>
                        <Icon
                          as={FiX}
                          boxSize={4}
                          color="gray.400"
                          cursor="pointer"
                          _hover={{ color: 'red.500' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveAttachment(attachment.id)
                          }}
                        />
                      </HStack>
                    )
                  })}
                </VStack>
              </VStack>

              {/* Archive Button */}
              <Button
                variant="ghost"
                size="sm"
                w="full"
                mt="auto"
                color="gray.500"
                _hover={{ color: 'red.500', bg: 'red.50' }}
              >
                <Icon as={FiArchive} mr={2} />
                Archive Task
              </Button>
            </VStack>
          </HStack>
        ) : null}
      </Card.Root>
    </Box>
  )
}
