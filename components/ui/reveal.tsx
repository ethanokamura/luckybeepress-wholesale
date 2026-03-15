"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal wrapper. Fades children up as they enter the viewport.
 * Uses Intersection Observer — no JS animation libs needed.
 *
 * Usage:
 *   <Reveal>   — single element fade-up
 *   <Reveal delay={200}> — with custom delay (ms)
 *
 * For staggered grids, use RevealGroup:
 *   <RevealGroup> wraps a grid, each direct child staggers automatically.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", className)}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * RevealGroup — staggers reveal of direct children.
 * Each child gets an incrementing --reveal-i CSS variable for stagger delay.
 */
export function RevealGroup({
  children,
  className,
  stagger = 60,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll(".reveal").forEach((child) => {
        child.classList.add("revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".reveal").forEach((child) => {
            child.classList.add("revealed");
          });
          observer.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -30px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Assign stagger index to each child via inline style
  const styledChildren = Array.isArray(children)
    ? children.map((child, i) => {
        if (child && typeof child === "object" && "props" in child) {
          return {
            ...child,
            props: {
              ...child.props,
              style: {
                ...(child.props.style || {}),
                "--reveal-i": i,
                transitionDelay: `${i * stagger}ms`,
              } as React.CSSProperties,
            },
          };
        }
        return child;
      })
    : children;

  return (
    <div ref={ref} className={cn("reveal-stagger", className)}>
      {styledChildren}
    </div>
  );
}
