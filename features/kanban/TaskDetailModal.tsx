// "use client"

// import { format } from "date-fns"
// import { Calendar, Clock, Mail } from "lucide-react"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// import { cn } from "@/lib/utils"
// import type { Task } from "@/features/tasks/tasks.types"
// import type { ColumnConfig } from "./kanban.types"
// import { COLUMN_COLOR_STYLES, COLOR_DOT } from "./kanban.types"

// const PRIORITY_STYLES: Record<string, { label: string; cls: string; dot: string }> = {
//   LOW:    {
//     label: "Low",
//     cls:   "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
//     dot:   "bg-slate-400",
//   },
//   MEDIUM: {
//     label: "Medium",
//     cls:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
//     dot:   "bg-amber-500",
//   },
//   HIGH:   {
//     label: "High",
//     cls:   "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
//     dot:   "bg-rose-500",
//   },
// }

// const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
//   PENDING:     { label: "Pending",     cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
//   IN_PROGRESS: { label: "In Progress", cls: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
//   DONE:        { label: "Done",        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
// }

// function getInitials(name: string) {
//   return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
// }

// const AVATAR_COLORS = [
//   "bg-violet-500", "bg-blue-500", "bg-emerald-500",
//   "bg-amber-500",  "bg-rose-500", "bg-indigo-500",
// ]

// function avatarColor(name: string) {
//   return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
// }

// interface TaskDetailModalProps {
//   task: Task | null
//   open: boolean
//   onClose: () => void
//   column?: ColumnConfig
// }

// function PersonRow({
//   person,
//   role,
// }: {
//   person: { id: string; name: string; email: string }
//   role: string
// }) {
//   return (
//     <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
//       <Avatar className="w-7 h-7 flex-shrink-0">
//         <AvatarFallback className={cn("text-[10px] font-bold text-white", avatarColor(person.name))}>
//           {getInitials(person.name)}
//         </AvatarFallback>
//       </Avatar>
//       <div className="flex-1 min-w-0">
//         <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{person.name}</p>
//         <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
//           <Mail className="w-2.5 h-2.5 flex-shrink-0" />
//           {person.email}
//         </p>
//       </div>
//       <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0 uppercase tracking-wide">
//         {role}
//       </span>
//     </div>
//   )
// }

// export function TaskDetailModal({ task, open, onClose, column }: TaskDetailModalProps) {
//   if (!task) return null

//   const priority = PRIORITY_STYLES[task.priority]
//   const status = STATUS_STYLES[task.status]
//   const colStyles = column ? COLUMN_COLOR_STYLES[column.color] : null

//   return (
//     <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
//       <DialogContent
//         className={cn(
//           "max-w-md p-0 gap-0 overflow-hidden",
//           "bg-white dark:bg-slate-900",
//           "border border-slate-200 dark:border-slate-700",
//         )}
//       >
//         {/* Top accent bar */}
//         {column && (
//           <div className={cn("h-1 w-full", COLOR_DOT[column.color])} />
//         )}

//         <div className="px-5 pt-5 pb-4 space-y-4">
//           {/* Header */}
//           <DialogHeader className="space-y-2 text-left">
//             {column && (
//               <div className={cn(
//                 "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit",
//                 colStyles?.badge,
//               )}>
//                 <span className={cn("w-1.5 h-1.5 rounded-full", COLOR_DOT[column.color])} />
//                 {column.title}
//               </div>
//             )}
//             <DialogTitle className="text-base font-bold text-slate-900 dark:text-white leading-snug pr-6">
//               {task.title}
//             </DialogTitle>
//           </DialogHeader>

//           {/* Status & Priority badges */}
//           <div className="flex flex-wrap gap-1.5">
//             <span className={cn(
//               "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md",
//               priority.cls,
//             )}>
//               <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
//               {priority.label} priority
//             </span>
//             <span className={cn(
//               "inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md",
//               status.cls,
//             )}>
//               {status.label}
//             </span>
//           </div>

//           {/* Description */}
//           {task.description ? (
//             <section className="space-y-1">
//               <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
//                 Description
//               </p>
//               <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
//                 {task.description}
//               </p>
//             </section>
//           ) : (
//             <p className="text-xs text-slate-400 dark:text-slate-500 italic">No description provided.</p>
//           )}

//           {/* Meta info grid */}
//           <div className="grid grid-cols-2 gap-3 pt-1">
//             {task.dueDate && (
//               <div className="space-y-0.5">
//                 <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
//                   Due date
//                 </p>
//                 <div className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200">
//                   <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
//                   {format(new Date(task.dueDate), "MMM d, yyyy")}
//                 </div>
//               </div>
//             )}
//             <div className="space-y-0.5">
//               <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
//                 Created
//               </p>
//               <div className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-200">
//                 <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
//                 {format(new Date(task.createdAt), "MMM d, yyyy")}
//               </div>
//             </div>
//           </div>

//           {/* Divider */}
//           <div className="h-px bg-slate-200 dark:bg-slate-700" />

//           {/* People */}
//           <section className="space-y-2">
//             <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
//               People
//             </p>
//             <div className="space-y-1.5">
//               {task.responsible && (
//                 <PersonRow person={task.responsible} role="Owner" />
//               )}
//               {task.createdBy && (
//                 <PersonRow person={task.createdBy} role="Creator" />
//               )}
//               {!task.responsible && !task.createdBy && (
//                 <p className="text-xs text-slate-400 dark:text-slate-500 italic">No assignees.</p>
//               )}
//             </div>
//           </section>
//         </div>

//         {/* Footer with ID */}
//         <div className="px-5 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
//           <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
//             ID: {task.id.slice(0, 8)}…
//           </p>
//         </div>
//       </DialogContent>
//     </Dialog>
//   )
// }
