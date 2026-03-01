"use client";

import React, { useRef } from "react";
import {
    motion,
    useInView,
    useScroll,
    useTransform,
    type MotionProps,
} from "framer-motion";

/* ─── Shared types ─── */
interface AnimationWrapperProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    once?: boolean;
    amount?: number;
}

/* ─── DrawSVG ─── */
export function DrawSVG({
    children,
    className,
    delay = 0,
    duration = 1.0,
    once = true,
    amount = 0.5,
    viewBox = "0 0 200 9",
    fill = "none"
}: AnimationWrapperProps & { viewBox?: string, fill?: string }) {
    const ref = useRef<SVGSVGElement>(null);
    const isInView = useInView(ref, { once, amount });

    return (
        <motion.svg
            ref={ref}
            className={className}
            viewBox={viewBox}
            fill={fill}
            xmlns="http://www.w3.org/2000/svg"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.type === "path") {
                    return (
                        <motion.path
                            {...(child.props as any)}
                            variants={{
                                hidden: { pathLength: 0, opacity: 0 },
                                visible: {
                                    pathLength: 1,
                                    opacity: 1,
                                    transition: {
                                        pathLength: { duration, delay, ease: [0.25, 0.46, 0.45, 0.94] },
                                        opacity: { duration: 0.1, delay }
                                    }
                                }
                            }}
                        />
                    );
                }
                return child;
            })}
        </motion.svg>
    );
}

/* ─── FadeInUp ─── */
export function FadeInUp({
    children,
    className,
    delay = 0,
    duration = 0.7,
    once = true,
    amount = 0.3,
}: AnimationWrapperProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {children}
        </motion.div>
    );
}

/* ─── FadeInLeft ─── */
export function FadeInLeft({
    children,
    className,
    delay = 0,
    duration = 0.7,
    once = true,
    amount = 0.3,
}: AnimationWrapperProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, x: -60 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
            transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {children}
        </motion.div>
    );
}

/* ─── FadeInRight ─── */
export function FadeInRight({
    children,
    className,
    delay = 0,
    duration = 0.7,
    once = true,
    amount = 0.3,
}: AnimationWrapperProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, x: 60 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
            transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {children}
        </motion.div>
    );
}

/* ─── ScaleIn ─── */
export function ScaleIn({
    children,
    className,
    delay = 0,
    duration = 0.7,
    once = true,
    amount = 0.3,
}: AnimationWrapperProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={
                isInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.85 }
            }
            transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            {children}
        </motion.div>
    );
}

/* ─── StaggerChildren ─── */
interface StaggerChildrenProps {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
    once?: boolean;
    amount?: number;
}

export function StaggerChildren({
    children,
    className,
    staggerDelay = 0.15,
    once = true,
    amount = 0.2,
}: StaggerChildrenProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, amount });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
        >
            {children}
        </motion.div>
    );
}

/* ─── StaggerItem (must be direct child of StaggerChildren) ─── */
interface StaggerItemProps {
    children: React.ReactNode;
    className?: string;
    direction?: "up" | "left" | "right";
}

export function StaggerItem({
    children,
    className,
    direction = "up",
}: StaggerItemProps) {
    const offset =
        direction === "up"
            ? { y: 40, x: 0 }
            : direction === "left"
                ? { x: -50, y: 0 }
                : { x: 50, y: 0 };

    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, ...offset },
                visible: {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
                },
            }}
        >
            {children}
        </motion.div>
    );
}

/* ─── ParallaxSection ─── */
interface ParallaxProps {
    children: React.ReactNode;
    className?: string;
    speed?: number; // negative = slower, positive = faster relative to scroll
    style?: React.CSSProperties;
}

export function ParallaxSection({
    children,
    className,
    speed = -0.15,
    style,
}: ParallaxProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [speed * 200, -speed * 200]);

    return (
        <motion.div ref={ref} className={className} style={{ ...style, y }}>
            {children}
        </motion.div>
    );
}
