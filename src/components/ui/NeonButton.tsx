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

const colorMap = {
    blue: {
        bg: 'rgba(0, 212, 255, 0.1)',
        border: 'rgba(0, 212, 255, 0.5)',
        text: '#00d4ff',
        hoverBg: 'rgba(0, 212, 255, 0.2)',
        shadow: '0 0 20px rgba(0, 212, 255, 0.3)',
    },
    green: {
        bg: 'rgba(0, 255, 136, 0.1)',
        border: 'rgba(0, 255, 136, 0.5)',
        text: '#00ff88',
        hoverBg: 'rgba(0, 255, 136, 0.2)',
        shadow: '0 0 20px rgba(0, 255, 136, 0.3)',
    },
    red: {
        bg: 'rgba(255, 51, 102, 0.1)',
        border: 'rgba(255, 51, 102, 0.5)',
        text: '#ff3366',
        hoverBg: 'rgba(255, 51, 102, 0.2)',
        shadow: '0 0 20px rgba(255, 51, 102, 0.3)',
    },
    purple: {
        bg: 'rgba(180, 77, 255, 0.1)',
        border: 'rgba(180, 77, 255, 0.5)',
        text: '#b44dff',
        hoverBg: 'rgba(180, 77, 255, 0.2)',
        shadow: '0 0 20px rgba(180, 77, 255, 0.3)',
    },
};

const sizeMap = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
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
        font-semibold rounded-xl
        font-[family-name:var(--font-orbitron)]
        transition-all duration-300
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
            style={{
                fontFamily: "'Orbitron', sans-serif",
                background: c.bg,
                border: `1px solid ${c.border}`,
                color: c.text,
            }}
            whileHover={
                !disabled
                    ? {
                        background: c.hoverBg,
                        boxShadow: c.shadow,
                        scale: 1.05,
                    }
                    : undefined
            }
            whileTap={!disabled ? { scale: 0.95 } : undefined}
        >
            {children}
        </motion.button>
    );
}
