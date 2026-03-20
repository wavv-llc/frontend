'use client';

import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from 'react';

export type ChatContextType =
    | 'general'
    | 'workspace'
    | 'project'
    | 'task'
    | 'tax-library';

export interface PageChatContext {
    type: ChatContextType;
    /** IDs passed to the backend when creating a conversation */
    workspaceId?: string;
    projectId?: string;
    taskId?: string;
    /** Human-readable label shown in the chat panel */
    label?: string;
}

interface ChatPanelState {
    /** Whether the floating chat panel is open */
    isOpen: boolean;
    /** The smart context derived from the current page */
    pageContext: PageChatContext;
    /** Open the chat panel */
    openChat: () => void;
    /** Close the chat panel */
    closeChat: () => void;
    /** Toggle open/close */
    toggleChat: () => void;
    /** Set the page context (called by each page on mount) */
    setPageContext: (ctx: PageChatContext) => void;
}

const ChatPanelCtx = createContext<ChatPanelState | null>(null);

export function ChatPanelProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [pageContext, setPageContextState] = useState<PageChatContext>({
        type: 'general',
    });

    const openChat = useCallback(() => setIsOpen(true), []);
    const closeChat = useCallback(() => setIsOpen(false), []);
    const toggleChat = useCallback(() => setIsOpen((v) => !v), []);
    const setPageContext = useCallback(
        (ctx: PageChatContext) => setPageContextState(ctx),
        [],
    );

    return (
        <ChatPanelCtx.Provider
            value={{
                isOpen,
                pageContext,
                openChat,
                closeChat,
                toggleChat,
                setPageContext,
            }}
        >
            {children}
        </ChatPanelCtx.Provider>
    );
}

export function useChatPanel(): ChatPanelState {
    const ctx = useContext(ChatPanelCtx);
    if (!ctx) {
        throw new Error('useChatPanel must be used within a ChatPanelProvider');
    }
    return ctx;
}
