import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/axios"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"
import { authService } from "@/services/auth.service"
import {
  useForgotPasswordMutation,
  useGoogleLoginMutation,
  useLoginMutation,
  useLogoutMutation,
  useProfileQuery,
  useRegisterMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
  useUploadProfilePhotoMutation,
  useVerifyMfaMutation,
} from "@/hooks/use-auth"

jest.mock("@/services/auth.service", () => ({
  authService: {
    login: jest.fn(),
    verifyMfa: jest.fn(),
    register: jest.fn(),
    googleLogin: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    uploadProfilePhoto: jest.fn(),
  },
}))

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

const asMock = (fn: unknown): jest.Mock => fn as jest.Mock

const customer: User = {
  id: "user-1",
  email: "guest@example.com",
  fullName: "Guest User",
  role: "CUSTOMER",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const session = {
  user: customer,
  accessToken: "access-1",
  refreshToken: "refresh-1",
}

let client: QueryClient
let push: jest.Mock
let invalidateSpy: jest.SpyInstance

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  push = jest.fn()
  asMock(useRouter).mockReturnValue({ push })
  jest.clearAllMocks()
  invalidateSpy = jest.spyOn(client, "invalidateQueries")
  window.localStorage.clear()
  useAuth.setState({
    user: null,
    tokens: null,
    loading: false,
    isInitialized: false,
    isAdmin: false,
    isManager: false,
    isStaff: false,
    isCustomer: false,
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("useLoginMutation", () => {
  it("creates a session for a normal login", async () => {
    asMock(authService.login).mockResolvedValue(session)

    const { result } = renderHook(() => useLoginMutation(), { wrapper })
    result.current.mutate({ email: "guest@example.com", password: "secret1" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.login).toHaveBeenCalledWith({
      email: "guest@example.com",
      password: "secret1",
    })
    expect(useAuth.getState().user).toEqual(customer)
    expect(useAuth.getState().tokens).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["profile"] })
    expect(window.localStorage.getItem("yayetech.session")).toContain(
      "access-1",
    )
  })

  it("leaves the store untouched for an MFA challenge", async () => {
    asMock(authService.login).mockResolvedValue({
      mfaRequired: true,
      challengeToken: "challenge-1",
    })

    const { result } = renderHook(() => useLoginMutation(), { wrapper })
    result.current.mutate({ email: "guest@example.com", password: "secret1" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuth.getState().user).toBeNull()
    expect(useAuth.getState().tokens).toBeNull()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })

  it("surfaces a rejected login", async () => {
    asMock(authService.login).mockRejectedValue(new Error("Bad credentials"))

    const { result } = renderHook(() => useLoginMutation(), { wrapper })
    result.current.mutate({ email: "guest@example.com", password: "wrong" })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(new Error("Bad credentials"))
    expect(useAuth.getState().user).toBeNull()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

describe("useVerifyMfaMutation", () => {
  it("stores the session after a successful challenge", async () => {
    asMock(authService.verifyMfa).mockResolvedValue(session)

    const { result } = renderHook(() => useVerifyMfaMutation(), { wrapper })
    result.current.mutate({ challengeToken: "challenge-1", code: "123456" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.verifyMfa).toHaveBeenCalledWith({
      challengeToken: "challenge-1",
      code: "123456",
    })
    expect(useAuth.getState().user).toEqual(customer)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["profile"] })
  })
})

describe("useRegisterMutation", () => {
  it("stores the session when registration returns tokens", async () => {
    asMock(authService.register).mockResolvedValue(session)

    const { result } = renderHook(() => useRegisterMutation(), { wrapper })
    result.current.mutate({
      email: "new@example.com",
      password: "secret1",
      fullName: "New User",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.register).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "secret1",
      fullName: "New User",
    })
    expect(useAuth.getState().user).toEqual(customer)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["profile"] })
  })

  it("does not create a session when no tokens are returned", async () => {
    asMock(authService.register).mockResolvedValue({
      message: "verify your email",
    })

    const { result } = renderHook(() => useRegisterMutation(), { wrapper })
    result.current.mutate({
      email: "new@example.com",
      password: "secret1",
      fullName: "New User",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuth.getState().user).toBeNull()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

describe("useGoogleLoginMutation", () => {
  it("stores the session when the exchange succeeds", async () => {
    asMock(authService.googleLogin).mockResolvedValue(session)

    const { result } = renderHook(() => useGoogleLoginMutation(), { wrapper })
    result.current.mutate({
      credential: "id-token",
      email: "guest@example.com",
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.googleLogin).toHaveBeenCalledWith({
      credential: "id-token",
      email: "guest@example.com",
    })
    expect(useAuth.getState().user).toEqual(customer)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["profile"] })
  })

  it("skips session creation when no tokens come back", async () => {
    asMock(authService.googleLogin).mockResolvedValue({
      message: "complete your profile",
    })

    const { result } = renderHook(() => useGoogleLoginMutation(), { wrapper })
    result.current.mutate({ credential: "id-token" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuth.getState().user).toBeNull()
    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})

describe("useForgotPasswordMutation", () => {
  it("forwards the request to the auth service", async () => {
    asMock(authService.forgotPassword).mockResolvedValue({ message: "sent" })

    const { result } = renderHook(() => useForgotPasswordMutation(), {
      wrapper,
    })
    result.current.mutate({ email: "guest@example.com" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.forgotPassword).toHaveBeenCalledWith({
      email: "guest@example.com",
    })
    expect(result.current.data).toEqual({ message: "sent" })
  })
})

describe("useResetPasswordMutation", () => {
  it("forwards the reset payload", async () => {
    asMock(authService.resetPassword).mockResolvedValue({ message: "reset" })

    const { result } = renderHook(() => useResetPasswordMutation(), { wrapper })
    result.current.mutate({ token: "reset-1", password: "secret2" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.resetPassword).toHaveBeenCalledWith({
      token: "reset-1",
      password: "secret2",
    })
  })
})

describe("useLogoutMutation", () => {
  it("clears the session, the cache and navigates home", async () => {
    asMock(authService.logout).mockResolvedValue(undefined)
    const postSpy = jest
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: {} } as never)
    const clearSpy = jest.spyOn(client, "clear")
    useAuth.setState({
      user: customer,
      tokens: { accessToken: "a", refreshToken: "r" },
    })

    const { result } = renderHook(() => useLogoutMutation(), { wrapper })
    result.current.mutate(undefined)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(postSpy).toHaveBeenCalledWith("/auth/logout")
    expect(clearSpy).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith("/")
    expect(useAuth.getState().user).toBeNull()
    expect(useAuth.getState().tokens).toBeNull()
    expect(window.localStorage.getItem("yayetech.session")).toBeNull()
  })

  it("finishes the logout flow even when the API call fails", async () => {
    asMock(authService.logout).mockRejectedValue(new Error("network down"))
    const clearSpy = jest.spyOn(client, "clear")

    const { result } = renderHook(() => useLogoutMutation(), { wrapper })
    result.current.mutate(undefined)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(clearSpy).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith("/")
  })
})

describe("useProfileQuery", () => {
  it("stays idle without a signed in user", async () => {
    const { result } = renderHook(() => useProfileQuery(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(authService.getProfile).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })

  it("fetches the profile and writes it back to the store", async () => {
    asMock(authService.getProfile).mockResolvedValue(customer)
    useAuth.setState({ user: customer })

    const { result } = renderHook(() => useProfileQuery(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.getProfile).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(customer)
    expect(useAuth.getState().user).toEqual(customer)
    expect(client.getQueryData(["profile", "user-1"])).toEqual(customer)
  })

  it("caches separately per user id", async () => {
    asMock(authService.getProfile).mockResolvedValue(customer)
    useAuth.setState({ user: customer })

    renderHook(() => useProfileQuery(), { wrapper })

    await waitFor(() =>
      expect(client.getQueryData(["profile", "user-1"])).toEqual(customer),
    )
    expect(
      client.getQueryCache().find({ queryKey: ["profile", "user-1"] }),
    ).toBeDefined()
    expect(
      client.getQueryCache().find({ queryKey: ["profile", "someone-else"] }),
    ).toBeUndefined()
  })
})

describe("useUpdateProfileMutation", () => {
  it("updates the store and the profile cache", async () => {
    const updated = { ...customer, fullName: "Renamed Guest" }
    asMock(authService.updateProfile).mockResolvedValue(updated)

    const { result } = renderHook(() => useUpdateProfileMutation(), { wrapper })
    result.current.mutate({ fullName: "Renamed Guest" })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.updateProfile).toHaveBeenCalledWith({
      fullName: "Renamed Guest",
    })
    expect(useAuth.getState().user).toEqual(updated)
    expect(client.getQueryData(["profile", "user-1"])).toEqual(updated)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["profile"] })
  })
})

describe("useUploadProfilePhotoMutation", () => {
  it("uploads the file and stores the refreshed user", async () => {
    const file = new File(["img"], "avatar.png", { type: "image/png" })
    const updated = { ...customer, profilePhotoUrl: "https://cdn/avatar.png" }
    asMock(authService.uploadProfilePhoto).mockResolvedValue(updated)

    const { result } = renderHook(() => useUploadProfilePhotoMutation(), {
      wrapper,
    })
    result.current.mutate(file)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(authService.uploadProfilePhoto).toHaveBeenCalledWith(file)
    expect(useAuth.getState().user).toEqual(updated)
    expect(client.getQueryData(["profile", "user-1"])).toEqual(updated)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["profile"] })
  })
})
