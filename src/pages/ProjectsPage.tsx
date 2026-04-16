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
  Input,
  Field,
  Dialog,
  Portal,
  Avatar,
} from '@chakra-ui/react'
import { FiPlus, FiSearch, FiMoreHorizontal, FiCalendar } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, createProject, deleteProject, getProjectDetail, type Project } from '../services/api'
import Layout from '../components/Layout'

// Component hiển thị avatar thành viên (1-2 người + số còn lại)
function MemberAvatarStack({ projectId }: { projectId: number }) {
  const [members, setMembers] = useState<{ userId: number; username: string; isVerified?: boolean }[]>([])

  useEffect(() => {
    // Gọi API lấy chi tiết project để có members
    const loadMembers = async () => {
      try {
        const response = await getProjectDetail(projectId)
        setMembers(response.data.members?.slice(0, 2) || [])
      } catch (error) {
        // Nếu lỗi thì để trống
        setMembers([])
      }
    }
    loadMembers()
  }, [projectId])

  const totalCount = members.length

  if (members.length === 0) {
    return (
      <Box w="32px" h="32px" bg="gray.100" borderRadius="full" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xs" color="gray.400">-</Text>
      </Box>
    )
  }

  return (
    <HStack gap={-2}>
      {members.map((member, idx) => (
        <Box key={member.userId} position="relative" zIndex={members.length - idx}>
          <Avatar.Root size="sm" border="2px solid white">
            <Avatar.Fallback
              name={member.username}
              bg={member.isVerified ? 'green.100' : 'blue.100'}
              color={member.isVerified ? 'green.700' : 'blue.700'}
              fontSize="xs"
            />
          </Avatar.Root>
        </Box>
      ))}
      {totalCount > 2 && (
        <Box
          w="32px"
          h="32px"
          bg="gray.200"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="2px solid white"
          zIndex={0}
        >
          <Text fontSize="xs" fontWeight="semibold" color="gray.600">
            +{totalCount - 2}
          </Text>
        </Box>
      )}
    </HStack>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      loadProjects()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadProjects = async () => {
    try {
      const response = await getProjects()
      setProjects(response.data.projects || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsCreating(true)
    try {
      const response = await createProject({ name: newProjectName, description: newProjectDesc })
      setProjects(prev => [...prev, response.data])
      setNewProjectName('')
      setNewProjectDesc('')
      setIsCreateOpen(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      await deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Layout>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Box>
            <Heading size="xl" mb={2}>Projects</Heading>
            <Text color="gray.500">Manage your ongoing projects and activity</Text>
          </Box>
          <Button colorPalette="brand" onClick={() => setIsCreateOpen(true)}>
            <Icon as={FiPlus} mr={2} />
            New Project
          </Button>
        </HStack>

        {/* Search */}
        <HStack maxW="400px">
          <Icon as={FiSearch} color="gray.400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </HStack>

        {/* Projects Grid */}
        {isLoading ? (
          <Text color="gray.500">Loading projects...</Text>
        ) : (
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))"
            gap={6}
          >
            {filteredProjects.map((project) => (
              <Card.Root
                key={project.id}
                bg="white"
                borderRadius="2xl"
                overflow="hidden"
                cursor="pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                <Box h="120px" bg="brand.500" position="relative">
                  <Icon
                    as={FiMoreHorizontal}
                    position="absolute"
                    top={4}
                    right={4}
                    color="white"
                    cursor="pointer"
                    boxSize={5}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProject(project.id)
                    }}
                    _hover={{ bg: 'whiteAlpha.300', borderRadius: 'full' }}
                    p={1}
                  />
                  <Box position="absolute" bottom={4} left={4}>
                    <Badge bg="whiteAlpha.300" color="white">Active</Badge>
                  </Box>
                </Box>
                <Box p={6}>
                  <Heading size="md" mb={2}>{project.name}</Heading>
                  <Text color="gray.500" fontSize="sm" mb={4} lineClamp={2}>
                    {project.description}
                  </Text>
                  <HStack justify="space-between" color="gray.400" fontSize="sm">
                    <HStack gap={4}>
                      <HStack gap={1}>
                        <Icon as={FiCalendar} boxSize={4} />
                        <Text>{new Date(project.createdAt).toLocaleDateString()}</Text>
                      </HStack>
                      </HStack>
                    <MemberAvatarStack projectId={project.id} />
                  </HStack>
                </Box>
              </Card.Root>
            ))}

            {/* Add New Project Card */}
            <Card.Root
              bg="gray.50"
              borderRadius="2xl"
              border="2px dashed"
              borderColor="gray.300"
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH="280px"
              cursor="pointer"
              onClick={() => setIsCreateOpen(true)}
              _hover={{ borderColor: 'brand.500', bg: 'brand.50' }}
            >
              <VStack gap={3}>
                <Box
                  w="48px"
                  h="48px"
                  bg="brand.100"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiPlus} color="brand.600" boxSize={6} />
                </Box>
                <Text fontWeight="semibold" color="gray.600">Create New Project</Text>
              </VStack>
            </Card.Root>
          </Box>
        )}
      </VStack>

      {/* Create Project Modal */}
      <Dialog.Root open={isCreateOpen} onOpenChange={(e) => setIsCreateOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl">
              <Dialog.Header>
                <Dialog.Title>Create New Project</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={4} align="stretch">
                  <Field.Root required>
                    <Field.Label>Project Name</Field.Label>
                    <Input
                      placeholder="e.g. Q3 Strategic Planning"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Input
                      as="textarea"
                      placeholder="Describe the project goals and core objectives..."
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                      h="100px"
                    />
                  </Field.Root>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="ghost">Cancel</Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="brand"
                  loading={isCreating}
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                >
                  Create Project
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Layout>
  )
}
