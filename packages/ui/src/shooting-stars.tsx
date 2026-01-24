"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/utils";

interface ShootingStar {
    id: number;
    x: number;
    y: number;
    angle: number;
    scale: number;
    speed: number;
    distance: number;
}

interface ShootingStarsProps {
    minSpeed?: number;
    maxSpeed?: number;
    minDelay?: number;
    maxDelay?: number;
    starColor?: string;
    trailColor?: string;
    starWidth?: number;
    starHeight?: number;
    className?: string;
}

const getRandomStartPoint = () => {
    const side = Math.floor(Math.random() * 4);
    const offset = Math.random() * window.innerWidth;

    switch (side) {
        case 0:
            return { x: offset, y: 0, angle: 45 };
        case 1:
            return { x: window.innerWidth, y: offset, angle: 135 };
        case 2:
            return { x: offset, y: window.innerHeight, angle: 225 };
        case 3:
            return { x: 0, y: offset, angle: 315 };
        default:
            return { x: 0, y: 0, angle: 45 };
    }
};
export const ShootingStars: React.FC<ShootingStarsProps> = ({
    minSpeed = 10,
    maxSpeed = 30,
    minDelay = 1200,
    maxDelay = 4200,
    starColor = "#9E00FF",
    trailColor = "#2EB9DF",
    starWidth = 10,
    starHeight = 1,
    className,
}) => {
    const [star, setStar] = useState<ShootingStar | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const rectRef = useRef<SVGRectElement>(null);
    const timeoutRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    const prefersReducedMotion =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarsePointer =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: coarse)").matches;

    useEffect(() => {
        if (prefersReducedMotion) return;
        // On coarse pointer devices (phones), keep this effect ultra light.
        const effectiveMinDelay = isCoarsePointer ? Math.max(minDelay, 8000) : minDelay;
        const effectiveMaxDelay = isCoarsePointer ? Math.max(maxDelay, 14000) : maxDelay;
        const effectiveMinSpeed = isCoarsePointer ? Math.min(minSpeed, 14) : minSpeed;
        const effectiveMaxSpeed = isCoarsePointer ? Math.min(maxSpeed, 22) : maxSpeed;

        const createStar = () => {
            const { x, y, angle } = getRandomStartPoint();
            const newStar: ShootingStar = {
                id: Date.now(),
                x,
                y,
                angle,
                scale: 1,
                speed:
                    Math.random() * (effectiveMaxSpeed - effectiveMinSpeed) +
                    effectiveMinSpeed,
                distance: 0,
            };
            setStar(newStar);

            const randomDelay =
                Math.random() * (effectiveMaxDelay - effectiveMinDelay) + effectiveMinDelay;
            timeoutRef.current = window.setTimeout(createStar, randomDelay);
        };

        createStar();

        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [minSpeed, maxSpeed, minDelay, maxDelay, prefersReducedMotion, isCoarsePointer]);

    useEffect(() => {
        if (prefersReducedMotion) return;
        if (!star) return;

        let last = performance.now();
        const targetFps = isCoarsePointer ? 30 : 60;
        const minFrameMs = 1000 / targetFps;

        const tick = (now: number) => {
            if (!star) return;
            if (now - last < minFrameMs) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }
            last = now;

            const angleRad = (star.angle * Math.PI) / 180;
            const nextX = star.x + star.speed * Math.cos(angleRad);
            const nextY = star.y + star.speed * Math.sin(angleRad);
            const nextDistance = star.distance + star.speed;
            const nextScale = 1 + nextDistance / 100;

            const outOfBounds =
                nextX < -20 ||
                nextX > window.innerWidth + 20 ||
                nextY < -20 ||
                nextY > window.innerHeight + 20;

            if (outOfBounds) {
                setStar(null);
                return;
            }

            // Mutate the current star object in-place to avoid re-rendering per frame.
            star.x = nextX;
            star.y = nextY;
            star.distance = nextDistance;
            star.scale = nextScale;

            const rect = rectRef.current;
            if (rect) {
                rect.setAttribute("x", String(nextX));
                rect.setAttribute("y", String(nextY));
                rect.setAttribute("width", String(starWidth * nextScale));
                rect.setAttribute(
                    "transform",
                    `rotate(${star.angle}, ${nextX + (starWidth * nextScale) / 2}, ${nextY + starHeight / 2})`,
                );
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [star, starHeight, starWidth, prefersReducedMotion, isCoarsePointer]);

    return (
        <svg
            ref={svgRef}
            className={cn("w-full h-full absolute inset-0", className)}
        >
            {star && (
                <rect
                    ref={rectRef}
                    key={star.id}
                    x={star.x}
                    y={star.y}
                    width={starWidth * star.scale}
                    height={starHeight}
                    fill="url(#gradient)"
                    transform={`rotate(${star.angle}, ${star.x + (starWidth * star.scale) / 2
                        }, ${star.y + starHeight / 2})`}
                />
            )}
            <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: trailColor, stopOpacity: 0 }} />
                    <stop
                        offset="100%"
                        style={{ stopColor: starColor, stopOpacity: 1 }}
                    />
                </linearGradient>
            </defs>
        </svg>
    );
};
