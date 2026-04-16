import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Icon,
  Avatar,
  Input,
  Progress,
  Grid,
  GridItem,
} from '@chakra-ui/react'
import { FiPlus, FiSearch, FiFolder, FiCheckCircle, FiClock } from 'react-icons/fi'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getProjects, getTasks, getProjectDetail, createTask, moveTask, type Project, type Task, type ProjectMember } from '../services/api'
import Layout from '../components/Layout'
import KanbanBoard from '../components/KanbanBoard'

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const dataLoadedRef = useRef(false)

  useEffect(() => {
    if (projectId && !dataLoadedRef.current) {
      dataLoadedRef.current = true
      loadProjectData(parseInt(projectId))
    }
  }, [projectId])

  const loadProjectData = async (id: number) => {
    try {
      const [projectsRes, tasksRes, projectDetailRes] = await Promise.all([
        getProjects(),
        getTasks(id),
        getProjectDetail(id),
      ])
      const foundProject = projectsRes.data.projects.find((p: Project) => p.id === id)
      if (foundProject) {
        setProject(foundProject)
      }
      setTasks(tasksRes.data)
      setMembers(projectDetailRes.data.members || [])
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

  const handleMoveTask = async (taskId: number, fromStatus: string, toStatus: string, toPosition: number) => {
    if (!projectId) return
    try {
      const response = await moveTask(parseInt(projectId), taskId, { toStatus: toStatus as Task['status'], toPosition })
      const affectedTasks = response.data

      // Smart response handling
      if (fromStatus === toStatus) {
        // Same column: merge affected tasks into current state
        setTasks(currentTasks => currentTasks.map(task => {
          const updated = affectedTasks.find((t: Task) => t.id === task.id)
          if (updated) {
            return { ...task, position: updated.position }
          }
          return task
        }))
      } else {
        // Different column: replace all tasks (API returns all project tasks)
        setTasks(affectedTasks)
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }

  const completedCount = tasks.filter(t => t.status === 'DONE').length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0


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
              {members.length > 0 ? (
                <>
                  {members.map((member, idx) => (
                    <Box key={member.userId} position="relative" zIndex={members.length - idx}>
                      <Avatar.Root size="sm" border="2px solid white">
                        <Avatar.Fallback
                          name={member.username}
                          bg={member.isVerified ? 'green.100' : 'blue.100'}
                          color={member.isVerified ? 'green.700' : 'blue.700'}
                        />
                      </Avatar.Root>
                    </Box>
                  ))}
                  <Box w="32px" h="32px" bg="gray.200" borderRadius="full" display="flex" alignItems="center" justifyContent="center" border="2px solid white">
                    <Text fontSize="xs" fontWeight="semibold">+{members.length}</Text>
                  </Box>
                </>
              ) : (
                <Box w="32px" h="32px" bg="gray.100" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
                  <Text fontSize="xs" color="gray.400">-</Text>
                </Box>
              )}
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

          {isLoading ? (
            <Text color="gray.400" textAlign="center" py={8}>Loading tasks...</Text>
          ) : (
            <KanbanBoard
              tasks={filteredTasks}
              projectId={parseInt(projectId || '0')}
              members={members}
              onMoveTask={handleMoveTask}
            />
          )}
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
