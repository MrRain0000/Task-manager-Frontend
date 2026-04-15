import { Box, Badge, Text, HStack, Avatar, VStack } from '@chakra-ui/react'
import { FiCalendar, FiUser } from 'react-icons/fi'
import { useState, useEffect, useRef } from 'react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { Task } from '../services/api'

interface KanbanBoardProps {
  tasks: Task[]
  onMoveTask: (taskId: number, toStatus: string, toPosition: number) => void
}

interface Column {
  id: string
  title: string
  color: string
}

const COLUMNS: Column[] = [
  { id: 'TODO', title: 'To Do', color: 'orange' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'blue' },
  { id: 'DONE', title: 'Done', color: 'green' },
  { id: 'CANCELLED', title: 'Cancelled', color: 'red' },
]

function TaskCard({ task, onDragStart }: { task: Task; onDragStart: (task: Task) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    return combine(
      draggable({
        element,
        getInitialData: () => ({ task }),
        onDragStart: () => {
          setIsDragging(true)
          onDragStart(task)
        },
        onDrop: () => setIsDragging(false),
      })
    )
  }, [task, onDragStart])

  const statusColors: Record<string, string> = {
    TODO: 'orange',
    IN_PROGRESS: 'blue',
    DONE: 'green',
    CANCELLED: 'red',
  }

  return (
    <Box
      ref={ref}
      bg="white"
      borderRadius="xl"
      p={4}
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.100"
      cursor="grab"
      opacity={isDragging ? 0.5 : 1}
      _hover={{ boxShadow: 'md' }}
    >
      <HStack justify="space-between" mb={2}>
        <Badge size="sm" variant="subtle" colorPalette={statusColors[task.status]}>
          {task.status.replace('_', ' ')}
        </Badge>
      </HStack>
      <Text fontWeight="medium" mb={2}>{task.title}</Text>
      <Text fontSize="sm" color="gray.500" mb={3} lineClamp={2}>
        {task.description}
      </Text>
      <HStack justify="space-between" fontSize="xs" color="gray.400">
        <HStack gap={1}>
          <FiCalendar />
          <Text>Oct 18</Text>
        </HStack>
        {task.assigneeId ? (
          <Avatar.Root size="xs">
            <Avatar.Fallback name="User" />
          </Avatar.Root>
        ) : (
          <FiUser />
        )}
      </HStack>
    </Box>
  )
}

function KanbanColumn({
  column,
  tasks,
  onDrop,
}: {
  column: Column
  tasks: Task[]
  onDrop: (taskId: number, toPosition: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isOver, setIsOver] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    return combine(
      dropTargetForElements({
        element,
        onDragEnter: () => setIsOver(true),
        onDragLeave: () => setIsOver(false),
        onDrop: ({ source }) => {
          setIsOver(false)
          const task = (source.data as any).task as Task
          onDrop(task.id, tasks.length)
        },
      })
    )
  }, [column.id, tasks.length, onDrop])

  const colorMap: Record<string, string> = {
    orange: '#ED8936',
    blue: '#4299E1',
    green: '#48BB78',
    red: '#F56565',
  }

  return (
    <VStack
      ref={ref}
      align="stretch"
      gap={3}
      flex={1}
      minW="280px"
      bg={isOver ? 'blue.50' : 'gray.50'}
      borderRadius="2xl"
      p={4}
      border="2px dashed"
      borderColor={isOver ? 'blue.300' : 'transparent'}
      transition="all 0.2s"
    >
      <HStack gap={2} mb={1}>
        <Box w="3px" h="20px" bg={colorMap[column.color]} borderRadius="full" />
        <Text fontWeight="semibold">{column.title}</Text>
        <Badge size="sm" variant="subtle">{tasks.length}</Badge>
      </HStack>

      <VStack align="stretch" gap={3} minH="100px">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onDragStart={() => {}} />
        ))}
        {tasks.length === 0 && (
          <Box p={4} bg="white" borderRadius="xl" border="2px dashed" borderColor="gray.200">
            <Text fontSize="sm" color="gray.400" textAlign="center">
              Drop tasks here
            </Text>
          </Box>
        )}
      </VStack>
    </VStack>
  )
}

export default function KanbanBoard({ tasks, onMoveTask }: KanbanBoardProps) {
  const handleDrop = (columnId: string, taskId: number, toPosition: number) => {
    onMoveTask(taskId, columnId, toPosition)
  }

  return (
    <HStack align="start" gap={4} overflowX="auto" pb={2} h="full">
      {COLUMNS.map((column) => {
        const columnTasks = tasks
          .filter((t) => t.status === column.id)
          .sort((a, b) => a.position - b.position)

        return (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={columnTasks}
            onDrop={(taskId, toPosition) => handleDrop(column.id, taskId, toPosition)}
          />
        )
      })}
    </HStack>
  )
}
