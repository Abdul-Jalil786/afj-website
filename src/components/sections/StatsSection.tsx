"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";

interface Stat {
  number: number;
  suffix?: string;
  label: string;
}

interface StatsSectionProps {
  stats?: Stat[];
}

const defaultStats: Stat[] = [
  { number: 18, suffix: "+", label: "Years of Experience" },
  { number: 150, suffix: "+", label: "Vehicles in Fleet" },
  { number: 500, suffix: "+", label: "Trained Drivers" },
  { number: 1000000, suffix: "+", label: "Journeys Completed" },
];

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(0) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + "K";
  }
  return num.toString();
}

function AnimatedCounter({
  target,
  suffix,
  isVisible,
}: {
  target: number;
  suffix?: string;
  isVisible: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target, isVisible]);

  const displayValue =
    target >= 1000 ? formatNumber(count) : count.toString();

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
}

export function StatsSection({ stats = defaultStats }: StatsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-navy">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green mb-2">
                <AnimatedCounter
                  target={stat.number}
                  suffix={stat.suffix}
                  isVisible={isVisible}
                />
              </div>
              <div className="text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
