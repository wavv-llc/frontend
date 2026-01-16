'use client'

import { useState, useEffect } from 'react'
import { useUser, UserButton, useAuth } from '@clerk/nextjs'
import {
  Folder,
  Plus,
  Search,
  MessageSquare,
  Settings,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Clock,
  Hash,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { workspaceApi, projectApi, type Workspace, type Project } from '@/lib/api'

const recents: { id: string; title: string }[] = []

export function AppSidebar() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set())
  const [workspaceProjects, setWorkspaceProjects] = useState<Record<string, Project[]>>({})
  const [loadingProjects, setLoadingProjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const token = await getToken()
        if (!token) return

        const response = await workspaceApi.getWorkspaces(token)
        setWorkspaces(response.data || [])
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
      } finally {
        setIsLoadingWorkspaces(false)
      }
    }

    fetchWorkspaces()
  }, [getToken])

  const toggleWorkspace = async (workspaceId: string) => {
    const newExpanded = new Set(expandedWorkspaces)

    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId)
    } else {
      newExpanded.add(workspaceId)

      // Fetch projects if not already loaded
      if (!workspaceProjects[workspaceId]) {
        setLoadingProjects(prev => new Set(prev).add(workspaceId))
        try {
          const token = await getToken()
          if (!token) return

          const response = await projectApi.getProjectsByWorkspace(token, workspaceId)
          setWorkspaceProjects(prev => ({
            ...prev,
            [workspaceId]: response.data || []
          }))
        } catch (error) {
          console.error('Failed to fetch projects:', error)
        } finally {
          setLoadingProjects(prev => {
            const newSet = new Set(prev)
            newSet.delete(workspaceId)
            return newSet
          })
        }
      }
    }

    setExpandedWorkspaces(newExpanded)
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="h-14 flex flex-row items-center justify-between px-4 border-b border-sidebar-border/50">
        <div className="font-semibold text-lg tracking-tight group-data-[state=collapsed]:hidden">Wavv</div>
        <SidebarTrigger className="text-sidebar-foreground/50 hover:text-sidebar-foreground ml-auto" />
      </SidebarHeader>

      <SidebarContent className="gap-2 p-2">
        {/* New Chat & Search */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-sidebar-border/50 shadow-sm"
            >
              <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <MessageSquare className="size-3.5" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[state=collapsed]:hidden">
                <span className="font-semibold">New chat</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
              <Search className="mr-2 h-4 w-4" />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Recent Chats / History */}
        <SidebarGroup>
          <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 group-data-[state=collapsed]:hidden">
            Recents
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {recents.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton className="group/item text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                    <Clock className="mr-2 h-4 w-4 text-sidebar-foreground/50" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workspaces List */}
        <SidebarGroup>
          <div className="px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 group-data-[state=collapsed]:hidden flex items-center justify-between">
            <Link href="/workspaces" className="hover:text-sidebar-foreground transition-colors">Workspaces</Link>
            <Plus className="h-3 w-3 cursor-pointer hover:text-sidebar-foreground" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingWorkspaces ? (
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50">Loading...</div>
              ) : workspaces.length === 0 ? (
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50 group-data-[state=collapsed]:hidden">
                  No workspaces yet
                </div>
              ) : (
                workspaces.map((workspace) => {
                  const isExpanded = expandedWorkspaces.has(workspace.id)
                  const projects = workspaceProjects[workspace.id] || []
                  const isLoading = loadingProjects.has(workspace.id)

                  return (
                    <SidebarMenuItem key={workspace.id}>
                      <SidebarMenuButton
                        className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        onClick={() => toggleWorkspace(workspace.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="mr-2 h-4 w-4 text-sidebar-foreground/50" />
                        ) : (
                          <ChevronRight className="mr-2 h-4 w-4 text-sidebar-foreground/50" />
                        )}
                        <Hash className="mr-2 h-4 w-4 text-sidebar-foreground/50" />
                        <span className="truncate">{workspace.name}</span>
                      </SidebarMenuButton>

                      {isExpanded && (
                        <SidebarMenuSub>
                          {isLoading ? (
                            <SidebarMenuSubItem>
                              <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                                Loading projects...
                              </div>
                            </SidebarMenuSubItem>
                          ) : projects.length === 0 ? (
                            <SidebarMenuSubItem>
                              <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                                No projects yet
                              </div>
                            </SidebarMenuSubItem>
                          ) : (
                            projects.map((project) => (
                              <SidebarMenuSubItem key={project.id}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={`/workspaces/${workspace.id}?projectId=${project.id}`}>
                                    <FileText className="h-4 w-4" />
                                    <span className="truncate">{project.description || `Project ${project.id.slice(0, 8)}`}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))
                          )}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-2">
        <SidebarMenu>
          {/* Settings Link */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <div className="h-8 w-8 rounded-lg overflow-hidden">
                <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2 group-data-[state=collapsed]:hidden">
                <span className="truncate font-semibold">{user?.fullName || 'User'}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
              <MoreHorizontal className="ml-auto size-4 group-data-[state=collapsed]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}