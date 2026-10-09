"use client"

import { useState, type FormEvent } from "react"
import {
  Bot,
  SendHorizonal,
  Sparkles,
  Loader2,
  ShieldAlert,
} from "lucide-react"
import { useStaffWorkspaceContext } from "../workspace-context"

const SUGGESTION_KEYS = [
  "aiSuggestArrivals",
  "aiSuggestReadyRooms",
  "aiSuggestCleaning",
  "aiSuggestMaintenance",
  "aiSuggestTasks",
  "aiSuggestShift",
] as const

export function AiSection() {
  const { t, aiMessages, aiQuery, setAiQuery, aiLoading, handleAiAsk } =
    useStaffWorkspaceContext()
  const [focused, setFocused] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    handleAiAsk(aiQuery)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#182333] dark:text-white">
          {t("staff", "aiTitle")}
        </h1>
        <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm mt-0.5">
          {t("staff", "aiSubtitle")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <section className="flex min-h-[420px] flex-col rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <header className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 px-5 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-white">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-[#182333] dark:text-white">
                {t("staff", "aiAssistantName")}
              </p>
              <p className="text-[11px] text-slate-400">
                {t("staff", "aiAssistantMode")}
              </p>
            </div>
          </header>

          <div
            className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
            aria-live="polite"
          >
            {aiMessages.map((message, index) => (
              <div
                key={`${message.time}-${index}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    message.role === "user"
                      ? "bg-[#2563EB] text-white rounded-br-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md"
                  }`}
                >
                  {message.text}
                  <span
                    className={`mt-1 block text-[10px] ${
                      message.role === "user"
                        ? "text-white/70"
                        : "text-slate-400"
                    }`}
                  >
                    {message.time}
                  </span>
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="flex justify-start">
                <span className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("staff", "aiThinking")}
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={submit}
            className="border-t border-slate-100 dark:border-slate-800 p-4"
          >
            <div
              className={`flex items-center gap-2 rounded-2xl border px-3 transition-colors ${
                focused
                  ? "border-[#2563EB]"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <input
                value={aiQuery}
                onChange={(event) => setAiQuery(event.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={t("staff", "aiInputPlaceholder")}
                aria-label={t("staff", "aiInputPlaceholder")}
                className="flex-1 bg-transparent py-3 text-xs outline-none"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuery.trim()}
                aria-label={t("staff", "aiSendLabel")}
                className="grid h-8 w-8 place-items-center rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50"
              >
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-400">
              <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
              {t("staff", "aiScopeNote")}
            </p>
          </form>
        </section>

        <aside className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {t("staff", "aiSuggestTitle")}
          </p>
          {SUGGESTION_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleAiAsk(t("staff", key))}
              className="flex w-full items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5 transition-colors"
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
              {t("staff", key)}
            </button>
          ))}
        </aside>
      </div>
    </div>
  )
}
