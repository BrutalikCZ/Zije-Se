"use client";

import React from "react";

interface ScrollLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    targetId: string;
}

export default function ScrollLink({ href, targetId, children, className, ...props }: ScrollLinkProps) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (!target) return;

        const lenis = (window as any).lenisInstance;
        if (lenis) {
            lenis.scrollTo(target, {
                offset: -120, // Výškové offset odsazení hlavičky (zabraňuje skrytí obsahu pod navigací)
                duration: 2.0, // Dlouhý plynulý přejezd
                easing: (t: number) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2) // EaseInOutQuint
            });
        } else {
            // Bezpečný fallback v případě, že by lenis nebyl inicializován
            window.scrollTo({
                top: target.getBoundingClientRect().top + window.pageYOffset - 120,
                behavior: 'smooth'
            });
        }
    };

    return (
        <a href={href} onClick={handleClick} className={className} {...props}>
            {children}
        </a>
    );
}
