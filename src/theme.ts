import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Primary brand color - bạn có thể thay đổi theo màu từ Stitch
        brand: {
          50: { value: '#E6F6FF' },
          100: { value: '#B3E0FF' },
          200: { value: '#80CBFF' },
          300: { value: '#4DB5FF' },
          400: { value: '#1A9FFF' },
          500: { value: '#0077CC' },  // Primary color
          600: { value: '#005FA3' },
          700: { value: '#00477A' },
          800: { value: '#002F52' },
          900: { value: '#001829' },
        },
        // Neutral colors
        gray: {
          50: { value: '#F9FAFB' },
          100: { value: '#F3F4F6' },
          200: { value: '#E5E7EB' },
          300: { value: '#D1D5DB' },
          400: { value: '#9CA3AF' },
          500: { value: '#6B7280' },
          600: { value: '#4B5563' },
          700: { value: '#374151' },
          800: { value: '#1F2937' },
          900: { value: '#111827' },
        },
      },
      fonts: {
        heading: { value: 'Inter, system-ui, sans-serif' },
        body: { value: 'Inter, system-ui, sans-serif' },
      },
    },
  },
})

export const system = createSystem(defaultConfig, customConfig)
