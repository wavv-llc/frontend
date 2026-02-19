'use client';

import { useCallback } from 'react';

export const useRipple = () => {
    return useCallback((event: React.MouseEvent<HTMLElement>) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const rect = button.getBoundingClientRect();
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.className = 'pure-steel-ripple';

        const existingRipple = button.querySelector('.pure-steel-ripple');
        if (existingRipple) {
            existingRipple.remove();
        }

        button.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
    }, []);
};
