"use client";

/**
 * Alert
 * Generalised from Personal-Portfolio/src/components/Alert.jsx.
 *
 * Bottom-right toast with success/danger variants and a slide+scale entrance.
 */
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type AlertProps = {
  type: "success" | "danger";
  text: string;
  open: boolean;
  className?: string;
};

const variants = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -50, scale: 0.8 },
};

export function Alert({ type, text, open, className }: AlertProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={cn(
            "fixed z-50 flex items-center justify-center bottom-5 right-5",
            className
          )}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div
            className={cn(
              "p-2 leading-none lg:rounded-full flex lg:inline-flex rounded-md p-5 text-indigo-100",
              type === "danger" ? "bg-red-800" : "bg-indigo-700"
            )}
          >
            <p
              className={cn(
                "flex rounded-full uppercase px-2 py-1 text-xs font-semibold mr-3",
                type === "danger" ? "bg-red-500" : "bg-indigo-400"
              )}
            >
              {type === "danger" ? "Failed" : "Success"}
            </p>
            <p className="mr-2 text-left">{text}</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
