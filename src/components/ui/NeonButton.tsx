'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface NeonButtonProps {
    children: ReactNode;
    onClick?: () => void;
    color?: 'blue' | 'green' | 'red' | 'purple';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit';
}

// Repurposed to minimalist premium styles instead of heavy neon
const colorMap = {
    blue: {
        bg: 'rgba(255, 255, 255, 0.03)',
        border: 'rgba(255, 255, 255, 0.1)',
        text: '#ffffff',
        hoverBg: 'rgba(255, 255, 255, 0.08)',
        hoverBorder: 'rgba(255, 255, 255, 0.3)',
        indicator: '#00d4ff', // subtle accent dot
    },
    green: {
        bg: 'rgba(0, 255, 136, 0.03)',
        border: 'rgba(0, 255, 136, 0.15)',
        text: '#ffffff',
        hoverBg: 'rgba(0, 255, 136, 0.08)',
        hoverBorder: 'rgba(0, 255, 136, 0.4)',
        indicator: '#00ff88',
    },
    red: {
        bg: 'rgba(255, 51, 102, 0.03)',
        border: 'rgba(255, 51, 102, 0.15)',
        text: '#ffffff',
        hoverBg: 'rgba(255, 51, 102, 0.08)',
        hoverBorder: 'rgba(255, 51, 102, 0.4)',
        indicator: '#ff3366',
    },
    purple: {
        bg: 'rgba(180, 77, 255, 0.03)',
        border: 'rgba(180, 77, 255, 0.15)',
        text: '#ffffff',
        hoverBg: 'rgba(180, 77, 255, 0.08)',
        hoverBorder: 'rgba(180, 77, 255, 0.4)',
        indicator: '#b44dff',
    },
};

const sizeMap = {
    sm: 'px-4 py-2 text-xs tracking-widest',
    md: 'px-6 py-3 text-sm tracking-[0.15em]',
    lg: 'px-8 py-4 text-sm tracking-[0.2em]',
};

export default function NeonButton({
    children,
    onClick,
    color = 'blue',
    size = 'md',
    disabled = false,
    className = '',
    type = 'button',
}: NeonButtonProps) {
    const c = colorMap[color];

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                ${sizeMap[size]}
                relative font-medium rounded-lg uppercase
                overflow-hidden transition-all duration-300
                disabled:opacity-30 disabled:cursor-not-allowed
                ${className}
            `}
            style={{
                fontFamily: "'Inter', sans-serif",
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text,
            }}
            whileHover={
                !disabled
                    ? {
                        background: c.hoverBg,
                        borderColor: c.hoverBorder,
                        scale: 1.02,
                    }
                    : undefined
            }
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <span className="flex items-center justify-center gap-2">
                {color !== 'blue' && (
                    <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: c.indicator }}
                    />
                )}
                {children}
            </span>
        </motion.button>
    );
}
