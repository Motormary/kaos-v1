"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

type props = {
  children: ReactNode
}

export default function AuthedLayout({ children }: props) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Inset>{children}</Inset>
    </SidebarProvider>
  )
}

function Inset({ children }: props) {
  const { open } = useSidebar()

  const width = open ? "calc(100% - 16rem)" : "calc(100% - 48px)"

  return (
    <SidebarInset
      style={{ width }}
      className={cn(!open && "delay-200", "transition-[width] ease-linear")}
    >
      <header className="flex h-12 shrink-0 items-center gap-2 transition-[width] ease-linear">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Building Your Application
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Data Fetching</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div>{children}</div>
    </SidebarInset>
  )
}
