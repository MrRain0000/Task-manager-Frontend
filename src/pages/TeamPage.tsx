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
  Grid,
  GridItem,
  Dialog,
  Portal,
  Field,
  Spinner,
} from '@chakra-ui/react'
import { FiPlus, FiMoreVertical, FiUserCheck, FiShield, FiUsers, FiMail, FiSend, FiX } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import {
  getProjects,
  getProjectMembers,
  inviteMember,
  type Project,
  type ProjectMember,
} from '../services/api'
import Layout from '../components/Layout'

export default function TeamPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Invite dialog state
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [inviteStatus, setInviteStatus] = useState<{
    type: 'success' | 'error'
    msg: string
  } | null>(null)

  // Toast
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)

  const showToast = (text: string, ok: boolean) => {
    setToast({ text, ok })
    setTimeout(() => setToast(null), 3000)
  }

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
      setProjects(response.data)
      if (response.data.length > 0) {
        setSelectedProject(response.data[0])
        loadMembers(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMembers = async (projectId: number) => {
    try {
      const response = await getProjectMembers(projectId)
      setMembers(response.data)
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  const handleProjectChange = (project: Project) => {
    setSelectedProject(project)
    loadMembers(project.id)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedProject) return
    setIsSending(true)
    setInviteStatus(null)
    try {
      await inviteMember(selectedProject.id, inviteEmail.trim())
      setInviteStatus({ type: 'success', msg: `Invitation sent to ${inviteEmail}!` })
      setInviteEmail('')
      // reload members after short delay
      setTimeout(() => loadMembers(selectedProject.id), 1000)
    } catch (error: any) {
      setInviteStatus({
        type: 'error',
        msg: error?.message || 'Failed to send invitation.',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseInvite = () => {
    setIsInviteOpen(false)
    setInviteEmail('')
    setInviteStatus(null)
  }

  const filteredMembers = members.filter(
    (m) =>
      m?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeMembers = members.filter((m) => m?.status === 'ACCEPTED').length
  const pendingInvites = members.filter((m) => m?.status === 'PENDING').length

  return (
    <Layout>
      {/* Toast notification */}
      {toast && (
        <Box
          position="fixed"
          top={4}
          right={4}
          zIndex={9999}
          bg={toast.ok ? 'green.500' : 'red.500'}
          color="white"
          px={5}
          py={3}
          borderRadius="lg"
          boxShadow="lg"
          fontSize="sm"
          fontWeight="medium"
        >
          {toast.text}
        </Box>
      )}

      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Box>
            <Heading size="xl" mb={2}>
              Team Management
            </Heading>
            <Text color="gray.500">
              Coordinate roles and access levels for the{' '}
              <Text as="span" fontWeight="semibold" color="gray.700">
                {selectedProject?.name || 'Project'}
              </Text>{' '}
              workspace.
            </Text>
          </Box>
          <Button
            colorPalette="blue"
            bg="blue.700"
            color="white"
            _hover={{ bg: 'blue.800' }}
            onClick={() => setIsInviteOpen(true)}
            disabled={!selectedProject}
          >
            <Icon as={FiPlus} />
            Invite Member
          </Button>
        </HStack>

        {/* Project Selector */}
        {projects.length > 1 && (
          <HStack gap={2} flexWrap="wrap">
            <Text fontWeight="medium" mr={2} color="gray.600">
              Select Project:
            </Text>
            {projects.map((project) => (
              <Button
                key={project.id}
                size="sm"
                variant={selectedProject?.id === project.id ? 'solid' : 'outline'}
                colorPalette={selectedProject?.id === project.id ? 'blue' : 'gray'}
                onClick={() => handleProjectChange(project)}
              >
                {project.name}
              </Button>
            ))}
          </HStack>
        )}

        {/* Stats */}
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          <GridItem>
            <Card.Root bg="white" borderRadius="2xl" p={6} boxShadow="sm">
              <HStack gap={3} mb={3}>
                <Box
                  w="36px"
                  h="36px"
                  bg="blue.50"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiUsers} color="blue.500" />
                </Box>
                <Text fontSize="sm" color="gray.500" textTransform="uppercase" fontWeight="semibold">
                  Total Members
                </Text>
              </HStack>
              <Heading size="2xl">{members.length}</Heading>
            </Card.Root>
          </GridItem>
          <GridItem>
            <Card.Root bg="white" borderRadius="2xl" p={6} boxShadow="sm">
              <HStack gap={3} mb={3}>
                <Box
                  w="36px"
                  h="36px"
                  bg="green.50"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiUserCheck} color="green.500" />
                </Box>
                <Text fontSize="sm" color="gray.500" textTransform="uppercase" fontWeight="semibold">
                  Active Now
                </Text>
              </HStack>
              <Heading size="2xl">{activeMembers}</Heading>
            </Card.Root>
          </GridItem>
          <GridItem>
            <Card.Root bg="white" borderRadius="2xl" p={6} boxShadow="sm">
              <HStack gap={3} mb={3}>
                <Box
                  w="36px"
                  h="36px"
                  bg="orange.50"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiShield} color="orange.500" />
                </Box>
                <Text fontSize="sm" color="gray.500" textTransform="uppercase" fontWeight="semibold">
                  Pending Invites
                </Text>
              </HStack>
              <Heading size="2xl">{pendingInvites}</Heading>
            </Card.Root>
          </GridItem>
        </Grid>

        {/* Members List */}
        <Card.Root bg="white" borderRadius="2xl" overflow="hidden" boxShadow="sm">
          {/* Search Header */}
          <HStack p={4} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
            <Box flex={1}>
              <Input
                placeholder="Search members by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
                maxW="320px"
                bg="white"
              />
            </Box>
            {searchQuery && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </Button>
            )}
          </HStack>

          {/* Table header */}
          <HStack
            px={6}
            py={3}
            fontSize="xs"
            fontWeight="bold"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="wider"
            borderBottom="1px solid"
            borderColor="gray.100"
          >
            <Box flex={2}>Member</Box>
            <Box flex={1}>Role</Box>
            <Box flex={1}>Status</Box>
            <Box w="40px" />
          </HStack>

          {/* Rows */}
          <VStack align="stretch" gap={0}>
            {isLoading ? (
              <HStack justify="center" py={12}>
                <Spinner color="blue.500" />
              </HStack>
            ) : filteredMembers.length === 0 ? (
              <VStack py={12} gap={3}>
                <Icon as={FiUsers} boxSize={8} color="gray.300" />
                <Text textAlign="center" color="gray.400">
                  {searchQuery ? 'No members match your search' : 'No members yet'}
                </Text>
                {!searchQuery && (
                  <Button
                    size="sm"
                    colorPalette="blue"
                    variant="outline"
                    onClick={() => setIsInviteOpen(true)}
                    disabled={!selectedProject}
                  >
                    <Icon as={FiPlus} />
                    Invite first member
                  </Button>
                )}
              </VStack>
            ) : (
              filteredMembers.map((member, idx) => (
                <HStack
                  key={member?.id || idx}
                  px={6}
                  py={4}
                  align="center"
                  borderBottom="1px solid"
                  borderColor="gray.50"
                  _hover={{ bg: 'gray.50' }}
                  transition="background 0.15s"
                >
                  <Box flex={2}>
                    <HStack gap={3}>
                      <Avatar.Root size="sm">
                        <Avatar.Fallback
                          name={member?.username || 'Unknown'}
                          bg="blue.100"
                          color="blue.700"
                        />
                      </Avatar.Root>
                      <Box>
                        <Text fontWeight="semibold" fontSize="sm">
                          {member?.username || 'Unknown'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {member?.email || ''}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                  <Box flex={1}>
                    <Badge
                      variant="subtle"
                      colorPalette={member?.role === 'OWNER' ? 'purple' : 'blue'}
                      size="sm"
                    >
                      {member?.role || 'MEMBER'}
                    </Badge>
                  </Box>
                  <Box flex={1}>
                    <Badge
                      size="sm"
                      colorPalette={
                        member?.status === 'ACCEPTED'
                          ? 'green'
                          : member?.status === 'PENDING'
                          ? 'orange'
                          : 'red'
                      }
                      variant="subtle"
                    >
                      {member?.status === 'ACCEPTED' && (
                        <Icon as={FiUserCheck} boxSize={3} />
                      )}
                      {member?.status || 'UNKNOWN'}
                    </Badge>
                  </Box>
                  <Box w="40px">
                    <Icon as={FiMoreVertical} color="gray.400" cursor="pointer" />
                  </Box>
                </HStack>
              ))
            )}
          </VStack>

          {/* Footer */}
          <HStack
            px={6}
            py={4}
            borderTop="1px solid"
            borderColor="gray.100"
            justify="space-between"
            fontSize="sm"
            color="gray.500"
          >
            <Text>
              Showing{' '}
              <Text as="span" fontWeight="semibold" color="gray.700">
                {filteredMembers.length}
              </Text>{' '}
              of{' '}
              <Text as="span" fontWeight="semibold" color="gray.700">
                {members.length}
              </Text>{' '}
              members
            </Text>
            <Text color="gray.400" fontSize="xs">
              {20 - members.length} seats remaining of 20
            </Text>
          </HStack>
        </Card.Root>
      </VStack>

      {/* ── Invite Member Dialog ── */}
      <Dialog.Root open={isInviteOpen} onOpenChange={(e) => !e.open && handleCloseInvite()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" maxW="480px">
              {/* Header */}
              <Dialog.Header borderBottom="1px solid" borderColor="gray.100" pb={4}>
                <HStack justify="space-between" align="center">
                  <HStack gap={3}>
                    <Box
                      w="40px"
                      h="40px"
                      bg="blue.50"
                      borderRadius="xl"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={FiMail} color="blue.600" boxSize={5} />
                    </Box>
                    <Box>
                      <Dialog.Title fontSize="lg" fontWeight="bold">
                        Invite Member
                      </Dialog.Title>
                      <Text fontSize="sm" color="gray.500">
                        {selectedProject?.name}
                      </Text>
                    </Box>
                  </HStack>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseInvite}
                    borderRadius="full"
                    p={1}
                  >
                    <Icon as={FiX} />
                  </Button>
                </HStack>
              </Dialog.Header>

              <Dialog.Body py={6}>
                <VStack align="stretch" gap={5}>
                  <Text fontSize="sm" color="gray.600">
                    Enter the email address of the person you want to invite to this project.
                    They will receive an invitation they can accept or reject.
                  </Text>

                  <Field.Root required>
                    <Field.Label fontWeight="semibold" fontSize="sm">
                      Email Address
                    </Field.Label>
                    <Input
                      id="invite-email-input"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value)
                        setInviteStatus(null)
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                      size="md"
                      borderRadius="lg"
                      focusBorderColor="blue.400"
                    />
                  </Field.Root>

                  {/* Status message */}
                  {inviteStatus && (
                    <HStack
                      bg={inviteStatus.type === 'success' ? 'green.50' : 'red.50'}
                      borderRadius="lg"
                      px={4}
                      py={3}
                      gap={2}
                    >
                      <Icon
                        as={inviteStatus.type === 'success' ? FiUserCheck : FiX}
                        color={inviteStatus.type === 'success' ? 'green.600' : 'red.500'}
                        boxSize={4}
                      />
                      <Text
                        fontSize="sm"
                        color={inviteStatus.type === 'success' ? 'green.700' : 'red.600'}
                        fontWeight="medium"
                      >
                        {inviteStatus.msg}
                      </Text>
                    </HStack>
                  )}

                  {/* Info note */}
                  <Box bg="blue.50" borderRadius="lg" px={4} py={3}>
                    <Text fontSize="xs" color="blue.700">
                      <Text as="span" fontWeight="bold">Note: </Text>
                      The invited user must have a verified account. They will join as a{' '}
                      <Text as="span" fontWeight="bold">MEMBER</Text> with standard access.
                    </Text>
                  </Box>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer borderTop="1px solid" borderColor="gray.100" pt={4}>
                <HStack gap={3} justify="flex-end" w="full">
                  <Button variant="outline" onClick={handleCloseInvite} disabled={isSending}>
                    Cancel
                  </Button>
                  <Button
                    id="send-invite-btn"
                    bg="blue.700"
                    color="white"
                    _hover={{ bg: 'blue.800' }}
                    loading={isSending}
                    disabled={!inviteEmail.trim()}
                    onClick={handleInvite}
                  >
                    <Icon as={FiSend} />
                    Send Invitation
                  </Button>
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Layout>
  )
}
