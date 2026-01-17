"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
    PanelLeft,
    Plus,
    Menu,
    Settings,
    LogOut,
    User,
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";

// Mock data types
export interface ChatSession {
    id: string;
    title: string;
    date: Date;
}

// Helper function to group chats by date
const groupChatsByDate = (chats: ChatSession[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const groups: { label: string; chats: ChatSession[] }[] = [
        { label: "Today", chats: [] },
        { label: "Yesterday", chats: [] },
        { label: "Previous 7 Days", chats: [] },
        { label: "Older", chats: [] },
    ];

    chats.forEach((chat) => {
        const chatDate = new Date(
            chat.date.getFullYear(),
            chat.date.getMonth(),
            chat.date.getDate()
        );

        if (chatDate.getTime() === today.getTime()) {
            groups[0].chats.push(chat);
        } else if (chatDate.getTime() === yesterday.getTime()) {
            groups[1].chats.push(chat);
        } else if (chatDate >= sevenDaysAgo) {
            groups[2].chats.push(chat);
        } else {
            groups[3].chats.push(chat);
        }
    });

    return groups.filter((group) => group.chats.length > 0);
};

// Mock chat data
const mockChats: ChatSession[] = [
    { id: "1", title: "Building a ChatGPT Sidebar", date: new Date() },
    { id: "2", title: "Next.js 14 App Router Guide", date: new Date() },
    {
        id: "3",
        title: "Tailwind CSS Best Practices",
        date: new Date(Date.now() - 86400000),
    },
    {
        id: "4",
        title: "TypeScript Advanced Types",
        date: new Date(Date.now() - 86400000),
    },
    {
        id: "5",
        title: "React Server Components",
        date: new Date(Date.now() - 2 * 86400000),
    },
    {
        id: "6",
        title: "Shadcn UI Component Library",
        date: new Date(Date.now() - 3 * 86400000),
    },
    {
        id: "7",
        title: "API Route Handlers in Next.js",
        date: new Date(Date.now() - 5 * 86400000),
    },
    {
        id: "8",
        title: "Database Design Patterns",
        date: new Date(Date.now() - 10 * 86400000),
    },
    {
        id: "9",
        title: "Authentication with NextAuth",
        date: new Date(Date.now() - 15 * 86400000),
    },
];

interface SidebarContentProps {
    activeChatId: string;
    onChatSelect: (id: string) => void;
    onNewChat: () => void;
    onRenameChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    showToggle?: boolean;
    onToggleSidebar?: () => void;
    isCompressed?: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
    activeChatId,
    onChatSelect,
    onNewChat,
    onRenameChat,
    onDeleteChat,
    showToggle = true,
    onToggleSidebar,
    isCompressed = false,
}) => {
    const groupedChats = groupChatsByDate(mockChats);

    return (
        <div className="flex h-full flex-col bg-slate-900">
            {/* Header */}
            <div className={`flex items-center gap-2 p-2 ${isCompressed ? 'flex-col' : ''}`}>
                {showToggle && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        onClick={onToggleSidebar}
                    >
                        <PanelLeft className="h-5 w-5" />
                    </Button>
                )}
                {!isCompressed && (
                    <Button
                        onClick={onNewChat}
                        className="flex-1 justify-start gap-2 bg-slate-800 text-slate-100 hover:bg-slate-700"
                    >
                        <Plus className="h-4 w-4" />
                        New Chat
                    </Button>
                )}
                {isCompressed && (
                    <Button
                        onClick={onNewChat}
                        size="icon"
                        className="h-9 w-9 flex-shrink-0 bg-slate-800 text-slate-100 hover:bg-slate-700"
                        title="New Chat"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                )}
            </div>

            <Separator className="bg-slate-800" />

            {/* Scrollable Chat History */}
            <ScrollArea className="flex-1 px-2">
                <div className="space-y-4 py-4">
                    {groupedChats.map((group) => (
                        <div key={group.label}>
                            {!isCompressed && (
                                <h3 className="mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {group.label}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.chats.map((chat) => (
                                    <SidebarItem
                                        key={chat.id}
                                        chat={chat}
                                        isActive={chat.id === activeChatId}
                                        onSelect={() => onChatSelect(chat.id)}
                                        onRename={() => onRenameChat(chat.id)}
                                        onDelete={() => onDeleteChat(chat.id)}
                                        isCompressed={isCompressed}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <Separator className="bg-slate-800" />

            {/* Footer - User Profile */}
            <div className="p-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {!isCompressed ? (
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 px-2 py-6 text-slate-100 hover:bg-slate-800"
                            >
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback className="bg-slate-700 text-slate-100">
                                        JD
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start text-sm overflow-hidden">
                                    <span className="font-medium truncate w-full">John Doe</span>
                                    <span className="text-xs text-slate-400 truncate w-full">john@example.com</span>
                                </div>
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-slate-100 hover:bg-slate-800"
                                title="John Doe"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback className="bg-slate-700 text-slate-100">
                                        JD
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 bg-slate-800 border-slate-700 text-slate-100"
                    >
                        <DropdownMenuItem className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem className="cursor-pointer text-red-400 hover:bg-slate-700 focus:bg-slate-700 focus:text-red-400">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export const Sidebar: React.FC = () => {
    const [activeChatId, setActiveChatId] = useState("1");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleNewChat = () => {
        console.log("Creating new chat...");
    };

    const handleChatSelect = (id: string) => {
        setActiveChatId(id);
        console.log("Selected chat:", id);
    };

    const handleRenameChat = (id: string) => {
        console.log("Renaming chat:", id);
    };

    const handleDeleteChat = (id: string) => {
        console.log("Deleting chat:", id);
    };

    const handleToggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:block fixed left-0 top-0 z-40 h-screen border-r border-slate-800 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-[260px]' : 'w-[60px]'
                    }`}
            >
                <SidebarContent
                    activeChatId={activeChatId}
                    onChatSelect={handleChatSelect}
                    onNewChat={handleNewChat}
                    onRenameChat={handleRenameChat}
                    onDeleteChat={handleDeleteChat}
                    onToggleSidebar={handleToggleSidebar}
                    isCompressed={!isSidebarOpen}
                />
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="fixed left-4 top-4 z-40 h-9 w-9 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-[260px] p-0 bg-slate-900 border-slate-800"
                    >
                        <SidebarContent
                            activeChatId={activeChatId}
                            onChatSelect={handleChatSelect}
                            onNewChat={handleNewChat}
                            onRenameChat={handleRenameChat}
                            onDeleteChat={handleDeleteChat}
                            showToggle={false}
                        />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
};
