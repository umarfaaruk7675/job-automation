"use client";

import { m, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "ul" | "ol";
};

/** Fades its children in when scrolled into view. Pair with <RevealItem>. */
export function Reveal({ children, className, as = "div" }: Props) {
  const Tag = m[as];
  return (
    <Tag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
    >
      {children}
    </Tag>
  );
}

/** One staggered child of <Reveal>. */
export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "p" | "h2" | "article";
}) {
  const Tag = m[as];
  return (
    <Tag className={className} variants={item}>
      {children}
    </Tag>
  );
}
