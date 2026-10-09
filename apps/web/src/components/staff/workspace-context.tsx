"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { StaffWorkspace } from "./use-staff-workspace"

const StaffWorkspaceContext = createContext<StaffWorkspace | null>(null)

export function StaffWorkspaceProvider({
  workspace,
  children,
}: {
  workspace: StaffWorkspace
  children: ReactNode
}) {
  return (
    <StaffWorkspaceContext.Provider value={workspace}>
      {children}
    </StaffWorkspaceContext.Provider>
  )
}

export function useStaffWorkspaceContext(): StaffWorkspace {
  const value = useContext(StaffWorkspaceContext)
  if (!value) {
    throw new Error(
      "useStaffWorkspaceContext must be used inside <StaffWorkspaceProvider>",
    )
  }
  return value
}

export type { StaffWorkspace }
