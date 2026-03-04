/**
 * Centralized Color System for Wavv
 *
 * This file contains all color definitions used throughout the application.
 * Colors are defined as hex values and can be used directly in components
 * or referenced via CSS variables.
 */

export const colors = {
    // Steel Grayscale - Primary Color Palette
    steel: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#0b1120',
    },

    // Alternative Steel palette (used in chat page)
    steelAlt: {
        50: '#f8f9fa',
        100: '#eef0f3',
        200: '#dce1e8',
        300: '#b8c1ce',
        400: '#8d9ab0',
        500: '#6b7a94',
        600: '#4e5d74',
        700: '#3a4557',
        800: '#272f3b',
        900: '#181d25',
        950: '#0e1117',
    },

    // Dashboard Colors
    dashboard: {
        bg: '#f5f5f3',
        surface: '#ffffff',
        border: '#e2e2df',
        borderLight: '#ededeb',
        textPrimary: '#2e3b44',
        textBody: '#3d4a52',
        textMuted: '#8c969e',
        textFaint: '#b8c0c6',
    },

    // Accent Colors (Steel Blue)
    accent: {
        primary: '#5a7f9a',
        light: '#7ba3bf',
        subtle: 'rgba(90, 127, 154, 0.07)',
        hover: 'rgba(90, 127, 154, 0.05)',
        rowHover: 'rgba(90, 127, 154, 0.025)',
    },

    // Status Colors
    status: {
        review: '#b5880a',
        reviewBg: 'rgba(181, 136, 10, 0.08)',
        pending: '#8494a4',
        pendingBg: 'rgba(132, 148, 164, 0.08)',
        inProgress: '#5e8ead',
        inProgressBg: 'rgba(94, 142, 173, 0.08)',
        complete: '#3b9b72',
        completeBg: 'rgba(59, 155, 114, 0.08)',
        urgent: '#e05252',
        urgentBg: 'rgba(224, 82, 82, 0.08)',
        urgentText: '#c53030',
    },

    // Event Type Colors (for Calendar)
    eventType: {
        deadline: {
            bg: 'rgba(224, 82, 82, 0.07)',
            text: '#E05252',
        },
        task: {
            bg: 'rgba(94, 142, 173, 0.07)',
            text: '#5E8EAD',
        },
        meeting: {
            bg: 'rgba(181, 136, 10, 0.07)',
            text: '#B5880A',
        },
        internal: {
            bg: 'rgba(132, 148, 164, 0.07)',
            text: '#8494A4',
        },
    },

    // Utility Colors
    destructive: '#dc2626',
    scrollbarThumb: '#d0d0cd',
    white: '#ffffff',
    black: '#000000',
} as const;

/**
 * Helper function to get a color value by path
 * Example: getColor('steel.500') returns '#64748b'
 */
export function getColor(path: string): string {
    const keys = path.split('.');
    let value: any = colors;

    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            console.warn(`Color path "${path}" not found`);
            return '#000000';
        }
    }

    return typeof value === 'string' ? value : '#000000';
}

/**
 * Type-safe color accessor
 */
export type ColorPath =
    | `steel.${keyof typeof colors.steel}`
    | `steelAlt.${keyof typeof colors.steelAlt}`
    | `dashboard.${keyof typeof colors.dashboard}`
    | `accent.${keyof typeof colors.accent}`
    | `status.${keyof typeof colors.status}`
    | 'destructive'
    | 'scrollbarThumb'
    | 'white'
    | 'black';
