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
} from '@chakra-ui/react'
import { useState } from 'react'
import { FiEye, FiEyeOff, FiGithub } from 'react-icons/fi'
import { FcGoogle } from 'react-icons/fc'
import { login } from '../services/api'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()  
    setError('')
    setIsLoading(true)

    try {
      const response = await login({ email, password })
      console.log('[Login] Full response:', response)
      console.log('[Login] response.data:', response.data)
      console.log('[Login] response.data.accessToken:', response.data?.accessToken)
      console.log('[Login] response.data.user:', response.data?.user)
      localStorage.setItem('token', response.data.accessToken)
      localStorage.setItem('user', JSON.stringify(response.data.user || { id: 1, username: email.split('@')[0], email }))
      console.log('[Login] Redirecting to /')
      window.location.href = '/'
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Flex minH="100vh" bg="gray.50">
      {/* Left side - Illustration (có thể thay ảnh từ Stitch) */}
      <Box
        display={{ base: 'none', lg: 'flex' }}
        w="50%"
        bg="brand.500"
        alignItems="center"
        justifyContent="center"
        p={8}
      >
        <VStack color="white" textAlign="center" gap={4}>
          <Heading size="2xl">Welcome Back!</Heading>
          <Text fontSize="lg" maxW="md">
            Sign in to continue your journey with us. We are glad to see you again!
          </Text>
        </VStack>
      </Box>

      {/* Right side - Login Form */}
      <Flex w={{ base: '100%', lg: '50%' }} alignItems="center" justifyContent="center" p={8}>
        <Container maxW="md">
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <Heading size="xl" mb={2}>Sign In</Heading>
              <Text color="gray.500">Enter your credentials to access your account</Text>
            </Box>

            {error && (
              <Text color="red.500" textAlign="center">
                {error}
              </Text>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap={4}>
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
                      placeholder="Enter your password"
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

                <HStack justify="space-between" w="full">
                  <Checkbox.Root>
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>Remember me</Checkbox.Label>
                  </Checkbox.Root>
                  <Link color="brand.500" href="#">
                    Forgot password?
                  </Link>
                </HStack>

                <Button type="submit" colorPalette="brand" size="lg" w="full" loading={isLoading} disabled={isLoading}>
                  Sign In
                </Button>
              </VStack>
            </form>

            <HStack>
              <Separator flex={1} />
              <Text color="gray.400" fontSize="sm">OR CONTINUE WITH</Text>
              <Separator flex={1} />
            </HStack>

            <HStack gap={4} justify="center">
              <Button variant="outline" flex={1} onClick={() => console.log('Google Sign In')}>
                <FcGoogle />
                <Text ml={2}>Google</Text>
              </Button>
              <Button variant="outline" flex={1}>
                <FiGithub />
                <Text ml={2}>GitHub</Text>
              </Button>
            </HStack>

            <Text textAlign="center">
              Don't have an account?{' '}
              <Link color="brand.500" href="/register" fontWeight="semibold">
                Sign up
              </Link>
            </Text>
          </VStack>
        </Container>
      </Flex>
    </Flex>
  )
}
