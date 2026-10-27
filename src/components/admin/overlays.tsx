"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import { Btn } from "./ui";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/components/useFocusTrap";

export function Drawer({ open, onClose, title, description, children, footer, width = "max-w-2xl" }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode; width?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // Initial focus: first focusable (the header Close button), as before.
  useFocusTrap(open, ref, { onClose });
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex justify-end bg-zinc-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}>
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn("flex h-full w-full flex-col bg-white shadow-2xl", width)}
          >
            <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4">
              <div>
                <h2 className="text-[16px] font-semibold text-zinc-900">{title}</h2>
                {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <footer className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-3">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", tone = "danger", loading, onConfirm, onCancel }: { open: boolean; title: string; body?: string; confirmLabel?: string; tone?: "danger" | "primary"; loading?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref, { onClose: onCancel });
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] flex items-center justify-center bg-zinc-900/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onCancel}>
          <motion.div
            ref={ref}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <h2 id="confirm-title" className="text-[16px] font-semibold text-zinc-900">{title}</h2>
            {body && <p className="mt-2 text-[14px] text-zinc-600">{body}</p>}
            <div className="mt-5 flex justify-end gap-2">
              {/* Destructive dialogs focus Cancel, so a stray Enter can't delete. data-autofocus (not autoFocus):
                  autoFocus moves focus before the trap records the opener, which breaks focus restore. */}
              <Btn variant="ghost" onClick={onCancel} disabled={loading} data-autofocus={tone === "danger" || undefined}>Cancel</Btn>
              <Btn variant={tone} onClick={onConfirm} loading={loading} data-autofocus={tone !== "danger" || undefined}>{confirmLabel}</Btn>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
