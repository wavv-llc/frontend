'use client';

import { useEffect, useMemo } from 'react';
import {
    useChatPanel,
    type PageChatContext,
} from '@/contexts/ChatPanelContext';

/**
 * Hook for pages to set their chat context. When the component unmounts,
 * the context reverts to 'general'.
 */
export function usePageChatContext(context: PageChatContext) {
    const { setPageContext } = useChatPanel();

    const stableContext = useMemo(
        () => context,
        [
            context.type,
            context.workspaceId,
            context.projectId,
            context.taskId,
            context.label,
        ],
    );

    useEffect(() => {
        setPageContext(stableContext);
        return () => {
            setPageContext({ type: 'general' });
        };
    }, [stableContext, setPageContext]);
}
