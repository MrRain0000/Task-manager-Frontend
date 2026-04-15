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
import { getProjects, getMyInvitations, type Project, type Invitation } from '../services/api'
import Layout from '../components/Layout'

export default function DashboardPage() {
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
      const invitationsRes = await getMyInvitations()
      setProjects(projectsRes.data)
      setInvitations(invitationsRes.data.filter(i => i.status === 'PENDING'))
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

  const recentActivity = [
    { user: 'Sarah', action: 'updated the API documentation', time: '2 hours ago', type: 'update' },
    { user: 'Alex', action: 'created a new high-priority bug ticket', time: '4 hours ago', type: 'create' },
    { user: 'Mike', action: 'completed Sprint review', time: '1 day ago', type: 'complete' },
  ]

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
                <Box h="200px" bg="gray.50" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                  <Text color="gray.400">Chart visualization would go here</Text>
                </Box>
              </Card.Root>

              {/* Active Milestones */}
              <Card.Root bg="white" borderRadius="2xl" p={6}>
                <HStack justify="space-between" mb={6}>
                  <Box>
                    <Heading size="md" mb={1}>Active Milestones</Heading>
                    <Text color="gray.500" fontSize="sm">Reviewing 6 prioritized project streams</Text>
                  </Box>
                  <Button variant="ghost" colorPalette="brand" size="sm">
                    Go to Kanban <Icon as={FiArrowRight} ml={2} />
                  </Button>
                </HStack>
                <VStack align="stretch" gap={4}>
                  {projects.slice(0, 3).map((project) => (
                    <HStack key={project.id} p={4} bg="gray.50" borderRadius="xl" justify="space-between">
                      <HStack gap={4}>
                        <Box w="40px" h="40px" bg="brand.100" borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
                          <Icon as={FiCheckCircle} color="brand.600" />
                        </Box>
                        <Box>
                          <Text fontWeight="semibold">{project.name}</Text>
                          <Badge size="sm" variant="subtle" colorPalette="blue">In Progress</Badge>
                        </Box>
                      </HStack>
                      <HStack gap={-2}>
                        <Avatar.Root size="sm" border="2px solid white">
                          <Avatar.Fallback name="User 1" />
                        </Avatar.Root>
                        <Avatar.Root size="sm" border="2px solid white">
                          <Avatar.Fallback name="User 2" />
                        </Avatar.Root>
                      </HStack>
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
                  {recentActivity.map((activity, idx) => (
                    <HStack key={idx} gap={3} align="start">
                      <Box w="8px" h="8px" bg="brand.500" borderRadius="full" mt={2} />
                      <Box>
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="semibold">{activity.user}</Text> {activity.action}
                        </Text>
                        <Text fontSize="xs" color="gray.400">{activity.time}</Text>
                      </Box>
                    </HStack>
                  ))}
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
