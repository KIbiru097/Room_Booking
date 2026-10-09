"use client" /* Thread List */ /* Thread Conversation Viewer & Reply */

import { Send, List } from "lucide-react"
import { useStaffWorkspaceContext } from "../workspace-context"

export function InboxSection() {
  const {
    t,
    contactThreads,
    activeThread,
    setActiveThread,
    threadReply,
    setThreadReply,
    threadSubmitting,
    handleSendThreadReply,
    handleResolveThread,
  } = useStaffWorkspaceContext()

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-[#182333] dark:text-white text-2xl mb-1">
            {t("staff", "inboxTitle")}
          </h1>
          <p className="text-[#64748B] dark:text-slate-400 text-xs sm:text-sm">
            {t("staff", "inboxSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {contactThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setActiveThread(thread)}
                className={`p-4 cursor-pointer transition-colors ${
                  activeThread?.id === thread.id
                    ? "bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-[#2563EB]"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-[#182333] dark:text-white truncate">
                    {thread.subject}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      thread.status === "OPEN"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {thread.status === "OPEN"
                      ? t("staff", "inboxThreadOpen")
                      : t("staff", "inboxThreadClosed")}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {thread.messages?.[thread.messages.length - 1]?.content ||
                    "Inquiry"}
                </div>
              </div>
            ))}
            {!contactThreads.length && (
              <div className="p-8 text-center text-xs text-slate-500">
                {t("staff", "inboxNoThreads")}
              </div>
            )}
          </div>

          {}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 shadow-xs flex flex-col h-[520px]">
            {activeThread ? (
              <>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-[#182333] dark:text-white">
                      {activeThread.subject}
                    </h3>
                    <div className="text-[11px] text-slate-500">
                      Status: {activeThread.status}
                    </div>
                  </div>
                  {activeThread.status === "OPEN" && (
                    <button
                      onClick={() => handleResolveThread(activeThread.id)}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100"
                    >
                      {t("staff", "inboxMarkResolved")}
                    </button>
                  )}
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {activeThread.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] rounded-2xl p-3 text-xs ${
                        msg.senderRole === "STAFF" ||
                        msg.senderRole === "MANAGER"
                          ? "ml-auto bg-[#2563EB] text-white rounded-br-xs"
                          : "mr-auto bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs"
                      }`}
                    >
                      <span className="font-semibold text-[10px] opacity-75 mb-0.5">
                        {msg.senderRole}
                      </span>
                      <span>{msg.content}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <input
                    value={threadReply}
                    onChange={(e) => setThreadReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        void handleSendThreadReply()
                      }
                    }}
                    placeholder={t("staff", "inboxTypeReplyPh")}
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                  <button
                    disabled={threadSubmitting || !threadReply.trim()}
                    onClick={() => void handleSendThreadReply()}
                    className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t("staff", "inboxSend")}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400 p-8 text-center">
                Select a conversation from the left to view guest messages and
                reply.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
