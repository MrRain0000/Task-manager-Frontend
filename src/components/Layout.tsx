import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Icon,
  Badge,
} from '@chakra-ui/react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import {
  FiGrid,
  FiFolder,
  FiUsers,
  FiMail,
  FiCheckSquare,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiUser,
} from 'react-icons/fi'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getMyInvitations, type User } from '../services/api'

// Cache for invitations to reduce API calls
let cachedInvitations: { data: any[]; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 seconds

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/', icon: FiGrid, label: 'Dashboard' },
  { path: '/projects', icon: FiFolder, label: 'Projects' },
  { path: '/invitations', icon: FiMail, label: 'Invitations', badge: 'invitationCount' },
  { path: '/team', icon: FiUsers, label: 'Team' },
  { path: '/profile', icon: FiUser, label: 'Profile' },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [invitationCount, setInvitationCount] = useState(0)
  const [user] = useState<User | null>(() => {
    // Read localStorage synchronously during initialization
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    console.log('[Layout] localStorage user:', userData, 'token:', token ? 'exists' : 'none')
    if (userData && userData !== 'undefined' && userData !== 'null') {
      try {
        const parsed = JSON.parse(userData)
        console.log('[Layout] Parsed user:', parsed)
        return parsed
      } catch (e) {
        console.log('[Layout] Failed to parse user:', e)
        return null
      }
    }
    console.log('[Layout] No valid user data found')
    return null
  })

  // Track last request time to prevent spam
  const lastRequestRef = useRef<number>(0)
  const isRequestingRef = useRef<boolean>(false)

  // Load invitation count for badge with debouncing and caching
  const loadInvitationCount = useCallback(async () => {
    const now = Date.now()
    const token = localStorage.getItem('token')
    
    if (!token || isRequestingRef.current) return
    
    // Check cache first
    if (cachedInvitations && (now - cachedInvitations.timestamp) < CACHE_DURATION) {
      const pendingCount = cachedInvitations.data.filter((i) => i.status === 'PENDING').length
      setInvitationCount(pendingCount)
      return
    }

    // Rate limiting: minimum 10 seconds between requests
    if (now - lastRequestRef.current < 10000) {
      console.log('[Layout] Skipping invitation load - too soon')
      return
    }

    isRequestingRef.current = true
    lastRequestRef.current = now

    try {
      const invitations = await getMyInvitations()
      
      // Update cache
      cachedInvitations = {
        data: Array.isArray(invitations) ? invitations : [],
        timestamp: now
      }
      
      const pendingCount = cachedInvitations.data.filter((i) => i.status === 'PENDING').length
      setInvitationCount(pendingCount)
    } catch (error: any) {
      // Handle 429 rate limit
      if (error?.status === 429 || error?.message?.includes('429')) {
        console.log('[Layout] Rate limited (429), using cached data if available')
        if (cachedInvitations) {
          const pendingCount = cachedInvitations.data.filter((i) => i.status === 'PENDING').length
          setInvitationCount(pendingCount)
        }
      } else {
        console.error('Failed to load invitation count:', error)
      }
    } finally {
      isRequestingRef.current = false
    }
  }, [])

  // Load on mount and when location changes, but with debounce
  useEffect(() => {
    loadInvitationCount()
  }, [location.pathname, loadInvitationCount])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Flex minH="100vh">
      {/* Sidebar */}
      <Box
        w="260px"
        bg="white"
        borderRight="1px solid"
        borderColor="gray.200"
        py={6}
        px={4}
        position="fixed"
        h="100vh"
        overflowY="auto"
      >
        <VStack align="stretch" gap={8}>
          {/* Logo */}
          <HStack gap={3} px={2}>
            <Box
              w="40px"
              h="40px"
              bg="brand.500"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FiGrid} color="white" boxSize={6} />
            </Box>
            <VStack align="start" gap={0}>
              <Text fontWeight="bold" fontSize="lg" color="gray.900">
                TaskFlow
              </Text>
              <Badge size="sm" colorPalette="brand" variant="subtle">
                Pro
              </Badge>
            </VStack>
          </HStack>

          {/* Main Nav */}
          <VStack align="stretch" gap={1}>
            <Text fontSize="xs" fontWeight="semibold" color="gray.400" px={3} textTransform="uppercase">
              Main Menu
            </Text>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const count = item.badge === 'invitationCount' ? invitationCount : 0
              return (
                <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                  <Box
                    px={3}
                    py={2.5}
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    gap={3}
                    color={isActive ? 'brand.600' : 'gray.600'}
                    bg={isActive ? 'brand.50' : 'transparent'}
                    fontWeight={isActive ? 'semibold' : 'medium'}
                    _hover={{
                      bg: isActive ? 'brand.50' : 'gray.50',
                    }}
                    cursor="pointer"
                  >
                    <Icon as={item.icon} boxSize={5} />
                    <Text>{item.label}</Text>
                    {count > 0 && (
                      <Badge
                        colorPalette="red"
                        variant="solid"
                        size="sm"
                        borderRadius="full"
                        minW="20px"
                        textAlign="center"
                      >
                        {count}
                      </Badge>
                    )}
                  </Box>
                </Link>
              )
            })}
          </VStack>

          {/* Tasks Section */}
          <VStack align="stretch" gap={1}>
            <Text fontSize="xs" fontWeight="semibold" color="gray.400" px={3} textTransform="uppercase">
              Tasks
            </Text>
            <Box
              px={3}
              py={2.5}
              borderRadius="lg"
              display="flex"
              alignItems="center"
              gap={3}
              color="gray.600"
              fontWeight="medium"
              _hover={{ bg: 'gray.50' }}
              cursor="pointer"
            >
              <Icon as={FiCheckSquare} boxSize={5} />
              <Text>My Tasks</Text>
            </Box>
            <Box
              px={3}
              py={2.5}
              borderRadius="lg"
              display="flex"
              alignItems="center"
              gap={3}
              color="gray.600"
              fontWeight="medium"
              _hover={{ bg: 'gray.50' }}
              cursor="pointer"
            >
              <Icon as={FiFolder} boxSize={5} />
              <Text>Archive</Text>
            </Box>
          </VStack>

          {/* Bottom Section */}
          <VStack align="stretch" gap={1} mt="auto">
            <Box
              px={3}
              py={2.5}
              borderRadius="lg"
              display="flex"
              alignItems="center"
              gap={3}
              color="gray.600"
              fontWeight="medium"
              _hover={{ bg: 'gray.50' }}
              cursor="pointer"
            >
              <Icon as={FiHelpCircle} boxSize={5} />
              <Text>Help Center</Text>
            </Box>
            <Button
              variant="ghost"
              justifyContent="flex-start"
              px={3}
              py={2.5}
              h="auto"
              color="gray.600"
              fontWeight="medium"
              onClick={handleLogout}
            >
              <Icon as={FiLogOut} boxSize={5} mr={3} />
              Log Out
            </Button>
          </VStack>
        </VStack>
      </Box>

      {/* Main Content */}
      <Box ml="260px" flex={1} bg="gray.50" minH="100vh">
        {/* Header */}
        <Box
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          px={8}
          py={4}
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          gap={4}
        >
          <Icon as={FiSettings} boxSize={5} color="gray.500" cursor="pointer" />
          <HStack gap={3}>
            <Avatar.Root size="sm">
              <Avatar.Fallback name={user.username} />
            </Avatar.Root>
          </HStack>
        </Box>

        {/* Page Content */}
        <Box p={8}>{children}</Box>
      </Box>
    </Flex>
  )
}
