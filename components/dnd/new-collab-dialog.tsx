import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import NewCollabForm from "./new-collab-form"
import { Plus } from "lucide-react"
import { SidebarMenuButton } from "../ui/sidebar"

export function NewCollabDialog() {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <SidebarMenuButton tooltip={"New Collab"}>
            <Plus className="h-2 w-2" />
            <span>New Collab</span>
          </SidebarMenuButton>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Collab</DialogTitle>
            <DialogDescription>
              Add a title to your new collab session and press submit
            </DialogDescription>
          </DialogHeader>
          <NewCollabForm setOpen={setOpen} />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <SidebarMenuButton>
          <Plus className="h-2 w-2" />
          <span>New Collab</span>
        </SidebarMenuButton>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>New Collab</DrawerTitle>
          <DrawerDescription>
            Add a title to your new collab session and press submit
          </DrawerDescription>
        </DrawerHeader>
        <NewCollabForm setOpen={setOpen} className="px-4" />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
