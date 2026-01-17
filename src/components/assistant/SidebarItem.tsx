"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ChatSession } from "./Sidebar";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
    chat: ChatSession;
    isActive: boolean;
    onSelect: () => void;
    onRename: () => void;
    onDelete: () => void;
    isCompressed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
    chat,
    isActive,
    onSelect,
    onRename,
    onDelete,
    isCompressed = false,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Compressed mode - show only icon with tooltip
    if (isCompressed) {
        return (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onSelect}
                            className={cn(
                                "w-full h-10 transition-colors",
                                isActive
                                    ? "bg-slate-800 text-slate-100 hover:bg-slate-800"
                                    : "text-slate-300 hover:bg-slate-800/50 hover:text-slate-100"
                            )}
                        >
                            <MessageSquare className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-800 text-slate-100 border-slate-700">
                        <p>{chat.title}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Expanded mode - show full chat item with title and menu
    return (
        <div
            className="group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Button
                variant="ghost"
                onClick={onSelect}
                className={cn(
                    "w-full justify-start gap-3 px-3 py-2.5 text-sm font-normal transition-colors",
                    isActive
                        ? "bg-slate-800 text-slate-100 hover:bg-slate-800"
                        : "text-slate-300 hover:bg-slate-800/50 hover:text-slate-100"
                )}
            >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate text-left">{chat.title}</span>
            </Button>

            {/* Ellipsis Menu - Shows on hover */}
            {isHovered && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-48 bg-slate-800 border-slate-700 text-slate-100"
                        >
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRename();
                                }}
                                className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="cursor-pointer text-red-400 hover:bg-slate-700 focus:bg-slate-700 focus:text-red-400"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );
};
