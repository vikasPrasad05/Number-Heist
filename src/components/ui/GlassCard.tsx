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
    const glowClass = glow !== 'none' ? `neon-glow-${glow}` : '';

    return (
        <motion.div
            className={`glass-card ${glowClass} ${className}`}
            onClick={onClick}
            whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {children}
        </motion.div>
    );
}
