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
import { FiCheckCircle, FiXCircle, FiMail, FiArrowLeft, FiSend } from 'react-icons/fi'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
  const hasCalled = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      setMessage('Không tìm thấy token xác thực. Vui lòng kiểm tra lại link trong email.')
      return
    }

    // Tránh gọi API 2 lần do React StrictMode
    if (hasCalled.current) return
    hasCalled.current = true

    verifyToken()
  }, [token])

  const verifyToken = async () => {
    if (!token) return

    try {
      // API: GET /api/auth/verify?token={token}
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
      // API: POST /api/auth/resend-verification { email }
      const response = await resendVerification(email)
      setResendSuccess(true)
      setMessage(response.message || 'Email xác thực đã được gửi lại.')
    } catch (error: any) {
      setMessage(error.message || 'Gửi lại email thất bại.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" p={4}>
      <Card.Root bg="white" borderRadius="2xl" p={8} maxW="480px" w="full" boxShadow="lg">
        <VStack align="center" gap={6}>
          {/* Icon theo trạng thái */}
          {status === 'success' && <Icon as={FiCheckCircle} boxSize={16} color="green.500" />}
          {status === 'error' && <Icon as={FiXCircle} boxSize={16} color="red.500" />}
          {status === 'no-token' && <Icon as={FiMail} boxSize={16} color="orange.500" />}
          {status === 'loading' && <Spinner size="xl" color="brand.500" />}

          {/* Tiêu đề */}
          <VStack align="center" gap={2}>
            <Heading size="lg" textAlign="center">
              {status === 'success' && 'Xác thực thành công!'}
              {status === 'error' && 'Xác thực thất bại'}
              {status === 'no-token' && 'Token không hợp lệ'}
              {status === 'loading' && 'Đang xác thực...'}
            </Heading>
            <Text color="gray.500" textAlign="center">
              {message}
            </Text>
          </VStack>

          {/* Nút theo trạng thái */}
          {status === 'success' && (
            <Button colorPalette="brand" size="lg" w="full" onClick={() => navigate('/login')}>
              Đăng nhập ngay
            </Button>
          )}

          {status === 'error' && email && !resendSuccess && (
            <Button
              colorPalette="brand"
              size="lg"
              w="full"
              onClick={handleResend}
              loading={isResending}
              disabled={isResending}
            >
              <HStack gap={2}>
                <FiSend />
                <Text>Gửi lại email xác thực</Text>
              </HStack>
            </Button>
          )}

          {resendSuccess && (
            <HStack gap={2} bg="green.50" p={3} borderRadius="lg" w="full">
              <Icon as={FiCheckCircle} color="green.500" />
              <Text fontSize="sm" color="green.600">
                Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.
              </Text>
            </HStack>
          )}

          {(status === 'error' || status === 'no-token') && (
            <Button variant="ghost" size="lg" w="full" onClick={() => navigate('/login')}>
              <HStack gap={2}>
                <FiArrowLeft />
                <Text>Quay lại đăng nhập</Text>
              </HStack>
            </Button>
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
