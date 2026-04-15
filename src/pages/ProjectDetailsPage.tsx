import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Badge,
  Icon,
  Avatar,
  Input,
  Progress,
  Grid,
  GridItem,
} from '@chakra-ui/react'
import { FiPlus, FiSearch, FiMoreHorizontal, FiCalendar, FiUser, FiFolder, FiCheckCircle, FiClock } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getProjects, getTasks, createTask, type Project, type Task } from '../services/api'
import Layout from '../components/Layout'

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')

  useEffect(() => {
    if (projectId) {
      loadProjectData(parseInt(projectId))
    }
  }, [projectId])

  const loadProjectData = async (id: number) => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        getProjects(),
        getTasks(id),
      ])
      const foundProject = projectsRes.data.find(p => p.id === id)
      if (foundProject) {
        setProject(foundProject)
      }
      setTasks(tasksRes.data)
    } catch (error) {
      console.error('Failed to load project data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!projectId || !newTaskTitle.trim()) return

    setIsCreatingTask(true)
    try {
      await createTask(parseInt(projectId), {
        title: newTaskTitle,
        description: newTaskDesc,
      })
      setNewTaskTitle('')
      setNewTaskDesc('')
      loadProjectData(parseInt(projectId))
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsCreatingTask(false)
    }
  }

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const todoTasks = filteredTasks.filter(t => t.status === 'TODO')
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS')
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE')

  const completedCount = tasks.filter(t => t.status === 'DONE').length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const TaskColumn = ({ title, status, tasks: columnTasks, color }: { title: string; status: string; tasks: Task[]; color: string }) => (
    <VStack align="stretch" gap={3} flex={1} minW="280px">
      <HStack justify="space-between">
        <HStack gap={2}>
          <Box w="3px" h="20px" bg={`${color}.500`} borderRadius="full" />
          <Text fontWeight="semibold">{title}</Text>
          <Badge size="sm" variant="subtle">{columnTasks.length}</Badge>
        </HStack>
      </HStack>
      <VStack align="stretch" gap={3}>
        {columnTasks.map((task) => (
          <Card.Root key={task.id} bg="white" borderRadius="xl" p={4}>
            <HStack justify="space-between" mb={2}>
              <Badge size="sm" variant="subtle" colorPalette={color === 'orange' ? 'orange' : color === 'blue' ? 'blue' : 'green'}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Icon as={FiMoreHorizontal} color="gray.400" cursor="pointer" />
            </HStack>
            <Text fontWeight="medium" mb={2}>{task.title}</Text>
            <Text fontSize="sm" color="gray.500" mb={3} lineClamp={2}>
              {task.description}
            </Text>
            <HStack justify="space-between" fontSize="xs" color="gray.400">
              <HStack gap={1}>
                <Icon as={FiCalendar} boxSize={3} />
                <Text>Oct 18</Text>
              </HStack>
              {task.assigneeId ? (
                <Avatar.Root size="xs">
                  <Avatar.Fallback name="User" />
                </Avatar.Root>
              ) : (
                <Icon as={FiUser} boxSize={3} />
              )}
            </HStack>
          </Card.Root>
        ))}
        {columnTasks.length === 0 && (
          <Box p={4} bg="gray.50" borderRadius="xl" border="2px dashed" borderColor="gray.200">
            <Text fontSize="sm" color="gray.400" textAlign="center">No tasks</Text>
          </Box>
        )}
      </VStack>
    </VStack>
  )

  return (
    <Layout>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <Box>
          <HStack gap={2} mb={2} color="gray.500" fontSize="sm">
            <Text>Projects</Text>
            <Text>/</Text>
            <Text color="brand.500">{project?.name || 'Project'}</Text>
          </HStack>
          <HStack justify="space-between" align="start">
            <Box>
              <Heading size="xl" mb={2}>{project?.name || 'Project Details'}</Heading>
              <Text color="gray.500" maxW="600px">{project?.description}</Text>
            </Box>
            <HStack gap={-2}>
              <Avatar.Root size="sm" border="2px solid white">
                <Avatar.Fallback name="User 1" />
              </Avatar.Root>
              <Avatar.Root size="sm" border="2px solid white">
                <Avatar.Fallback name="User 2" />
              </Avatar.Root>
              <Avatar.Root size="sm" border="2px solid white">
                <Avatar.Fallback name="User 3" />
              </Avatar.Root>
              <Box w="32px" h="32px" bg="gray.200" borderRadius="full" display="flex" alignItems="center" justifyContent="center" border="2px solid white">
                <Text fontSize="xs" fontWeight="semibold">+4</Text>
              </Box>
            </HStack>
          </HStack>
        </Box>

        {/* Stats Cards */}
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          <GridItem>
            <Card.Root bg="white" borderRadius="2xl" p={6}>
              <HStack gap={3} mb={3}>
                <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />
                <Text fontSize="sm" color="gray.500" textTransform="uppercase">Tasks Completed</Text>
              </HStack>
              <Heading size="2xl" color="blue.600">{Math.round(progress)}%</Heading>
              <Progress.Root value={progress} size="sm" mt={3} colorPalette="blue">
                <Progress.Track>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </Card.Root>
          </GridItem>
          <GridItem>
            <Card.Root bg="white" borderRadius="2xl" p={6}>
              <HStack gap={3} mb={3}>
                <Icon as={FiFolder} color="purple.500" boxSize={5} />
                <Text fontSize="sm" color="gray.500" textTransform="uppercase">Milestones</Text>
              </HStack>
              <Heading size="2xl">12 <Text as="span" fontSize="lg" color="gray.400">/ 18</Text></Heading>
            </Card.Root>
          </GridItem>
          <GridItem>
            <Card.Root bg="white" borderRadius="2xl" p={6}>
              <HStack gap={3} mb={3}>
                <Icon as={FiClock} color="orange.500" boxSize={5} />
                <Text fontSize="sm" color="gray.500" textTransform="uppercase">Launch Countdown</Text>
              </HStack>
              <Heading size="2xl" color="red.500">14 Days</Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>Deadline: May 27, 2025</Text>
            </Card.Root>
          </GridItem>
        </Grid>

        {/* Kanban Board */}
        <Card.Root bg="white" borderRadius="2xl" p={6}>
          <HStack justify="space-between" mb={6}>
            <Heading size="md">Active Workstream</Heading>
            <HStack gap={3}>
              <HStack gap={2} maxW="250px">
                <Icon as={FiSearch} color="gray.400" />
                <Input
                  placeholder="Filter tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="sm"
                />
              </HStack>
              <Button colorPalette="brand" size="sm" onClick={() => setIsCreatingTask(true)}>
                <Icon as={FiPlus} mr={2} />
                Add New Task
              </Button>
            </HStack>
          </HStack>

          <HStack align="start" gap={6} overflowX="auto" pb={2}>
            <TaskColumn title="To Do" status="TODO" tasks={todoTasks} color="orange" />
            <TaskColumn title="In Progress" status="IN_PROGRESS" tasks={inProgressTasks} color="blue" />
            <TaskColumn title="Done" status="DONE" tasks={doneTasks} color="green" />
          </HStack>
        </Card.Root>

        {/* Project Guidelines & Team Activity */}
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <GridItem>
            <Card.Root bg="white" borderRadius="2xl" p={6}>
              <Heading size="md" mb={4}>Project Guidelines</Heading>
              <VStack align="stretch" gap={4}>
                <HStack gap={3} align="start">
                  <Box w="8px" h="8px" bg="brand.500" borderRadius="full" mt={2} />
                  <Box>
                    <Text fontWeight="medium" mb={1}>Tone of Voice</Text>
                    <Text fontSize="sm" color="gray.500">
                      Ensure all copy follows the 'Quiet Engineer' philosophy: minimal, professional, and unobtrusive branding.
                    </Text>
                  </Box>
                </HStack>
                <HStack gap={3} align="start">
                  <Box w="8px" h="8px" bg="orange.500" borderRadius="full" mt={2} />
                  <Box>
                    <Text fontWeight="medium" mb={1}>Critical Constraints</Text>
                    <Text fontSize="sm" color="gray.500">
                      All brand elements must retain minimal styling. Stay on-brand and offer space for learnability.
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </Card.Root>
          </GridItem>
          <GridItem>
            <Card.Root bg="white" borderRadius="2xl" p={6}>
              <Heading size="md" mb={4}>Team Activity</Heading>
              <VStack align="stretch" gap={4}>
                <HStack gap={3} align="start">
                  <Box w="8px" h="8px" bg="brand.500" borderRadius="full" mt={2} />
                  <Box>
                    <Text fontSize="sm">
                      <Text as="span" fontWeight="semibold">Alex</Text> created the design prototyping
                    </Text>
                    <Text fontSize="xs" color="gray.400">2 hours ago</Text>
                  </Box>
                </HStack>
                <HStack gap={3} align="start">
                  <Box w="8px" h="8px" bg="brand.500" borderRadius="full" mt={2} />
                  <Box>
                    <Text fontSize="sm">
                      <Text as="span" fontWeight="semibold">Sarah</Text> added 4 new tasks to Sprint
                    </Text>
                    <Text fontSize="xs" color="gray.400">4 hours ago</Text>
                  </Box>
                </HStack>
              </VStack>
            </Card.Root>
          </GridItem>
        </Grid>

        {/* Create Task Modal placeholder */}
        {isCreatingTask && (
          <Card.Root bg="white" borderRadius="2xl" p={6} position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" zIndex={1000} boxShadow="2xl" minW="400px">
            <Heading size="md" mb={4}>Add New Task</Heading>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Task Title</Text>
                <Input
                  placeholder="Enter task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Description</Text>
                <Input
                  as="textarea"
                  placeholder="Enter task description..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  h="80px"
                />
              </Box>
              <HStack gap={3} justify="flex-end">
                <Button variant="ghost" onClick={() => setIsCreatingTask(false)}>Cancel</Button>
                <Button colorPalette="brand" onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                  Create Task
                </Button>
              </HStack>
            </VStack>
          </Card.Root>
        )}
        {isCreatingTask && (
          <Box position="fixed" inset={0} bg="blackAlpha.500" zIndex={999} onClick={() => setIsCreatingTask(false)} />
        )}
      </VStack>
    </Layout>
  )
}
