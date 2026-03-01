"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Inicializace prémiového "momentum" scroll enginu
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Uložení Lenis instance globálně
        (window as any).lenisInstance = lenis;

        // Vypnutí CSS smooth-scrollingu k zamezení konfliktů
        document.documentElement.style.scrollBehavior = 'auto';

        return () => {
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}
