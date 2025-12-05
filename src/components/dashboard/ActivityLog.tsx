import { Card } from '@/components/ui/card'
import { ArrowRight, Circle } from 'lucide-react'

interface ActivityItem {
  id: string
  // sample types for now
  type: 'upload' | 'edit' | 'review' | 'other'
  message: string
  timestamp?: Date
}

interface ActivityLogProps {
  activities?: ActivityItem[]
}

const defaultActivities: ActivityItem[] = [
  // {
  //   id: '1',
  //   type: 'upload',
  //   message: 'New Tax Document Uploaded',
  // },
  // {
  //   id: '2',
  //   type: 'edit',
  //   message: 'Tax Document Edited',
  // },
]

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'upload':
      return 'bg-red-500'
    case 'edit':
      return 'bg-blue-400'
    case 'review':
      return 'bg-green-500'
    default:
      return 'bg-gray-400'
  }
}

export function ActivityLog({ activities = defaultActivities }: ActivityLogProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Activity log</h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <Card
            key={activity.id}
            className="flex items-center gap-3 p-4 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <Circle
              className={`h-3 w-3 ${getActivityColor(activity.type)} rounded-full flex-shrink-0`}
              fill="currentColor"
            />
            <span className="flex-1 text-sm">{activity.message}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Card>
        ))}
      </div>
    </div>
  )
}

