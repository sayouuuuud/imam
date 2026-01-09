"use client"

 import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog" interface DialogWrapperProps { open: boolean onOpenChange: (open: boolean) => void title: string children: ReactNode className?: string }

export function DialogWrapper({ open, onOpenChange, title, children, className="" }: DialogWrapperProps) {
 
  return ( <Dialog open={open}
onOpenChange = {onOpenChange}>
<DialogContent className={`max-h-[90vh] overflow-y-auto ${className}`}
onOpenAutoFocus = {(e) =>
 e.preventDefault()} > <DialogHeader>
<DialogTitle>
{title}</DialogTitle>
</DialogHeader>

 {children} </DialogContent>
</Dialog>

 ) }
