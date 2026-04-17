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
import { getProjects, getProjectDetail, type ProjectDetail, type Project } from '../services/api'

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

export default function BurndownVelocityChart() {
  const [viewMode, setViewMode] = useState<'status' | 'weekly'>('status')
  const [project, setProject] = useState<Project | null>(null)
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Single API call to get project with taskSummary
  useEffect(() => {
    const loadData = async () => {
      // Check cache first (valid for 5 minutes)
      const cacheKey = 'project_velocity_cache'
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { timestamp, data } = JSON.parse(cached)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setProject(data.project)
          setProjectDetail(data.detail)
          setIsLoading(false)
          return
        }
      }

      setIsLoading(true)
      try {
        // Get first project only
        const projectsRes = await getProjects()
        const projectList = projectsRes.data.projects || []
        
        if (projectList.length === 0) {
          setIsLoading(false)
          return
        }

        const firstProject = projectList[0]
        setProject(firstProject)

        // Get project detail with taskSummary - SINGLE API CALL
        const detailRes = await getProjectDetail(firstProject.id)
        setProjectDetail(detailRes.data)

        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: { project: firstProject, detail: detailRes.data }
        }))
      } catch (error) {
        console.error('Failed to load velocity data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate data from taskSummary
  const { statusData, weeklyData, totalCompleted } = useMemo(() => {
    const summary = projectDetail?.taskSummary
    
    if (!summary) {
      return {
        statusData: [] as DayData[],
        weeklyData: [] as DayData[],
        totalCompleted: 0,
      }
    }

    // Status breakdown chart (replaces historical velocity)
    const statusData: DayData[] = [
      { day: 'TODO', fullDay: 'To Do', value: summary.todoCount, isToday: false },
      { day: 'DOING', fullDay: 'In Progress', value: summary.inProgressCount, isToday: true },
      { day: 'DONE', fullDay: 'Completed', value: summary.doneCount, isToday: false },
      { day: 'CANC', fullDay: 'Cancelled', value: summary.cancelledCount, isToday: false },
    ]

    // Weekly view (simplified - distribute tasks by status)
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const weeklyData: DayData[] = days.map((day, i) => ({
      day,
      fullDay: day,
      value: i === 4 ? summary.doneCount : Math.floor(summary.doneCount / 7), // Today is THU
      isToday: i === 4, // Thursday as today
    }))

    return {
      statusData,
      weeklyData,
      totalCompleted: summary.doneCount,
    }
  }, [projectDetail])

  const data = viewMode === 'status' ? statusData : weeklyData
  const totalTasks = projectDetail?.taskSummary?.totalTasks || 0

  if (isLoading) {
    return (
      <Box minH="200px" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="md" color="brand.500" />
      </Box>
    )
  }

  if (!project) {
    return (
      <Box minH="200px" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="sm" color="gray.400">No active project</Text>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">
            {project.name} - Task Overview
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
                {data.map((_, index) => {
                  // Different colors for different statuses
                  const colors = viewMode === 'status' 
                    ? ['#F59E0B', '#3B82F6', '#10B981', '#6B7280'] // TODO, DOING, DONE, CANC
                    : ['#A5B4FC', '#A5B4FC', '#A5B4FC', '#0F4C81', '#A5B4FC', '#A5B4FC', '#A5B4FC']
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
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
              <Text fontSize="xs" color="gray.500">Today (Thu)</Text>
            </HStack>
          </>
        )}
      </HStack>
    </Box>
  )
}
