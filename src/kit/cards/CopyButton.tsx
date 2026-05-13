"use client";

/**
 * CopyButton
 * Generalised from Personal-Portfolio/src/components/CopyEmailButton.jsx.
 *
 * Pill button that copies a string to the clipboard and morphs its label
 * with framer-motion's `AnimatePresence`.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type CopyButtonProps = {
  value: string;
  idleLabel?: string;
  copiedLabel?: string;
  iconIdle?: string;
  iconCopied?: string;
  className?: string;
};

export function CopyButton({
  value,
  idleLabel = "Copy",
  copiedLabel = "Copied!",
  iconIdle,
  iconCopied,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <motion.button
      onClick={onCopy}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 1.05 }}
      className={cn(
        "relative px-1 py-4 text-sm text-center rounded-full font-extralight bg-blaze-surface w-[12rem] cursor-pointer overflow-hidden",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.p
            key="copied"
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.1 }}
          >
            {iconCopied ? <img src={iconCopied} alt="" className="w-5" /> : null}
            {copiedLabel}
          </motion.p>
        ) : (
          <motion.p
            key="idle"
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {iconIdle ? <img src={iconIdle} alt="" className="w-5" /> : null}
            {idleLabel}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
