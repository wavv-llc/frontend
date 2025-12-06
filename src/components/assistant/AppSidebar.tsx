'use client'

import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import {
  Folder,
  Plus,
  Search,
  Pencil,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

// Placeholder data - will be replaced with real data later
const projects = [
  { id: '1', name: 'Integrated Tax Workspace Project', count: 12 },
  { id: '2', name: 'Q4 Review', count: 5 },
  { id: '3', name: 'Audit Support', count: 3 },
  { id: '4', name: 'Client Tax Prep 2024', count: 8 },
]

export function AppSidebar() {
  const { user } = useUser()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-[52px] flex items-center p-0">
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full h-full px-2">
            <SidebarTrigger className="h-8 w-8" />
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 w-full h-full gap-2">
            {/* Company Logo - Left Side */}
            <div className="flex items-center h-8">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-sidebar-foreground"
              >
                <rect width="32" height="32" rx="6" fill="currentColor" opacity="0.1" />
                <path
                  d="M16 8L20 12H18V20H14V12H12L16 8Z"
                  fill="currentColor"
                  opacity="0.8"
                />
                <path
                  d="M10 22H22V24H10V22Z"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            </div>
            
            {/* Toggle Button - Right Side */}
            <div className="flex items-center h-8">
              <SidebarTrigger className="h-8 w-8" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {isCollapsed ? (
          /* Collapsed: Show 3 icon buttons */
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="New chat"
                    className="w-full justify-center"
                  >
                    <Pencil className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Search chats"
                    className="w-full justify-center"
                  >
                    <Search className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Projects"
                    className="w-full justify-center"
                  >
                    <Folder className="h-5 w-5" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          /* Expanded: Show full layout */
          <>
            {/* Top Actions */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">
                      <Pencil className="h-4 w-4" />
                      <span>New chat</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">
                      <Search className="h-4 w-4" />
                      <span>Search chats</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Projects Section */}
            <SidebarGroup className="mt-2">
              <div className="flex items-center justify-between px-2">
                <SidebarGroupLabel>Projects</SidebarGroupLabel>
                <button
                  className="text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-md p-1 hover:bg-sidebar-accent transition-colors"
                  title="New project"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">
                      <Folder className="h-4 w-4" />
                      <span>New project</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {projects.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton className="w-full">
                        <Folder className="h-4 w-4" />
                        <div className="flex items-center justify-between min-w-0 flex-1">
                          <span className="truncate text-sm">{project.name}</span>
                          {project.count !== undefined && (
                            <span className="text-xs text-sidebar-foreground/60 ml-2 shrink-0">
                              {project.count}
                            </span>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className={cn(
        "border-t border-sidebar-border h-[68px] flex items-center p-0",
        isCollapsed && "border-t-0"
      )}>
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full h-full px-2">
            <UserButton />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 w-full h-full">
            <UserButton />
            <div className="flex flex-col min-w-0 flex-1 justify-center">
              <span className="text-sm font-medium truncate">
                {user?.firstName || 'User'} {user?.lastName || ''}
              </span>
              {user?.emailAddresses?.[0]?.emailAddress && (
                <span className="text-xs text-sidebar-foreground/60 truncate">
                  {user.emailAddresses[0].emailAddress}
                </span>
              )}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}