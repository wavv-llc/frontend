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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { workspaceApi, projectApi, type Workspace, type Project } from "@/lib/api";

// Workspace Item Component with expandable projects
interface WorkspaceItemProps {
  workspace: Workspace;
  projects: Project[];
  isCompressed: boolean;
  onWorkspaceClick: () => void;
  onProjectClick: (workspaceId: string, projectId: string) => void;
}

const WorkspaceItem: React.FC<WorkspaceItemProps> = ({
  workspace,
  projects,
  isCompressed,
  onWorkspaceClick,
  onProjectClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isCompressed) {
    return (
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
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-1">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
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
        {projects.map((project) => (
          <Button
            key={project.id}
            variant="ghost"
            onClick={() => onProjectClick(workspace.id, project.id)}
            className="w-full justify-start gap-2 px-2 py-1.5 text-xs font-normal text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          >
            <FolderKanban className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1 truncate text-left">
              {project.name || `Project ${project.id.slice(0, 8)}`}
            </span>
          </Button>
        ))}
        {projects.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground italic">
            No projects yet
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
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
  }, [getToken]);

  const handleNewChat = () => {
    console.log("Creating new chat...");
    // TODO: Implement when chat API is ready
  };

  const handleSearch = () => {
    console.log("Opening search...");
    // TODO: Implement search
  };

  const handleSettings = () => {
    router.push("/settings");
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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
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
                workspaces.map((workspace) => (
                  <WorkspaceItem
                    key={workspace.id}
                    workspace={workspace}
                    projects={projectsByWorkspace[workspace.id] || []}
                    isCompressed={isCompressed}
                    onWorkspaceClick={() => handleWorkspaceClick(workspace.id)}
                    onProjectClick={handleProjectClick}
                  />
                ))
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
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={handleSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
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
