import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  Icon,
  Spinner,
} from '@chakra-ui/react'
import { FiCheckCircle, FiXCircle, FiMail, FiArrowLeft } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { verifyEmail, resendVerification } from '../services/api'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const email = searchParams.get('email') || ''

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      setMessage('Không tìm thấy token xác thực. Vui lòng kiểm tra lại link trong email.')
      return
    }

    verifyToken()
  }, [token])

  const verifyToken = async () => {
    if (!token) return

    try {
      const response = await verifyEmail(token)
      setStatus('success')
      setMessage(response.message || 'Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.')
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Xác thực thất bại. Token có thể đã hết hạn hoặc không hợp lệ.')
    }
  }

  const handleResend = async () => {
    if (!email) return

    setIsResending(true)
    try {
      await resendVerification(email)
      setResendSuccess(true)
    } catch (error: any) {
      setMessage(error.message || 'Gửi lại email thất bại. Vui lòng thử lại sau.')
    } finally {
      setIsResending(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <Icon as={FiCheckCircle} boxSize={16} color="green.500" />
      case 'error':
        return <Icon as={FiXCircle} boxSize={16} color="red.500" />
      case 'no-token':
        return <Icon as={FiMail} boxSize={16} color="orange.500" />
      default:
        return <Spinner size="xl" color="brand.500" />
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Xác thực thành công!'
      case 'error':
        return 'Xác thực thất bại'
      case 'no-token':
        return 'Token không hợp lệ'
      default:
        return 'Đang xác thực...'
    }
  }

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Card.Root bg="white" borderRadius="2xl" p={8} maxW="480px" w="full" boxShadow="lg">
        <VStack align="center" gap={6}>
          {getStatusIcon()}

          <VStack align="center" gap={2}>
            <Heading size="lg" textAlign="center">
              {getStatusTitle()}
            </Heading>
            <Text color="gray.500" textAlign="center">
              {message}
            </Text>
          </VStack>

          {status === 'success' && (
            <Button colorPalette="brand" size="lg" w="full" onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </Button>
          )}

          {status === 'error' && email && (
            <VStack w="full" gap={3}>
              <Button
                colorPalette="brand"
                size="lg"
                w="full"
                onClick={handleResend}
                disabled={isResending || resendSuccess}
              >
                {isResending ? <Spinner size="sm" /> : resendSuccess ? 'Đã gửi lại email' : 'Gửi lại email xác thực'}
              </Button>
              {resendSuccess && (
                <Text fontSize="sm" color="green.500">
                  Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.
                </Text>
              )}
            </VStack>
          )}

          {(status === 'error' || status === 'no-token') && (
            <Link to="/login" style={{ width: '100%' }}>
              <Button variant="ghost" size="lg" w="full">
                <HStack gap={2}>
                  <FiArrowLeft />
                  <Text>Quay lại đăng nhập</Text>
                </HStack>
              </Button>
            </Link>
          )}

          {status === 'loading' && (
            <Text fontSize="sm" color="gray.400">
              Vui lòng đợi trong giây lát...
            </Text>
          )}
        </VStack>
      </Card.Root>
    </Box>
  )
}
