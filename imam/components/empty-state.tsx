import type React from "react" import type { LucideIcon } from "lucide-react"
import { FileX } from "lucide-react" interface EmptyStateProps { icon?: LucideIcon title: string description?: string action?: React.ReactNode }

export function EmptyState({ icon: Icon = FileX, title, description, action }: EmptyStateProps) {
 
  return ( <div className="text-center py-16 px-4">
<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
 <Icon className="h-8 w-8 text-text-muted" />
</div>
<h3 className="text-lg font-bold text-foreground mb-2">
{title}</h3>

 {description && <p className="text-text-muted mb-6 max-w-md mx-auto">
{description}</p>

} {action} </div>

 ) }

