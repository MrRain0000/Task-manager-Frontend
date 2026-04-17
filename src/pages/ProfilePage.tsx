import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  Input,
  Field,
  Avatar,
  Separator,
  Icon,
} from '@chakra-ui/react'
import { FiUser, FiMail, FiLock, FiSave, FiCheckCircle, FiFolder, FiCheckSquare } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { getCurrentUser, updateUserProfile, changeUserPassword, type User } from '../services/api'

interface UserProfile extends User {
  totalProjects: number
  totalTasks: number
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await getCurrentUser()
      setUser(response.data)
      setEditUsername(response.data.username)
    } catch (error) {
      console.error('Không thể tải thông tin profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!editUsername.trim()) {
      alert('Username không được để trống')
      return
    }

    setIsUpdating(true)
    try {
      const response = await updateUserProfile(editUsername)
      setUser(response.data)
      alert('Cập nhật profile thành công')
    } catch (error: any) {
      alert(error.message || 'Cập nhật profile thất bại')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      alert('Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (newPassword.length < 6) {
      alert('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp')
      return
    }

    setIsChangingPassword(true)
    try {
      await changeUserPassword(currentPassword, newPassword)
      alert('Đổi mật khẩu thành công')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      alert(error.message || 'Đổi mật khẩu thất bại')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <Text textAlign="center" py={8}>Đang tải...</Text>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <Text textAlign="center" py={8}>Không thể tải thông tin</Text>
      </Layout>
    )
  }

  return (
    <Layout>
      <VStack align="stretch" gap={6} maxW="800px" mx="auto">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>Profile</Heading>
          <Text color="gray.500">Quản lý thông tin cá nhân và bảo mật</Text>
        </Box>

        {/* User Info Card */}
        <Card.Root bg="white" borderRadius="2xl" p={6}>
          <HStack gap={6} mb={6}>
            <Avatar.Root size="2xl">
              <Avatar.Fallback name={user.username} bg="brand.500" color="white" fontSize="2xl" />
            </Avatar.Root>
            <Box>
              <Heading size="lg">{user.username}</Heading>
              <HStack gap={2} mt={1}>
                <Icon as={FiMail} color="gray.400" />
                <Text color="gray.500">{user.email}</Text>
              </HStack>
              <HStack gap={2} mt={2}>
                {user.isVerified ? (
                  <HStack gap={1} color="green.500">
                    <Icon as={FiCheckCircle} />
                    <Text fontSize="sm">Đã xác thực</Text>
                  </HStack>
                ) : (
                  <Text fontSize="sm" color="orange.500">Chưa xác thực</Text>
                )}
              </HStack>
            </Box>
          </HStack>

          <Separator mb={6} />

          {/* Stats */}
          <HStack gap={6} justify="center">
            <VStack align="center">
              <HStack gap={2} color="brand.500">
                <Icon as={FiFolder} boxSize={5} />
                <Heading size="lg">{user.totalProjects}</Heading>
              </HStack>
              <Text fontSize="sm" color="gray.500">Dự án</Text>
            </VStack>
            <Separator orientation="vertical" h="50px" />
            <VStack align="center">
              <HStack gap={2} color="green.500">
                <Icon as={FiCheckSquare} boxSize={5} />
                <Heading size="lg">{user.totalTasks}</Heading>
              </HStack>
              <Text fontSize="sm" color="gray.500">Task được giao</Text>
            </VStack>
          </HStack>
        </Card.Root>

        {/* Edit Profile Card */}
        <Card.Root bg="white" borderRadius="2xl" p={6}>
          <Heading size="md" mb={4}>Chỉnh sửa Profile</Heading>
          <VStack align="stretch" gap={4}>
            <Field.Root>
              <Field.Label>Username</Field.Label>
              <HStack gap={2}>
                <Icon as={FiUser} color="gray.400" />
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Nhập username"
                />
              </HStack>
            </Field.Root>
            <Field.Root>
              <Field.Label>Email</Field.Label>
              <HStack gap={2}>
                <Icon as={FiMail} color="gray.400" />
                <Input value={user.email} disabled />
              </HStack>
            </Field.Root>
            <Button
              colorPalette="brand"
              onClick={handleUpdateProfile}
              loading={isUpdating}
              disabled={isUpdating || editUsername === user.username}
              alignSelf="flex-end"
            >
              <Icon as={FiSave} mr={2} />
              Lưu thay đổi
            </Button>
          </VStack>
        </Card.Root>

        {/* Change Password Card */}
        <Card.Root bg="white" borderRadius="2xl" p={6}>
          <Heading size="md" mb={4}>Đổi mật khẩu</Heading>
          <VStack align="stretch" gap={4}>
            <Field.Root>
              <Field.Label>Mật khẩu hiện tại</Field.Label>
              <HStack gap={2}>
                <Icon as={FiLock} color="gray.400" />
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </HStack>
            </Field.Root>
            <Field.Root>
              <Field.Label>Mật khẩu mới</Field.Label>
              <HStack gap={2}>
                <Icon as={FiLock} color="gray.400" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </HStack>
            </Field.Root>
            <Field.Root>
              <Field.Label>Xác nhận mật khẩu mới</Field.Label>
              <HStack gap={2}>
                <Icon as={FiLock} color="gray.400" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </HStack>
            </Field.Root>
            <Button
              colorPalette="brand"
              onClick={handleChangePassword}
              loading={isChangingPassword}
              disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              alignSelf="flex-end"
            >
              <Icon as={FiLock} mr={2} />
              Đổi mật khẩu
            </Button>
          </VStack>
        </Card.Root>
      </VStack>
    </Layout>
  )
}
