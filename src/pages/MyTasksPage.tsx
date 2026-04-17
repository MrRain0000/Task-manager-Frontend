import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Icon,
  Badge,
  Avatar,
  Input,
  Progress,
} from '@chakra-ui/react'
import { FiPlus, FiSearch, FiFilter, FiGrid, FiList, FiCheckSquare } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, getTasks, getCurrentUser, type Project, type Task } from '../services/api'
import Layout from '../components/Layout'

interface TaskWithProject extends Task {
  project: Project
}

export default function MyTasksPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TaskWithProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    loadCurrentUserAndTasks()
  }, [])

  const loadCurrentUserAndTasks = async () => {
    try {
      // Get current user
      const userRes = await getCurrentUser()
      const user = userRes.data
      setCurrentUser(user)

      // Get all projects
      const projectsRes = await getProjects()
      const projects = projectsRes.data.projects

      // Get all tasks from each project
      const allTasks: TaskWithProject[] = []
      for (const project of projects) {
        try {
          const tasksRes = await getTasks(project.id)
          const projectTasks = tasksRes.data
            .filter((task: Task) => task.assigneeId === user.id)
            .map((task: Task) => ({ ...task, project }))
          allTasks.push(...projectTasks)
        } catch (error) {
          console.error(`Failed to load tasks for project ${project.id}:`, error)
        }
      }

      setTasks(allTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'orange'
      case 'IN_PROGRESS': return 'blue'
      case 'DONE': return 'green'
      case 'CANCELLED': return 'red'
      default: return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO': return 'To Do'
      case 'IN_PROGRESS': return 'In Progress'
      case 'DONE': return 'Completed'
      case 'CANCELLED': return 'Cancelled'
      default: return status
    }
  }

  const getPriorityBadge = (status: string) => {
    // For now, use status to determine priority color
    if (status === 'DONE') return null
    if (status === 'IN_PROGRESS') return (
      <Badge colorPalette="red" variant="solid" size="sm">
        <Text as="span" color="red.500">!</Text>
      </Badge>
    )
    return null
  }

  return (
    <Layout>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Box>
            <Heading size="xl" mb={2}>My Tasks</Heading>
            <Text color="gray.500">View and manage all your assigned tasks across projects</Text>
          </Box>
          <Button colorPalette="brand">
            <Icon as={FiPlus} mr={2} />
            Create Task
          </Button>
        </HStack>

        {/* Stats Cards */}
        <HStack gap={4}>
          <Card.Root bg="white" borderRadius="2xl" p={6} flex={1}>
            <Text fontSize="sm" color="gray.500" mb={2}>PROGRESS OVERVIEW</Text>
            <HStack align="end" gap={2}>
              <Heading size="2xl" color="blue.600">
                {Math.round(tasks.filter(t => t.status === 'DONE').length / (tasks.length || 1) * 100)}%
              </Heading>
            </HStack>
            <Progress.Root value={tasks.filter(t => t.status === 'DONE').length / (tasks.length || 1) * 100} size="sm" mt={3}>
              <Progress.Track bg="gray.200">
                <Progress.Range bg="blue.600" />
              </Progress.Track>
            </Progress.Root>
            <Text fontSize="sm" color="gray.500" mt={2}>
              {tasks.filter(t => t.status === 'DONE').length} of {tasks.length} tasks completed
            </Text>
          </Card.Root>

          <Card.Root bg="orange.50" borderRadius="2xl" p={6} flex={1} border="1px solid" borderColor="orange.200">
            <Text fontSize="sm" color="orange.600" mb={2} fontWeight="semibold">ACTIVE SPRINT</Text>
            <Heading size="lg" color="orange.700">
              {tasks.filter(t => t.status === 'IN_PROGRESS').length} Active
            </Heading>
            <Text fontSize="sm" color="orange.600" mt={2}>
              tasks in progress
            </Text>
          </Card.Root>

          <Card.Root bg="blue.50" borderRadius="2xl" p={6} flex={1} border="1px solid" borderColor="blue.200">
            <Text fontSize="sm" color="blue.600" mb={2} fontWeight="semibold">TOTAL ASSIGNED</Text>
            <Heading size="lg" color="blue.700">
              {tasks.length} Tasks
            </Heading>
            <Text fontSize="sm" color="blue.600" mt={2}>
              across all projects
            </Text>
          </Card.Root>
        </HStack>

        {/* Search & Filter */}
        <HStack justify="space-between">
          <HStack gap={2} maxW="400px">
            <Icon as={FiSearch} color="gray.400" />
            <Input
              placeholder="Search task name, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </HStack>
          <HStack gap={2}>
            <Button variant="ghost" size="sm">
              <Icon as={FiFilter} mr={2} />
              Filter
            </Button>
            <HStack gap={1} bg="gray.100" p={1} borderRadius="md">
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'solid' : 'ghost'}
                onClick={() => setViewMode('list')}
              >
                <Icon as={FiList} />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                onClick={() => setViewMode('grid')}
              >
                <Icon as={FiGrid} />
              </Button>
            </HStack>
          </HStack>
        </HStack>

        {/* Task List */}
        {isLoading ? (
          <Text color="gray.500" textAlign="center" py={8}>Loading tasks...</Text>
        ) : filteredTasks.length === 0 ? (
          <Card.Root bg="white" borderRadius="2xl" p={12} textAlign="center">
            <Icon as={FiCheckSquare} boxSize={12} color="gray.300" mx="auto" mb={4} />
            <Heading size="md" color="gray.500" mb={2}>No tasks assigned</Heading>
            <Text color="gray.400">You don't have any tasks assigned to you yet</Text>
          </Card.Root>
        ) : (
          <Card.Root bg="white" borderRadius="2xl" overflow="hidden">
            {/* Table Header */}
            <HStack
              px={6}
              py={4}
              borderBottom="1px solid"
              borderColor="gray.100"
              color="gray.500"
              fontSize="xs"
              fontWeight="semibold"
              textTransform="uppercase"
            >
              <Box w="40px" />
              <Box flex={1}>Task Name</Box>
              <Box w="120px" textAlign="center">Status</Box>
              <Box w="60px" textAlign="center">Priority</Box>
              <Box w="150px" textAlign="center">Project</Box>
              <Box w="100px" textAlign="center">Due Date</Box>
              <Box w="120px" textAlign="center">Team</Box>
            </HStack>

            {/* Task Rows */}
            <VStack align="stretch" gap={0}>
              {filteredTasks.map((task) => (
                <HStack
                  key={`${task.project.id}-${task.id}`}
                  px={6}
                  py={4}
                  borderBottom="1px solid"
                  borderColor="gray.100"
                  _hover={{ bg: 'gray.50' }}
                  cursor="pointer"
                  onClick={() => navigate(`/projects/${task.project.id}`)}
                >
                  {/* Checkbox */}
                  <Box w="40px">
                    <Box
                      w="5"
                      h="5"
                      border="2px solid"
                      borderColor={task.status === 'DONE' ? 'green.500' : 'gray.300'}
                      borderRadius="sm"
                      bg={task.status === 'DONE' ? 'green.500' : 'transparent'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {task.status === 'DONE' && (
                        <Icon as={FiCheckSquare} color="white" boxSize={3} />
                      )}
                    </Box>
                  </Box>

                  {/* Task Name */}
                  <Box flex={1}>
                    <Text fontWeight="medium" textDecoration={task.status === 'DONE' ? 'line-through' : 'none'}>
                      {task.title}
                    </Text>
                    <Text fontSize="sm" color="gray.400" lineClamp={1}>
                      {task.description || 'No description'}
                    </Text>
                  </Box>

                  {/* Status */}
                  <Box w="120px" textAlign="center">
                    <Badge colorPalette={getStatusColor(task.status)} size="sm" textTransform="uppercase">
                      {getStatusLabel(task.status)}
                    </Badge>
                  </Box>

                  {/* Priority */}
                  <Box w="60px" textAlign="center">
                    {getPriorityBadge(task.status)}
                  </Box>

                  {/* Project */}
                  <Box w="150px" textAlign="center">
                    <Text fontSize="sm" color="gray.600">{task.project.name}</Text>
                  </Box>

                  {/* Due Date */}
                  <Box w="100px" textAlign="center">
                    <Text fontSize="sm" color="gray.500">
                      {'N/A'}
                    </Text>
                  </Box>

                  {/* Team */}
                  <Box w="120px" textAlign="center">
                    <HStack gap={-2} justify="center">
                      <Avatar.Root size="xs" border="2px solid white">
                        <Avatar.Fallback
                          name={currentUser?.username || 'Me'}
                          bg="brand.100"
                          color="brand.700"
                          fontSize="10px"
                        />
                      </Avatar.Root>
                    </HStack>
                  </Box>
                </HStack>
              ))}
            </VStack>

            {/* Pagination */}
            <HStack justify="space-between" px={6} py={4} borderTop="1px solid" borderColor="gray.100">
              <Text fontSize="sm" color="gray.500">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </Text>
              <HStack gap={2}>
                <Button size="sm" variant="ghost" disabled>
                  Previous
                </Button>
                <Button size="sm" variant="solid" colorPalette="brand">
                  1
                </Button>
                <Button size="sm" variant="ghost" disabled>
                  Next
                </Button>
              </HStack>
            </HStack>
          </Card.Root>
        )}
      </VStack>
    </Layout>
  )
}
