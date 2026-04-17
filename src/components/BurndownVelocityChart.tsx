import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Box, HStack, Text, Badge } from '@chakra-ui/react'

interface DayData {
  day: string
  fullDay: string
  value: number
  isToday: boolean
}

// Mock data - trong thực tế sẽ fetch từ API
const weeklyData: DayData[] = [
  { day: 'MON', fullDay: 'Monday', value: 4, isToday: false },
  { day: 'TUE', fullDay: 'Tuesday', value: 6, isToday: false },
  { day: 'WED', fullDay: 'Wednesday', value: 5, isToday: false },
  { day: 'THU', fullDay: 'Thursday', value: 8, isToday: true },
  { day: 'FRI', fullDay: 'Friday', value: 0, isToday: false },
  { day: 'SAT', fullDay: 'Saturday', value: 0, isToday: false },
  { day: 'SUN', fullDay: 'Sunday', value: 0, isToday: false },
]

const monthlyData: DayData[] = [
  { day: 'W1', fullDay: 'Week 1', value: 24, isToday: false },
  { day: 'W2', fullDay: 'Week 2', value: 32, isToday: true },
  { day: 'W3', fullDay: 'Week 3', value: 0, isToday: false },
  { day: 'W4', fullDay: 'Week 4', value: 0, isToday: false },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Box
        bg="gray.900"
        color="white"
        px={3}
        py={2}
        borderRadius="md"
        fontSize="sm"
        boxShadow="lg"
      >
        <Text fontWeight="semibold">{label}</Text>
        <Text fontSize="xs" color="gray.300">
          {payload[0].value} tasks completed
        </Text>
      </Box>
    )
  }
  return null
}

export default function BurndownVelocityChart() {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly')
  const data = viewMode === 'weekly' ? weeklyData : monthlyData

  // Calculate stats
  const totalCompleted = data.reduce((sum, d) => sum + d.value, 0)
  const todayData = data.find(d => d.isToday)
  const currentDayIndex = data.findIndex(d => d.isToday)
  const avgVelocity = currentDayIndex > 0
    ? (totalCompleted / (currentDayIndex + 1)).toFixed(1)
    : totalCompleted.toString()

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            Sprint #42 - "Engine Refactor"
          </Text>
          <HStack gap={4} mt={1}>
            <Text fontSize="xs" color="gray.500">
              Total: <Text as="span" fontWeight="semibold" color="brand.600">{totalCompleted}</Text> tasks
            </Text>
            <Text fontSize="xs" color="gray.500">
              Avg: <Text as="span" fontWeight="semibold" color="brand.600">{avgVelocity}</Text>/day
            </Text>
          </HStack>
        </Box>
        <HStack gap={2}>
          <Badge
            variant={viewMode === 'weekly' ? 'solid' : 'subtle'}
            colorPalette={viewMode === 'weekly' ? 'brand' : 'gray'}
            cursor="pointer"
            onClick={() => setViewMode('weekly')}
            px={2}
            py={1}
          >
            Weekly
          </Badge>
          <Badge
            variant={viewMode === 'monthly' ? 'solid' : 'subtle'}
            colorPalette={viewMode === 'monthly' ? 'brand' : 'gray'}
            cursor="pointer"
            onClick={() => setViewMode('monthly')}
            px={2}
            py={1}
          >
            Monthly
          </Badge>
        </HStack>
      </HStack>

      {/* Chart */}
      <Box h="200px" w="full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar
              dataKey="value"
              radius={[4, 4, 4, 4]}
              maxBarSize={40}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isToday ? '#0F4C81' : '#A5B4FC'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Legend */}
      <HStack justify="center" gap={4} mt={2}>
        <HStack gap={2}>
          <Box w={3} h={3} bg="#A5B4FC" borderRadius="sm" />
          <Text fontSize="xs" color="gray.500">Completed</Text>
        </HStack>
        <HStack gap={2}>
          <Box w={3} h={3} bg="#0F4C81" borderRadius="sm" />
          <Text fontSize="xs" color="gray.500">Today</Text>
        </HStack>
      </HStack>
    </Box>
  )
}
