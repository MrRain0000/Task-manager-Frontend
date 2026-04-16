import {
  Box,
  Button,
  Checkbox,
  Container,
  Field,
  Flex,
  Heading,
  Input,
  Link,
  Text,
  VStack,
  HStack,
  Separator,
  IconButton,
  Dialog,
  Portal,
  Icon,
} from '@chakra-ui/react'
import { useState } from 'react'
import { FiEye, FiEyeOff, FiGithub, FiCheckCircle, FiMail } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { register } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await register({ username: name, email, password })
      setSuccessMessage(response.message || 'Đăng ký thành công')
      setShowSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Dialog xác nhận đăng ký thành công */}
      <Dialog.Root open={showSuccess} onOpenChange={(e) => { if (!e.open) { setShowSuccess(false); navigate('/login') } }}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content borderRadius="2xl" p={6}>
              <Dialog.Header>
                <VStack gap={4} align="center">
                  <Icon as={FiCheckCircle} boxSize={12} color="green.500" />
                  <Dialog.Title textAlign="center" fontSize="xl" fontWeight="bold">
                    Đăng ký thành công!
                  </Dialog.Title>
                </VStack>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={3} align="center">
                  <Text textAlign="center" color="gray.600">
                    {successMessage}
                  </Text>
                  <HStack gap={2} align="center" bg="blue.50" p={3} borderRadius="lg" w="full">
                    <Icon as={FiMail} boxSize={5} color="blue.500" />
                    <Text fontSize="sm" color="blue.600">
                      Đã gửi link xác thực qua email. Vui lòng kiểm tra hộp thư của bạn.
                    </Text>
                  </HStack>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer justifyContent="center">
                <Button colorPalette="brand" size="lg" w="full" onClick={() => { setShowSuccess(false); navigate('/login') }}>
                  OK
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Left side - Illustration */}
      <Box
        display={{ base: 'none', lg: 'flex' }}
        w="50%"
        bg="brand.500"
        alignItems="center"
        justifyContent="center"
        p={8}
      >
        <VStack color="white" textAlign="center" gap={4}>
          <Heading size="2xl">Join Us Today!</Heading>
          <Text fontSize="lg" maxW="md">
            Create an account and start your amazing journey with our platform.
          </Text>
        </VStack>
      </Box>

      {/* Right side - Register Form */}
      <Flex w={{ base: '100%', lg: '50%' }} alignItems="center" justifyContent="center" p={8}>
        <Container maxW="md">
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <Heading size="xl" mb={2}>Create Account</Heading>
              <Text color="gray.500">Fill in your details to get started</Text>
            </Box>

            {error && (
              <Text color="red.500" textAlign="center">
                {error}
              </Text>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap={4}>
                <Field.Root required>
                  <Field.Label>Full Name</Field.Label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    size="lg"
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Email</Field.Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Password</Field.Label>
                  <Flex position="relative" w="full">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="lg"
                      pr="10"
                    />
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      position="absolute"
                      right={2}
                      top="50%"
                      transform="translateY(-50%)"
                      size="sm"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  </Flex>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Confirm Password</Field.Label>
                  <Flex position="relative" w="full">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      size="lg"
                      pr="10"
                    />
                    <IconButton
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      variant="ghost"
                      position="absolute"
                      right={2}
                      top="50%"
                      transform="translateY(-50%)"
                      size="sm"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  </Flex>
                </Field.Root>

                <Checkbox.Root>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    I agree to the <Link color="brand.500" href="#">Terms of Service</Link> and{' '}
                    <Link color="brand.500" href="#">Privacy Policy</Link>
                  </Checkbox.Label>
                </Checkbox.Root>

                <Button type="submit" colorPalette="brand" size="lg" w="full" loading={isLoading} disabled={isLoading}>
                  Create Account
                </Button>
              </VStack>
            </form>

            <HStack>
              <Separator flex={1} />
              <Text color="gray.400" fontSize="sm">OR CONTINUE WITH</Text>
              <Separator flex={1} />
            </HStack>

            <HStack gap={4} justify="center">
              <Button variant="outline" flex={1} onClick={() => console.log('Google Sign Up')}>
                <FcGoogle />
                <Text ml={2}>Google</Text>
              </Button>
              <Button variant="outline" flex={1}>
                <FiGithub />
                <Text ml={2}>GitHub</Text>
              </Button>
            </HStack>

            <Text textAlign="center">
              Already have an account?{' '}
              <Link color="brand.500" href="/login" fontWeight="semibold">
                Sign in
              </Link>
            </Text>
          </VStack>
        </Container>
      </Flex>
    </Flex>
  )
}
