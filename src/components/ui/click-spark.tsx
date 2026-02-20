"use client";

import { useRef, useEffect, useCallback } from 'react';

interface ClickSparkProps {
    sparkColor?: string;
    sparkSize?: number;
    sparkRadius?: number;
    sparkCount?: number;
    duration?: number;
    easing?: 'linear' | 'ease-in' | 'ease-in-out' | 'ease-out';
    extraScale?: number;
    children: React.ReactNode;
}

interface Spark {
    x: number;
    y: number;
    angle: number;
    startTime: number;
    color: string;
}

const ClickSpark = ({
    sparkColor = '#fff',
    sparkSize = 10,
    sparkRadius = 15,
    sparkCount = 8,
    duration = 400,
    easing = 'ease-out',
    extraScale = 1.0,
    children
}: ClickSparkProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sparksRef = useRef<Spark[]>([]);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        let resizeTimeout: NodeJS.Timeout;

        const resizeCanvas = () => {
            const { width, height } = parent.getBoundingClientRect();
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
        };

        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 100);
        };

        const ro = new ResizeObserver(handleResize);
        ro.observe(parent);

        resizeCanvas();

        return () => {
            ro.disconnect();
            clearTimeout(resizeTimeout);
        };
    }, []);

    const easeFunc = useCallback(
        (t: number) => {
            switch (easing) {
                case 'linear':
                    return t;
                case 'ease-in':
                    return t * t;
                case 'ease-in-out':
                    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                default:
                    return t * (2 - t);
            }
        },
        [easing]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const draw = (timestamp: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            sparksRef.current = sparksRef.current.filter((spark: Spark) => {
                const elapsed = timestamp - spark.startTime;
                if (elapsed >= duration) {
                    return false;
                }

                const progress = elapsed / duration;
                const eased = easeFunc(progress);

                const distance = eased * sparkRadius * extraScale;
                const lineLength = sparkSize * (1 - eased);

                const x1 = spark.x + distance * Math.cos(spark.angle);
                const y1 = spark.y + distance * Math.sin(spark.angle);
                const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
                const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

                ctx.strokeStyle = spark.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();

                return true;
            });

            animationId = requestAnimationFrame(draw);
        };

        animationId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easeFunc, extraScale]);

    const getContrastingColor = (element: Element): string => {
        let el: Element | null = element;

        while (el) {
            const style = window.getComputedStyle(el);
            const bgColor = style.backgroundColor;

            // Check for transparency (rgba with alpha 0 or transparent keyword)
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                const rgbValues = bgColor.match(/\d+/g);
                if (rgbValues && rgbValues.length >= 3) {
                    const r = parseInt(rgbValues[0], 10);
                    const g = parseInt(rgbValues[1], 10);
                    const b = parseInt(rgbValues[2], 10);
                    const a = rgbValues.length >= 4 ? parseFloat(rgbValues[3]) : 1;

                    // If fully transparent, keep searching
                    if (a === 0) {
                        el = el.parentElement;
                        continue;
                    }

                    // Calculate perceived brightness (YIQ)
                    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                    return yiq >= 128 ? '#000' : '#fff';
                }
            }

            el = el.parentElement;
        }

        return sparkColor; // Fallback to prop color if no solid background found
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const now = performance.now();
        const color = getContrastingColor(e.target as Element);

        const newSparks: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
            x,
            y,
            angle: (2 * Math.PI * i) / sparkCount,
            startTime: now,
            color
        }));

        sparksRef.current.push(...newSparks);
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: '100vh',
            }}
            onClick={handleClick}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    userSelect: 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    zIndex: 9999, /* Ensure sparks are visible on top of other elements if needed, but pointerEvents none ensures click-through works for canvas itself */
                }}
            />
            {children}
        </div>
    );
};

export default ClickSpark;
