import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Box, HStack, Text, Badge, Spinner } from '@chakra-ui/react'
import { getDashboardStats, type DashboardStats } from '../services/api'

interface DayData {
  day: string
  fullDay: string
  value: number
  isToday: boolean
}

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
          {payload[0].value} tasks
        </Text>
      </Box>
    )
  }
  return null
}

// Get day name from date string (YYYY-MM-DD)
const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr)
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  return days[date.getDay()]
}

// Format date for display
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function BurndownVelocityChart() {
  const [viewMode, setViewMode] = useState<'status' | 'weekly'>('status')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Single API call to get dashboard stats
  useEffect(() => {
    const loadData = async () => {
      // Check cache first (valid for 5 minutes)
      const cacheKey = 'dashboard_velocity_cache'
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { timestamp, data } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setStats(data)
          setIsLoading(false)
          return
        }
      }

      setIsLoading(true)
      try {
        // Get dashboard stats - SINGLE API CALL
        const statsRes = await getDashboardStats()
        setStats(statsRes.data)

        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: statsRes.data
        }))
      } catch (error) {
        console.error('Failed to load velocity data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate data from dashboard stats
  const { statusData, weeklyData, totalCompleted } = useMemo(() => {
    const summary = stats?.taskSummary
    const weeklyVelocity = stats?.weeklyVelocity
    
    if (!summary) {
      return {
        statusData: [] as DayData[],
        weeklyData: [] as DayData[],
        totalCompleted: 0,
      }
    }

    // Status breakdown chart
    const statusData: DayData[] = [
      { day: 'TODO', fullDay: 'To Do', value: summary.todoCount, isToday: false },
      { day: 'DOING', fullDay: 'In Progress', value: summary.inProgressCount, isToday: true },
      { day: 'DONE', fullDay: 'Completed', value: summary.doneCount, isToday: false },
      { day: 'CANC', fullDay: 'Cancelled', value: summary.cancelledCount, isToday: false },
    ]

    // Weekly velocity from API data
    let weeklyData: DayData[] = []
    if (weeklyVelocity && weeklyVelocity.length > 0) {
      weeklyData = weeklyVelocity.map((item, index) => {
        const dayName = getDayName(item.date)
        const isToday = index === weeklyVelocity.length - 1 // Last day is today
        return {
          day: dayName,
          fullDay: formatDate(item.date),
          value: item.completedCount,
          isToday,
        }
      })
    } else {
      // Fallback if no weekly data
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      const today = new Date().getDay()
      weeklyData = days.map((day, i) => ({
        day,
        fullDay: day,
        value: i === today ? summary.doneCount : 0,
        isToday: i === today,
      }))
    }

    return {
      statusData,
      weeklyData,
      totalCompleted: summary.doneCount,
    }
  }, [stats])

  const data = viewMode === 'status' ? statusData : weeklyData
  const totalTasks = stats?.totalTasks || 0
  const topProject = stats?.topProjects?.[0]

  if (isLoading) {
    return (
      <Box minH="200px" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="md" color="brand.500" />
      </Box>
    )
  }

  if (!stats) {
    return (
      <Box minH="200px" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="sm" color="gray.400">No data available</Text>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            {topProject?.projectName || 'All Projects'} - Task Overview
          </Text>
          <HStack gap={4} mt={1}>
            <Text fontSize="xs" color="gray.500">
              Total: <Text as="span" fontWeight="semibold" color="brand.600">{totalTasks}</Text> tasks
            </Text>
            <Text fontSize="xs" color="gray.500">
              Done: <Text as="span" fontWeight="semibold" color="green.600">{totalCompleted}</Text>
            </Text>
          </HStack>
        </Box>
        <HStack gap={2}>
          <Badge
            variant={viewMode === 'status' ? 'solid' : 'subtle'}
            colorPalette={viewMode === 'status' ? 'brand' : 'gray'}
            cursor="pointer"
            onClick={() => setViewMode('status')}
            px={2}
            py={1}
          >
            By Status
          </Badge>
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
        </HStack>
      </HStack>

      {/* Chart */}
      <Box minH="200px" h="200px" w="full">
        {data.length > 0 ? (
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
                maxBarSize={50}
              >
                {data.map((entry, index) => {
                  // Different colors for different statuses
                  const colors = viewMode === 'status' 
                    ? ['#F59E0B', '#3B82F6', '#10B981', '#6B7280'] // TODO, DOING, DONE, CANC
                    : entry.isToday ? '#0F4C81' : '#A5B4FC' // Today vs other days for weekly
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={Array.isArray(colors) ? colors[index % colors.length] : colors}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" h="full">
            <Text fontSize="sm" color="gray.400">No task data</Text>
          </Box>
        )}
      </Box>

      {/* Legend */}
      <HStack justify="center" gap={4} mt={2}>
        {viewMode === 'status' ? (
          <>
            <HStack gap={2}>
              <Box w={3} h={3} bg="#F59E0B" borderRadius="sm" />
              <Text fontSize="xs" color="gray.500">Todo</Text>
            </HStack>
            <HStack gap={2}>
              <Box w={3} h={3} bg="#3B82F6" borderRadius="sm" />
              <Text fontSize="xs" color="gray.500">Doing</Text>
            </HStack>
            <HStack gap={2}>
              <Box w={3} h={3} bg="#10B981" borderRadius="sm" />
              <Text fontSize="xs" color="gray.500">Done</Text>
            </HStack>
          </>
        ) : (
          <>
            <HStack gap={2}>
              <Box w={3} h={3} bg="#A5B4FC" borderRadius="sm" />
              <Text fontSize="xs" color="gray.500">Other days</Text>
            </HStack>
            <HStack gap={2}>
              <Box w={3} h={3} bg="#0F4C81" borderRadius="sm" />
              <Text fontSize="xs" color="gray.500">Today</Text>
            </HStack>
          </>
        )}
      </HStack>
    </Box>
  )
}
