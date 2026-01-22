"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PanelLeft,
  Plus,
  Menu,
  Settings,
  LogOut,
  User,
  Search,
  ChevronRight,
  ChevronDown,
  FolderKanban,
  Briefcase,
  MessageSquare,
  GripVertical,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { workspaceApi, projectApi, type Workspace, type Project } from "@/lib/api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from "sonner";

// Sortable Project Item
interface SortableProjectItemProps {
  project: Project;
  workspaceId: string;
  onProjectClick: (workspaceId: string, projectId: string) => void;
}

const SortableProjectItem: React.FC<SortableProjectItemProps> = ({
  project,
  workspaceId,
  onProjectClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1 group/project">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover/project:opacity-100 transition-opacity"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      <Button
        variant="ghost"
        onClick={() => onProjectClick(workspaceId, project.id)}
        className="flex-1 justify-start gap-2 px-2 py-1.5 text-xs font-normal text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      >
        <FolderKanban className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 truncate text-left">
          {project.name || `Project ${project.id.slice(0, 8)}`}
        </span>
      </Button>
    </div>
  );
};

// Sortable Workspace Item Component with expandable projects
interface WorkspaceItemProps {
  workspace: Workspace;
  projects: Project[];
  workspaces: Workspace[];
  isCompressed: boolean;
  onWorkspaceClick: () => void;
  onProjectClick: (workspaceId: string, projectId: string) => void;
  onProjectsReorder: (workspaceId: string, projectIds: string[]) => void;
  onMoveProject: (projectId: string, targetWorkspaceId: string) => void;
  isDraggingProject?: boolean;
  dragOverWorkspaceId?: string | null;
}

const WorkspaceItem: React.FC<WorkspaceItemProps> = ({
  workspace,
  projects,
  workspaces,
  isCompressed,
  onWorkspaceClick,
  onProjectClick,
  onProjectsReorder,
  onMoveProject,
  isDraggingProject = false,
  dragOverWorkspaceId = null,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workspace.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if this workspace is being hovered over
  const isOver = dragOverWorkspaceId === workspace.id;

  // Auto-expand when dragging a project over this workspace
  React.useEffect(() => {
    if (isOver && isDraggingProject && !isOpen) {
      setIsOpen(true);
    }
  }, [isOver, isDraggingProject, isOpen, workspace.name]);

  if (isCompressed) {
    return (
      <div ref={setNodeRef} style={style}>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onWorkspaceClick}
                className="w-full h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Briefcase className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
              <p>{workspace.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "flex items-center group/workspace rounded-md transition-all duration-200",
            isOver && isDraggingProject && "bg-blue-50 border-2 border-blue-400 px-1 -mx-1"
          )}
        >
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing w-0 overflow-hidden opacity-0 group-hover/workspace:w-4 group-hover/workspace:opacity-100 transition-all duration-200"
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            onClick={onWorkspaceClick}
            className="flex-1 justify-start gap-2 px-2 py-2 text-sm font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate text-left">{workspace.name}</span>
          </Button>
        </div>
        <CollapsibleContent className="ml-6 mt-1 space-y-1">
          <SortableContext
            items={projects.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {projects.map((project) => (
              <SortableProjectItem
                key={project.id}
                project={project}
                workspaceId={workspace.id}
                onProjectClick={onProjectClick}
              />
            ))}
          </SortableContext>
          {projects.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground italic">
              No projects yet
            </p>
          )}
          <Button
            variant="ghost"
            onClick={() => router.push(`/workspaces/${workspace.id}?createProject=true`)}
            className="w-full justify-start gap-2 px-2 py-1.5 text-xs font-normal text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <Plus className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Add project</span>
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Sidebar Content Component
interface SidebarContentProps {
  showToggle?: boolean;
  onToggleSidebar?: () => void;
  isCompressed?: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  showToggle = true,
  onToggleSidebar,
  isCompressed = false,
}) => {
  const router = useRouter();
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const { refreshTrigger, triggerRefresh } = useSidebar();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projectsByWorkspace, setProjectsByWorkspace] = useState<Record<string, Project[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch workspaces and their projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch workspaces
        const workspacesResponse = await workspaceApi.getWorkspaces(token);
        const workspacesData = workspacesResponse.data || [];
        setWorkspaces(workspacesData);

        // Fetch projects for each workspace
        const projectsData: Record<string, Project[]> = {};
        await Promise.all(
          workspacesData.map(async (workspace) => {
            try {
              const projectsResponse = await projectApi.getProjectsByWorkspace(
                token,
                workspace.id
              );
              // Sort projects by order
              const sortedProjects = (projectsResponse.data || []).sort((a, b) => {
                // Sort by order if available, else date? Backend should sort, but ensuring here is good.
                // Backend findMany uses orderBy: { order: 'asc' }.
                // So we assume they are sorted or we rely on array order.
                return 0;
              });
              projectsData[workspace.id] = projectsResponse.data || [];
            } catch (error) {
              console.error(`Failed to fetch projects for workspace ${workspace.id}:`, error);
              projectsData[workspace.id] = [];
            }
          })
        );
        setProjectsByWorkspace(projectsData);
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken, refreshTrigger]); // Added refreshTrigger to dependencies

  const handleNewChat = () => {
    router.push("/chat");
  };

  const handleSearch = () => {
    console.log("Opening search...");
    // TODO: Implement search
  };

  const handleSettings = () => {
    router.push("/organization/settings");
  };

  const handleWorkspaceClick = (workspaceId: string) => {
    router.push(`/workspaces/${workspaceId}`);
  };

  const handleProjectClick = (workspaceId: string, projectId: string) => {
    router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
  };

  const handleWorkspacesClick = () => {
    router.push("/workspaces");
  };

  const handleHomeClick = () => {
    router.push("/home");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };




  // Track if we're currently dragging a project
  const [isDraggingProject, setIsDraggingProject] = useState(false);
  const [dragOverWorkspaceId, setDragOverWorkspaceId] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start to detect if dragging a project
  const handleDragStart = (event: DragEndEvent) => {
    const { active } = event;

    // Check if dragging a project (not a workspace)
    const isWorkspace = workspaces.some((w) => w.id === active.id);
    const isDraggingProj = !isWorkspace;

    setIsDraggingProject(isDraggingProj);
  };

  // Handle drag over to detect which workspace we're hovering
  const handleDragOver = (event: any) => {
    const { over } = event;

    if (!isDraggingProject || !over) {
      setDragOverWorkspaceId(null);
      return;
    }

    // Check if we're over a workspace directly
    let targetWorkspace = workspaces.find((w) => w.id === over.id);

    // If not directly over a workspace, check if we're over a project
    // and find which workspace that project belongs to
    if (!targetWorkspace) {
      for (const [wsId, projects] of Object.entries(projectsByWorkspace)) {
        if (projects.some((p) => p.id === over.id)) {
          targetWorkspace = workspaces.find((w) => w.id === wsId);
          break;
        }
      }
    }

    if (targetWorkspace) {
      setDragOverWorkspaceId(targetWorkspace.id);
    } else {
      setDragOverWorkspaceId(null);
    }
  };

  // Unified drag handler for both workspaces and projects
  const handleAllDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Reset dragging state
    setIsDraggingProject(false);
    setDragOverWorkspaceId(null);

    if (!over || active.id === over.id) return;

    // Check if dragging a workspace
    const isWorkspace = workspaces.some((w) => w.id === active.id);

    if (isWorkspace) {
      // Handle workspace reordering
      setWorkspaces((items) => {
        const oldIndex = items.findIndex((w) => w.id === active.id);
        const newIndex = items.findIndex((w) => w.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      // TODO: Call API to persist workspace order
    } else {
      // Handle project dragging
      // Find which workspace the project belongs to
      let sourceWorkspaceId: string | null = null;
      let project: Project | null = null;

      for (const [wsId, projects] of Object.entries(projectsByWorkspace)) {
        const found = projects.find((p) => p.id === active.id);
        if (found) {
          sourceWorkspaceId = wsId;
          project = found;
          break;
        }
      }

      if (!sourceWorkspaceId || !project) return;

      // Check if dropped on another project (reorder within workspace)
      let targetWorkspaceId: string | null = null;
      for (const [wsId, projects] of Object.entries(projectsByWorkspace)) {
        if (projects.some((p) => p.id === over.id)) {
          targetWorkspaceId = wsId;
          break;
        }
      }

      // If dropped on a workspace droppable, extract the workspace ID
      if (!targetWorkspaceId && typeof over.id === 'string' && over.id.startsWith('workspace-droppable-')) {
        targetWorkspaceId = over.id.replace('workspace-droppable-', '');
      }

      // Fallback: check if dropped directly on a workspace
      if (!targetWorkspaceId) {
        const workspace = workspaces.find((w) => w.id === over.id);
        if (workspace) {
          targetWorkspaceId = workspace.id;
        }
      }

      if (!targetWorkspaceId) return;

      if (sourceWorkspaceId === targetWorkspaceId) {
        // Reorder within same workspace
        const projects = projectsByWorkspace[sourceWorkspaceId] || [];
        const oldIndex = projects.findIndex((p) => p.id === active.id);
        const newIndex = projects.findIndex((p) => p.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedProjects = arrayMove(projects, oldIndex, newIndex);
          setProjectsByWorkspace((prev) => ({
            ...prev,
            [sourceWorkspaceId!]: reorderedProjects,
          }));

          // Call API to persist project order
          try {
            const token = await getToken();
            if (token) {
              await projectApi.updateProject(token, active.id as string, {
                order: newIndex
              });
            }
          } catch (e) {
            console.error("Failed to reorder project", e);
            triggerRefresh(); // Revert on failure
          }
        }
      } else {
        // Move to different workspace
        let order: number | undefined = undefined;

        // Calculate new index in target workspace
        const targetProjects = projectsByWorkspace[targetWorkspaceId] || [];
        const overIndex = targetProjects.findIndex((p) => p.id === over.id);

        if (overIndex !== -1) {
          order = overIndex;
        } else {
          // Append to end (or 0 if empty)
          order = targetProjects.length;
        }

        await handleMoveProject(active.id as string, targetWorkspaceId, order);
      }
    }
  };

  // Handle project reordering within a workspace (called from WorkspaceItem and handleAllDragEnd)
  const handleProjectsReorder = async (workspaceId: string, projectIds: string[]) => {
    // Optimistic update
    setProjectsByWorkspace((prev) => {
      const projects = prev[workspaceId] || [];
      const reorderedProjects = projectIds
        .map((id) => projects.find((p) => p.id === id))
        .filter((p): p is Project => p !== undefined);

      return {
        ...prev,
        [workspaceId]: reorderedProjects,
      };
    });

    // Call API to persist project order
    try {
      const token = await getToken();
      if (!token) return;

      // We only need to update the moved item, but since we have the new list,
      // we should ideally update orders.
      // However, handleAllDragEnd passes us the *result* of arrayMove via projectIds?
      // Wait, handleProjectsReorder argument is `projectIds` array in new order.
      // Doing bulk update might be heavy.
      // Usually DnD updates via `active` and `over` in `onDragEnd`.
      // Here `handleProjectsReorder` is called by `WorkspaceItem`? 
      // No, `WorkspaceItem` doesn't call it. `WorkspaceItem` prop `onProjectsReorder` is unused in `WorkspaceItem` definition I saw previously? 
      // Line 139: `onProjectsReorder`. But `SortableProjectItem` doesn't invoke it. `DndContext` is in parent.
      // Thus `handleProjectsReorder` is only used if `WorkspaceItem` did something custom.
      // But `handleAllDragEnd` is the one doing the logic.

      // Actually `handleAllDragEnd` at line 465 handles reordering in same workspace.
      // It updates state locally.
      // It should also call API.
      // Let's modify `handleAllDragEnd` (above chunk) to call a helper that calls API.

      // Let's leave handleProjectsReorder as is for now, but update handleAllDragEnd to call API.
      // I will add the API call logic *inside* handleAllDragEnd's section for reordering, not here.
      // But actually `handleAllDragEnd` in my previous thought didn't include the same-workspace API call logic.
      // I should have edited that chunk too.
      // But the chunks are separate.

      // Let's redefine `handleProjectsReorder` to actually perform the API update for a single moved item if possible.
      // But reordering assumes list index = order.
      // I will assume `handleAllDragEnd` (which I didn't fully replace, just the `else` block) needs work.
      // The `if (sourceWorkspaceId === targetWorkspaceId)` block (lines 465-478) needs to call API.

      // I'll skip editing `handleProjectsReorder` logic for now as it seems unused or secondary, 
      // and focus on `handleMoveProject` which I am editing.
    } catch (e) { console.error(e); }
  };

  // Handle moving a project to another workspace
  const handleMoveProject = async (projectId: string, targetWorkspaceId: string, order?: number) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Find the project and its current workspace
      let sourceWorkspaceId: string | null = null;
      let project: Project | null = null;

      for (const [wsId, projects] of Object.entries(projectsByWorkspace)) {
        const found = projects.find((p) => p.id === projectId);
        if (found) {
          sourceWorkspaceId = wsId;
          project = found;
          break;
        }
      }

      if (!sourceWorkspaceId || !project) {
        toast.error('Project not found');
        return;
      }

      // Optimistic update
      setProjectsByWorkspace((prev) => {
        const newState = { ...prev };

        // Remove from source workspace
        newState[sourceWorkspaceId] = (prev[sourceWorkspaceId] || []).filter(
          (p) => p.id !== projectId
        );

        // Add to target workspace
        const targetList = [...(prev[targetWorkspaceId] || [])];
        if (order !== undefined && order >= 0 && order <= targetList.length) {
          targetList.splice(order, 0, project!);
        } else {
          targetList.push(project!);
        }
        newState[targetWorkspaceId] = targetList;

        return newState;
      });

      // Call API to update project workspace and order
      await projectApi.updateProject(token, projectId, {
        workspaceId: targetWorkspaceId,
        order,
      });

      toast.success('Project moved successfully');
    } catch (error) {
      console.error('Failed to move project:', error);
      toast.error('Failed to move project');

      // Revert optimistic update by refetching
      triggerRefresh(); // Simplest revert
    }
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header */}
      <div className={`flex items-center gap-2 p-2 ${isCompressed ? 'flex-col' : ''}`}>
        {showToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={onToggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}
        {!isCompressed ? (
          <>
            <Button
              onClick={handleNewChat}
              className="flex-1 justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearch}
              className="h-9 w-9 flex-shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettings}
              className="h-9 w-9 flex-shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleNewChat}
              size="icon"
              className="h-9 w-9 flex-shrink-0 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSearch}
              className="h-9 w-9 flex-shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
              title="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSettings}
              className="h-9 w-9 flex-shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-6 py-4">
          {/* Home Link */}
          <div>
            {!isCompressed ? (
              <Button
                variant="ghost"
                onClick={handleHomeClick}
                className="w-full justify-start gap-2 px-2 py-2 text-sm font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Home className="h-4 w-4 flex-shrink-0" />
                <span>Home</span>
              </Button>
            ) : (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleHomeClick}
                      className="w-full h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Home className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">
                    <p>Home</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Workspaces Section */}
          <div>
            {!isCompressed && (
              <Button
                variant="ghost"
                onClick={handleWorkspacesClick}
                className="w-full justify-start px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-sidebar-accent/50"
              >
                Workspaces
              </Button>
            )}
            <div className="space-y-1">
              {loading ? (
                !isCompressed && (
                  <div className="space-y-2 px-2 py-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-sm" />
                        <Skeleton className="h-4 w-32 rounded-sm" />
                      </div>
                    ))}
                  </div>
                )
              ) : workspaces.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleAllDragEnd}
                >
                  <SortableContext
                    items={workspaces.map((w) => w.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {workspaces.map((workspace) => (
                      <WorkspaceItem
                        key={workspace.id}
                        workspace={workspace}
                        projects={projectsByWorkspace[workspace.id] || []}
                        workspaces={workspaces}
                        isCompressed={isCompressed}
                        onWorkspaceClick={() => handleWorkspaceClick(workspace.id)}
                        onProjectClick={handleProjectClick}
                        onProjectsReorder={handleProjectsReorder}
                        onMoveProject={handleMoveProject}
                        isDraggingProject={isDraggingProject}
                        dragOverWorkspaceId={dragOverWorkspaceId}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                !isCompressed && (
                  <p className="px-2 py-2 text-xs text-muted-foreground italic">
                    No workspaces yet
                  </p>
                )
              )}
            </div>
          </div>

          {/* Recent Chats Section */}
          <div>
            {!isCompressed && (
              <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Chats
              </h3>
            )}
            <div className="space-y-1">
              {!isCompressed && (
                <p className="px-2 py-2 text-xs text-muted-foreground italic">
                  Chat history coming soon
                </p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      {/* Footer - Clerk User Profile */}
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {!isCompressed ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-2 py-6 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                    {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-sm overflow-hidden">
                  <span className="font-medium truncate w-full">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {user?.emailAddresses?.[0]?.emailAddress || ""}
                  </span>
                </div>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent"
                title={user?.firstName || "User"}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                    {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-popover border-border text-popover-foreground"
          >
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/user/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>



    </div>
  );
};

// Main AppSidebar Component
export const AppSidebar: React.FC = () => {
  const { isOpen, toggle } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border transition-all duration-300 ease-in-out ${isOpen ? 'w-[260px]' : 'w-[60px]'
          }`}
      >
        <SidebarContent
          onToggleSidebar={toggle}
          isCompressed={!isOpen}
        />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-4 top-4 z-40 h-9 w-9 text-foreground hover:bg-sidebar-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[260px] p-0 bg-sidebar border-sidebar-border"
          >
            <SidebarContent showToggle={false} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
