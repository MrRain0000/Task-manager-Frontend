import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Badge,
  Icon,
  Button,
  Avatar,
} from '@chakra-ui/react'
import {
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiArrowRight,
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, getMyInvitations, getProjectDetail, getActivityLogs, type Project, type Invitation, type ActivityLog } from '../services/api'
import BurndownVelocityChart from '../components/BurndownVelocityChart'
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

export default function DashboardPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      loadData()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadData = async () => {
    try {
      const projectsRes = await getProjects()
      const loadedProjects = projectsRes.data.projects || []
      setProjects(loadedProjects)

      // Load recent activity from all projects
      setIsLoadingActivity(true)
      const allActivities: ActivityLog[] = []
      for (const project of loadedProjects.slice(0, 5)) { // Limit to 5 projects for performance
        try {
          const logsRes = await getActivityLogs(project.id, 0, 5)
          allActivities.push(...(logsRes.data.content || []))
        } catch (error) {
          // Skip if can't load activity for this project
        }
      }
      // Sort by createdAt desc and take top 10
      allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setRecentActivity(allActivities.slice(0, 10))
      setIsLoadingActivity(false)
      const invitationsRes = await getMyInvitations()
      setInvitations(invitationsRes.filter(i => i.status === 'PENDING'))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    { label: 'Completed', value: '128', change: '+14%', icon: FiCheckCircle, color: 'green' },
    { label: 'Active Tasks', value: '32', change: '', icon: FiClock, color: 'blue' },
    { label: 'Team Invites', value: invitations.length.toString(), change: 'ACTION REQUIRED', icon: FiUsers, color: 'orange' },
  ]

  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Layout>
      <VStack align="stretch" gap={8}>
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>Workspace</Heading>
          <Text color="gray.500">Your velocity is up 12% this week. Keep pushing.</Text>
        </Box>

        {/* Stats Grid */}
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          {stats.map((stat) => (
            <GridItem key={stat.label}>
              <Card.Root bg="white" borderRadius="2xl" p={6}>
                <HStack justify="space-between" mb={4}>
                  <Text color="gray.500" fontSize="sm" fontWeight="medium" textTransform="uppercase">
                    {stat.label}
                  </Text>
                  <Icon as={stat.icon} boxSize={5} color={`${stat.color}.500`} />
                </HStack>
                <HStack align="baseline" gap={2}>
                  <Heading size="2xl">{stat.value}</Heading>
                  {stat.change && (
                    <Badge colorPalette={stat.change.includes('+') ? 'green' : stat.change.includes('ACTION') ? 'orange' : 'gray'} size="sm">
                      {stat.change}
                    </Badge>
                  )}
                </HStack>
              </Card.Root>
            </GridItem>
          ))}
        </Grid>

        {/* Main Content Grid */}
        <Grid templateColumns="2fr 1fr" gap={6}>
          {/* Left Column */}
          <GridItem>
            <VStack align="stretch" gap={6}>
              {/* Burndown Chart Placeholder */}
              <Card.Root bg="white" borderRadius="2xl" p={6}>
                <HStack justify="space-between" mb={6}>
                  <Box>
                    <Heading size="md" mb={1}>Burndown Velocity</Heading>
                    <Text color="gray.500" fontSize="sm">Sprint #42 - Engine Refactor</Text>
                  </Box>
                  <HStack gap={2}>
                    <Badge variant="subtle" colorPalette="brand">Weekly</Badge>
                    <Badge variant="outline">Monthly</Badge>
                  </HStack>
                </HStack>
                <BurndownVelocityChart />
              </Card.Root>

              {/* Active Milestones */}
              <Card.Root bg="white" borderRadius="2xl" p={6}>
                <HStack justify="space-between" mb={6}>
                  <Box>
                    <Heading size="md" mb={1}>Active Milestones</Heading>
                    <Text color="gray.500" fontSize="sm">Reviewing 6 prioritized project streams</Text>
                  </Box>
                  <Button variant="ghost" colorPalette="brand" size="sm" onClick={() => navigate('/projects')}>
                    View All Projects <Icon as={FiArrowRight} ml={2} />
                  </Button>
                </HStack>
                <VStack align="stretch" gap={4}>
                  {projects.slice(0, 3).map((project) => (
                    <HStack
                      key={project.id}
                      p={4}
                      bg="gray.50"
                      borderRadius="xl"
                      justify="space-between"
                      cursor="pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}
                      _hover={{ bg: 'gray.100' }}
                      transition="background 0.2s"
                    >
                      <HStack gap={4}>
                        <Box w="40px" h="40px" bg="brand.100" borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
                          <Icon as={FiCheckCircle} color="brand.600" />
                        </Box>
                        <Box>
                          <Text fontWeight="semibold">{project.name}</Text>
                          <Badge size="sm" variant="subtle" colorPalette="blue">In Progress</Badge>
                        </Box>
                      </HStack>
                      <MemberAvatarStack projectId={project.id} />
                    </HStack>
                  ))}
                </VStack>
              </Card.Root>
            </VStack>
          </GridItem>

          {/* Right Column */}
          <GridItem>
            <VStack align="stretch" gap={6}>
              {/* Recent Activity */}
              <Card.Root bg="white" borderRadius="2xl" p={6}>
                <Heading size="md" mb={6}>Recent Activity</Heading>
                <VStack align="stretch" gap={4}>
                  {isLoadingActivity ? (
                    <Text fontSize="sm" color="gray.400" textAlign="center">Đang tải...</Text>
                  ) : recentActivity.length === 0 ? (
                    <Text fontSize="sm" color="gray.400" textAlign="center">Chưa có hoạt động nào</Text>
                  ) : (
                    recentActivity.slice(0, 5).map((activity) => (
                      <HStack key={activity.id} gap={3} align="start">
                        <Box w="8px" h="8px" bg="brand.500" borderRadius="full" mt={2} />
                        <Box>
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="semibold">{activity.user?.username || 'Unknown'}</Text>
                            {' '}{activity.description}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {formatTimeAgo(activity.createdAt)}
                          </Text>
                        </Box>
                      </HStack>
                    ))
                  )}
                </VStack>
                <Button variant="ghost" colorPalette="brand" size="sm" mt={4} w="full">
                  View All Timeline
                </Button>
              </Card.Root>

              {/* Urgent Deadline */}
              <Card.Root bg="brand.500" borderRadius="2xl" p={6} color="white">
                <HStack mb={4}>
                  <Badge bg="whiteAlpha.300" color="white">Urgent Deadline</Badge>
                </HStack>
                <Text fontSize="sm" mb={4}>
                  Database migration must be completed before maintenance service.
                </Text>
                <HStack gap={2}>
                  <Icon as={FiClock} boxSize={4} />
                  <Text fontSize="sm" fontWeight="semibold">Oct 24, 09:00 AM</Text>
                </HStack>
              </Card.Root>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>
    </Layout>
  )
}
