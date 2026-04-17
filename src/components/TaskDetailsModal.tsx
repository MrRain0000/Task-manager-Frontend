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
} from 'react-icons/fi'
import { useState, useEffect, useCallback } from 'react'
import { getTaskDetail, getActivityLogs, updateTask, assignTask, deleteTask, type Task, type ActivityLog, type ProjectMember } from '../services/api'

interface TaskDetailsModalProps {
  projectId: number
  taskId: number
  isOpen: boolean
  onClose: () => void
  members: ProjectMember[]
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: number) => void
}

interface SubTask {
  id: string
  title: string
  completed: boolean
}

interface Attachment {
  id: string
  name: string
  size: string
  type: 'pdf' | 'image' | 'other'
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

  // Mock subtasks - in a real app, these would come from the API
  const [subTasks, setSubTasks] = useState<SubTask[]>([
    { id: '1', title: 'Audit accessibility for color palette', completed: true },
    { id: '2', title: 'Standardize spacing tokens (4, 12, 16)', completed: true },
    { id: '3', title: 'Refine SideNavBar glassmorphism effect', completed: false },
    { id: '4', title: 'Export SVG icons for dashboard', completed: false },
  ])

  // Mock attachments
  const [attachments] = useState<Attachment[]>([
    { id: '1', name: 'Style_Guide_v2.pdf', size: '2.4 MB', type: 'pdf' },
    { id: '2', name: 'Header_Layout.png', size: '1.8 MB', type: 'image' },
  ])

  // Mock labels
  const [labels] = useState<string[]>(['UI/UX', 'High Priority'])

  const loadTaskData = useCallback(async () => {
    if (!isOpen) return
    
    setIsLoading(true)
    try {
      const [taskRes, logsRes] = await Promise.all([
        getTaskDetail(projectId, taskId),
        getActivityLogs(projectId, 0, 10),
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

  const toggleSubTask = (subTaskId: string) => {
    setSubTasks((prev) =>
      prev.map((st) => (st.id === subTaskId ? { ...st, completed: !st.completed } : st))
    )
  }

  const completedSubTasks = subTasks.filter((st) => st.completed).length

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
                  <Text fontSize="sm" color="gray.500">
                    {completedSubTasks}/{subTasks.length} Complete
                  </Text>
                </HStack>

                <VStack align="stretch" gap={2} pl={6}>
                  {subTasks.map((subTask) => (
                    <HStack
                      key={subTask.id}
                      gap={3}
                      p={2}
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => toggleSubTask(subTask.id)}
                      _hover={{ bg: 'gray.50' }}
                      justify="space-between"
                    >
                      <HStack gap={3} flex={1}>
                        <Icon
                          as={subTask.completed ? FiCheckCircle : FiCircle}
                          color={subTask.completed ? 'brand.500' : 'gray.400'}
                          boxSize={5}
                        />
                        <Text
                          fontSize="sm"
                          textDecoration={subTask.completed ? 'line-through' : 'none'}
                          color={subTask.completed ? 'gray.400' : 'gray.700'}
                        >
                          {subTask.title}
                        </Text>
                      </HStack>
                      <Menu.Root onSelect={(details) => {
                        if (details.value === 'edit') setIsEditing(true)
                        if (details.value === 'delete') handleDeleteTask()
                      }}>
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
                          <Menu.Item value="edit">
                            <HStack gap={2}>
                              <Icon as={FiEdit2} boxSize={4} />
                              <Text>Chỉnh sửa</Text>
                            </HStack>
                          </Menu.Item>
                          <Menu.Item value="delete" color="red.500">
                            <HStack gap={2}>
                              <Icon as={FiTrash2} boxSize={4} />
                              <Text>Xóa</Text>
                            </HStack>
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Root>
                    </HStack>
                  ))}
                </VStack>
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
                    Attachments
                  </Text>
                  <Text fontSize="xs" color="brand.500" cursor="pointer">
                    Add
                  </Text>
                </HStack>
                <VStack align="stretch" gap={2}>
                  {attachments.map((attachment) => (
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
                    >
                      <Box
                        w={10}
                        h={10}
                        bg={attachment.type === 'pdf' ? 'red.50' : 'blue.50'}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon
                          as={attachment.type === 'pdf' ? FiPaperclip : FiPaperclip}
                          color={attachment.type === 'pdf' ? 'red.500' : 'blue.500'}
                        />
                      </Box>
                      <VStack align="start" gap={0} flex={1}>
                        <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                          {attachment.name}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {attachment.size}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
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
