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
  Spinner,
} from '@chakra-ui/react'
import { FiCheck, FiX, FiMail, FiBriefcase, FiUser } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { getMyInvitations, respondToInvitation, type Invitation } from '../services/api'
import Layout from '../components/Layout'

const PROJECT_ICONS = [
  { bg: 'blue.100', color: 'blue.600', icon: FiBriefcase },
  { bg: 'orange.100', color: 'orange.600', icon: FiMail },
  { bg: 'purple.100', color: 'purple.600', icon: FiUser },
  { bg: 'green.100', color: 'green.600', icon: FiBriefcase },
]

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      loadInvitations()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadInvitations = async () => {
    setIsLoading(true)
    try {
      const invitationsList = await getMyInvitations()
      const pending = Array.isArray(invitationsList)
        ? invitationsList.filter((i) => i.status === 'PENDING')
        : []
      setInvitations(pending)
    } catch (error) {
      console.error('Failed to load invitations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (text: string, ok: boolean) => {
    setToastMsg({ text, ok })
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleRespond = async (invitationId: number, projectId: number, accept: boolean) => {
    setProcessingId(projectId)
    try {
      await respondToInvitation(projectId, { isAccept: accept })
      showToast(
        accept ? 'Invitation accepted successfully!' : 'Invitation rejected.',
        accept
      )
      // Remove responded invitation from list immediately
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    } catch (error: any) {
      showToast(error?.message || 'Something went wrong.', false)
      console.error('Failed to respond to invitation:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const getIconConfig = (idx: number) => PROJECT_ICONS[idx % PROJECT_ICONS.length]

  return (
    <Layout>
      <VStack align="stretch" gap={6} maxW="900px">
        {/* Toast */}
        {toastMsg && (
          <Box
            position="fixed"
            top={4}
            right={4}
            zIndex={9999}
            bg={toastMsg.ok ? 'green.500' : 'red.500'}
            color="white"
            px={5}
            py={3}
            borderRadius="lg"
            boxShadow="lg"
            fontSize="sm"
            fontWeight="medium"
          >
            {toastMsg.text}
          </Box>
        )}

        {/* Header */}
        <Box>
          <Heading size="xl" mb={1}>
            Pending Invitations
          </Heading>
          <Text color="gray.500">
            Manage your project access and collaboration requests.
          </Text>
        </Box>

        {/* Content */}
        {isLoading ? (
          <HStack justify="center" py={16}>
            <Spinner size="xl" color="blue.500" />
          </HStack>
        ) : invitations.length === 0 ? (
          <Card.Root bg="white" borderRadius="2xl" p={14} textAlign="center">
            <VStack gap={4}>
              <Box
                w="72px"
                h="72px"
                bg="gray.100"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiMail} boxSize={9} color="gray.400" />
              </Box>
              <Box>
                <Heading size="md" mb={2}>
                  No Pending Invitations
                </Heading>
                <Text color="gray.500">
                  You don't have any project invitations at the moment.
                </Text>
              </Box>
            </VStack>
          </Card.Root>
        ) : (
          <VStack align="stretch" gap={3}>
            {invitations.map((invitation, idx) => {
              const iconCfg = getIconConfig(idx)
              const IconComp = iconCfg.icon
              const isProcessing = processingId === invitation.projectId
              const badgeLabel =
                idx === 0 ? 'NEW' : idx === 1 ? '2 DAYS AGO' : 'LAST WEEK'

              return (
                <Card.Root
                  key={invitation.id}
                  bg="white"
                  borderRadius="xl"
                  boxShadow="sm"
                  _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
                  transition="all 0.2s"
                  overflow="hidden"
                >
                  {/* Left accent bar on second item (like screenshot) */}
                  {idx === 1 && (
                    <Box
                      position="absolute"
                      left={0}
                      top={0}
                      bottom={0}
                      w="4px"
                      bg="orange.400"
                      borderTopLeftRadius="xl"
                      borderBottomLeftRadius="xl"
                    />
                  )}

                  <HStack px={6} py={5} justify="space-between" align="center">
                    {/* Left: Icon + Info */}
                    <HStack gap={4} flex={1}>
                      <Box
                        w="48px"
                        h="48px"
                        bg={iconCfg.bg}
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Icon as={IconComp} boxSize={5} color={iconCfg.color} />
                      </Box>

                      <Box>
                        <HStack gap={2} mb={1} flexWrap="wrap">
                          <Text fontWeight="bold" fontSize="md">
                            {invitation.projectName}
                          </Text>
                          <Badge
                            size="sm"
                            colorPalette={idx === 0 ? 'orange' : 'gray'}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {badgeLabel}
                          </Badge>
                        </HStack>

                        <HStack gap={3} color="gray.500" fontSize="sm">
                          <HStack gap={1}>
                            <Icon as={FiUser} boxSize={3} />
                            <Text>Project Owner</Text>
                          </HStack>
                          <Text color="gray.300">•</Text>
                          <HStack gap={1}>
                            <Icon as={FiBriefcase} boxSize={3} />
                            <Text>{invitation.role}</Text>
                          </HStack>
                        </HStack>
                      </Box>
                    </HStack>

                    {/* Right: Action Buttons */}
                    <HStack gap={2} flexShrink={0}>
                      <Button
                        variant="outline"
                        size="sm"
                        colorPalette="gray"
                        disabled={isProcessing}
                        onClick={() => handleRespond(invitation.id, invitation.projectId, false)}
                        _hover={{ borderColor: 'red.400', color: 'red.500' }}
                      >
                        <Icon as={FiX} />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        bg="blue.700"
                        color="white"
                        _hover={{ bg: 'blue.800' }}
                        loading={isProcessing}
                        onClick={() => handleRespond(invitation.id, invitation.projectId, true)}
                      >
                        <Icon as={FiCheck} />
                        Accept
                      </Button>
                    </HStack>
                  </HStack>
                </Card.Root>
              )
            })}
          </VStack>
        )}

        {/* Bottom Summary Bar */}
        {!isLoading && invitations.length > 0 && (
          <HStack
            bg="white"
            borderRadius="xl"
            px={6}
            py={4}
            justify="space-between"
            boxShadow="sm"
          >
            <HStack gap={2}>
              <Box w={2} h={2} bg="orange.400" borderRadius="full" />
              <Text fontSize="sm" color="gray.600">
                <Text as="span" fontWeight="bold" color="gray.800">
                  {invitations.length}
                </Text>{' '}
                pending invitation{invitations.length !== 1 ? 's' : ''} awaiting your response
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.400">
              Accepting gives project access immediately
            </Text>
          </HStack>
        )}
      </VStack>
    </Layout>
  )
}
