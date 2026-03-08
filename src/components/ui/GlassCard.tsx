'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    glow?: 'blue' | 'green' | 'red' | 'purple' | 'none';
    hover?: boolean;
}

export default function GlassCard({
    children,
    className = '',
    onClick,
    glow = 'none',
    hover = true,
}: GlassCardProps) {
    // Keep neon-glow- class name for legacy props, but it looks subtle now per globals.css
    const glowClass = glow !== 'none' ? `neon-glow-${glow}` : '';

    return (
        <motion.div
            className={`glass-card ${glowClass} ${className}`}
            onClick={onClick}
            whileHover={hover ? { scale: 1.01, y: -4 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {children}
        </motion.div>
    );
}
