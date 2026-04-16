import { Box, Badge, Text, HStack, Avatar, VStack } from '@chakra-ui/react'
import { FiCalendar, FiUser } from 'react-icons/fi'
import { useState, useEffect, useRef, useCallback } from 'react'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { Task, ProjectMember } from '../services/api'
import TaskDetailsModal from './TaskDetailsModal'

interface KanbanBoardProps {
  tasks: Task[]
  projectId: number
  members: ProjectMember[]
  onMoveTask: (taskId: number, fromStatus: string, toStatus: string, toPosition: number) => Promise<void>
  onTaskUpdated?: (task: Task) => void
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

// Drop indicator component
function DropIndicator({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null
  return (
    <Box
      h="4px"
      bg="blue.500"
      borderRadius="full"
      my={1}
      transition="all 0.15s"
    />
  )
}

function TaskCard({
  task,
  index,
  columnId,
  onClick,
}: {
  task: Task
  index: number
  columnId: string
  onClick?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    return combine(
      draggable({
        element,
        getInitialData: () => ({
          task,
          index,
          columnId,
          type: 'task-card',
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      })
    )
  }, [task, index, columnId])

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
      opacity={isDragging ? 0.4 : 1}
      _hover={{ boxShadow: 'md', borderColor: 'gray.200' }}
      transition="all 0.2s"
      onClick={() => {
        // Prevent click when dragging
        if (!isDragging && onClick) {
          onClick()
        }
      }}
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
  onMoveTask,
  isLoading,
  onTaskClick,
}: {
  column: Column
  tasks: Task[]
  onMoveTask: (taskId: number, fromStatus: string, toStatus: string, toPosition: number) => Promise<void>
  isLoading: boolean
  onTaskClick?: (taskId: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const tasksRef = useRef(tasks)
  const [isOver, setIsOver] = useState(false)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  // Keep tasks ref up to date without triggering effect
  tasksRef.current = tasks

  useEffect(() => {
    const element = ref.current
    if (!element) return

    return combine(
      dropTargetForElements({
        element,
        onDragEnter: () => setIsOver(true),
        onDragLeave: () => {
          setIsOver(false)
          setDropIndex(null)
        },
        onDrag: ({ source, location }) => {
          // Calculate drop position based on cursor location
          const target = location.current.dropTargets[0]?.element
          if (!target) {
            setDropIndex(null)
            return
          }

          const taskElements = Array.from(target.querySelectorAll('[data-task-index]'))

          // Find the index where we should drop
          let newIndex = tasksRef.current.length
          const mouseY = location.current.input.clientY

          for (let i = 0; i < taskElements.length; i++) {
            const taskEl = taskElements[i] as HTMLElement
            const taskRect = taskEl.getBoundingClientRect()
            const taskMiddle = taskRect.top + taskRect.height / 2

            if (mouseY < taskMiddle) {
              newIndex = i
              break
            }
          }

          // Adjust index if dragging within same column
          const sourceTask = (source.data as any).task as Task
          const sourceIndex = (source.data as any).index as number
          const sourceColumnId = (source.data as any).columnId as string

          if (sourceTask && sourceColumnId === column.id) {
            // When moving within same column, account for the removed item
            if (sourceIndex < newIndex) {
              newIndex = Math.max(0, newIndex - 1)
            }
          }

          setDropIndex(newIndex)
        },
        onDrop: ({ source }) => {
          setIsOver(false)

          const draggedTask = (source.data as any).task as Task
          const sourceIndex = (source.data as any).index as number
          const sourceColumnId = (source.data as any).columnId as string

          if (!draggedTask) return

          // Calculate final position
          let finalPosition = dropIndex !== null ? dropIndex : tasks.length

          // If moving within same column
          if (sourceColumnId === column.id) {
            if (sourceIndex === finalPosition) {
              setDropIndex(null)
              return // No change needed
            }
            // When moving down, the position shifts due to removal
            if (sourceIndex < finalPosition) {
              finalPosition = Math.max(0, finalPosition - 1)
            }
          }

          setDropIndex(null)
          onMoveTask(draggedTask.id, sourceColumnId, column.id, finalPosition)
        },
      })
    )
  }, [column.id, onMoveTask])

  const colorMap: Record<string, string> = {
    orange: '#ED8936',
    blue: '#4299E1',
    green: '#48BB78',
    red: '#F56565',
  }

  // Render tasks with drop indicators
  const renderTasks = () => {
    const elements: React.ReactNode[] = []

    // Drop indicator at the beginning
    if (isOver && dropIndex === 0) {
      elements.push(<DropIndicator key="drop-start" isVisible={true} />)
    }

    tasks.forEach((task, index) => {
      // Show drop indicator before this task if it's the drop position
      if (isOver && dropIndex === index && index > 0) {
        elements.push(<DropIndicator key={`drop-${index}`} isVisible={true} />)
      }

      elements.push(
        <Box key={task.id} data-task-index={index}>
          <TaskCard 
            task={task} 
            index={index} 
            columnId={column.id} 
            onClick={() => onTaskClick?.(task.id)}
          />
        </Box>
      )
    })

    // Drop indicator at the end
    if (isOver && (dropIndex === null || dropIndex === tasks.length)) {
      elements.push(<DropIndicator key="drop-end" isVisible={true} />)
    }

    return elements
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
      opacity={isLoading ? 0.7 : 1}
    >
      <HStack gap={2} mb={1}>
        <Box w="3px" h="20px" bg={colorMap[column.color]} borderRadius="full" />
        <Text fontWeight="semibold">{column.title}</Text>
        <Badge size="sm" variant="subtle">{tasks.length}</Badge>
      </HStack>

      <VStack align="stretch" gap={2} minH="100px">
        {tasks.length === 0 && !isOver ? (
          <Box
            p={4}
            bg="white"
            borderRadius="xl"
            border="2px dashed"
            borderColor="gray.200"
          >
            <Text fontSize="sm" color="gray.400" textAlign="center">
              Drop tasks here
            </Text>
          </Box>
        ) : (
          renderTasks()
        )}
      </VStack>
    </VStack>
  )
}

export default function KanbanBoard({
  tasks,
  projectId,
  members,
  onMoveTask,
  onTaskUpdated,
}: KanbanBoardProps) {
  const [movingTaskId, setMovingTaskId] = useState<number | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

  const handleMoveTask = useCallback(
    async (taskId: number, fromStatus: string, toStatus: string, toPosition: number) => {
      setMovingTaskId(taskId)
      try {
        await onMoveTask(taskId, fromStatus, toStatus, toPosition)
      } finally {
        setMovingTaskId(null)
      }
    },
    [onMoveTask]
  )

  const handleTaskClick = (taskId: number) => {
    setSelectedTaskId(taskId)
  }

  const handleCloseModal = () => {
    setSelectedTaskId(null)
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    onTaskUpdated?.(updatedTask)
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
            onMoveTask={handleMoveTask}
            isLoading={movingTaskId !== null}
            onTaskClick={handleTaskClick}
          />
        )
      })}

      {selectedTaskId && (
        <TaskDetailsModal
          projectId={projectId}
          taskId={selectedTaskId}
          isOpen={true}
          onClose={handleCloseModal}
          members={members}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </HStack>
  )
}
