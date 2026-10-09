"use client"

// Keyboard navigation: Escape key closes modal
/* Backdrop */ /* Modal Dialog Card */

import * as React from "react"
import { X } from "lucide-react"
import { useLanguage } from "@/lib/i18n"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  showCloseButton = true,
}: ModalProps) {
  const { t } = useLanguage()
  const modalRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const widthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {}
      <div
        className="fixed inset-0 bg-[#07111f]/65 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {}
      <div
        ref={modalRef}
        className={`relative w-full ${widthStyles} rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/80 z-10 transition-all duration-200 my-8`}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label={t("common", "closeModal")}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4bd55]"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {title && (
          <div className="mb-4 pr-6">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0b1528]">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  )
}
