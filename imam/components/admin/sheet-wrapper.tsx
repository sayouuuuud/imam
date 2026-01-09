"use client"

 import type { ReactNode } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet" interface SheetWrapperProps { open: boolean onOpenChange: (open: boolean) => void title: string children: ReactNode side?: "top" | "right" | "bottom" | "left" }

export function SheetWrapper({ open, onOpenChange, title, children, side = "left" }: SheetWrapperProps) {
 
  return ( <Sheet open={open}
onOpenChange = {onOpenChange}>
<SheetContent side={side}
className="overflow-y-auto" onOpenAutoFocus={(e) =>
 e.preventDefault()}> <SheetHeader>
<SheetTitle>
{title}</SheetTitle>
</SheetHeader>

 <div className="mt-6">
{children}</div>
</SheetContent>

 </Sheet>

 ) }
