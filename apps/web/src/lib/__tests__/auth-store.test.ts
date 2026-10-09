import { apiClient, ApiError } from "@/lib/axios"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"

const STORAGE_KEY = "yayetech.session"
const LEGACY_STORAGE_KEY = "luxstay.session"

function buildUser(role: User["role"]): User {
  return {
    id: "user-1",
    email: "guest@example.com",
    fullName: "Guest User",
    role,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  }
}

function session(role: User["role"] = "CUSTOMER") {
  return {
    user: buildUser(role),
    accessToken: "access-token",
    refreshToken: "refresh-token",
  }
}

const initialState = {
  user: null,
  tokens: null,
  loading: false,
  isInitialized: false,
  isAdmin: false,
  isManager: false,
  isStaff: false,
  isCustomer: false,
}

let postSpy: jest.SpyInstance

describe("useAuth store", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth.setState(initialState)
    postSpy = jest
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: session() } as never)
  })

  afterEach(() => {
    postSpy.mockRestore()
  })

  describe("setSession", () => {
    it("derives role flags and persists the session", () => {
      useAuth.getState().setSession(session("MANAGER"))

      const state = useAuth.getState()
      expect(state.isManager).toBe(true)
      expect(state.isAdmin).toBe(false)
      expect(state.isCustomer).toBe(false)
      expect(state.isInitialized).toBe(true)
      expect(state.tokens).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string)
      expect(stored.user.role).toBe("MANAGER")
    })

    it.each([
      ["ADMIN", "isAdmin"],
      ["STAFF", "isStaff"],
      ["CUSTOMER", "isCustomer"],
    ] as const)("flags a %s session", (role, flag) => {
      useAuth.getState().setSession(session(role))
      expect(useAuth.getState()[flag]).toBe(true)
    })
  })

  describe("loadFromStorage", () => {
    it("restores a valid stored session", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session("ADMIN")))

      useAuth.getState().loadFromStorage()

      const state = useAuth.getState()
      expect(state.user?.email).toBe("guest@example.com")
      expect(state.isAdmin).toBe(true)
      expect(state.tokens?.accessToken).toBe("access-token")
      expect(state.isInitialized).toBe(true)
    })

    it("falls back to the legacy storage key", () => {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(session("STAFF")))

      useAuth.getState().loadFromStorage()

      expect(useAuth.getState().isStaff).toBe(true)
    })

    it("clears the session when the stored role is not allowed", () => {
      const invalid = {
        ...session(),
        user: { ...buildUser("CUSTOMER"), role: "SUPER_ADMIN" },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid))

      useAuth.getState().loadFromStorage()

      const state = useAuth.getState()
      expect(state.user).toBeNull()
      expect(state.isInitialized).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it("ignores corrupt JSON", () => {
      localStorage.setItem(STORAGE_KEY, "{not-json")

      useAuth.getState().loadFromStorage()

      expect(useAuth.getState().user).toBeNull()
      expect(useAuth.getState().isInitialized).toBe(true)
    })

    it("marks initialized when nothing is stored", () => {
      useAuth.getState().loadFromStorage()

      expect(useAuth.getState().isInitialized).toBe(true)
      expect(useAuth.getState().user).toBeNull()
    })
  })

  describe("login", () => {
    it("stores a successful customer session", async () => {
      const result = await useAuth
        .getState()
        .login("guest@example.com", "secret")

      expect(postSpy).toHaveBeenCalledWith("/auth/login", {
        email: "guest@example.com",
        password: "secret",
      })
      expect(result.user.role).toBe("CUSTOMER")

      const state = useAuth.getState()
      expect(state.isCustomer).toBe(true)
      expect(state.loading).toBe(false)
      expect(
        JSON.parse(localStorage.getItem(STORAGE_KEY) as string).accessToken,
      ).toBe("access-token")
    })

    it("rejects roles outside the web portal", async () => {
      postSpy.mockResolvedValue({
        data: session("OWNER" as User["role"]),
      } as never)

      await expect(
        useAuth.getState().login("owner@example.com", "secret"),
      ).rejects.toMatchObject({
        name: "ApiError",
        status: 403,
        code: "FORBIDDEN",
      })
      expect(useAuth.getState().user).toBeNull()
      expect(useAuth.getState().loading).toBe(false)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it("does not create a session when MFA is required", async () => {
      postSpy.mockResolvedValue({
        data: { ...session("ADMIN"), mfaRequired: true },
      } as never)

      const result = await useAuth
        .getState()
        .login("admin@example.com", "secret")

      expect(result.mfaRequired).toBe(true)
      expect(useAuth.getState().user).toBeNull()
      expect(useAuth.getState().isInitialized).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it("surfaces API failures and clears the loading flag", async () => {
      postSpy.mockRejectedValue(
        new ApiError("Bad credentials", 401, "UNAUTHORIZED"),
      )

      await expect(useAuth.getState().login("a@b.com", "nope")).rejects.toThrow(
        "Bad credentials",
      )
      expect(useAuth.getState().loading).toBe(false)
      expect(useAuth.getState().user).toBeNull()
    })
  })

  describe("logout", () => {
    it("clears state, storage, and notifies the API", () => {
      useAuth.getState().setSession(session("ADMIN"))

      useAuth.getState().logout()

      const state = useAuth.getState()
      expect(state.user).toBeNull()
      expect(state.tokens).toBeNull()
      expect(state.isAdmin).toBe(false)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull()
      expect(postSpy).toHaveBeenCalledWith("/auth/logout")
    })

    it("does not call the API without a token", () => {
      useAuth.getState().logout()

      expect(postSpy).not.toHaveBeenCalled()
    })
  })

  describe("setUser / setTokens", () => {
    it("recomputes role flags and rewrites the stored session", () => {
      useAuth.getState().setSession(session("CUSTOMER"))

      useAuth
        .getState()
        .setUser({ ...buildUser("MANAGER"), fullName: "Promoted" })
      expect(useAuth.getState().isManager).toBe(true)
      expect(
        JSON.parse(localStorage.getItem(STORAGE_KEY) as string).user.fullName,
      ).toBe("Promoted")

      useAuth
        .getState()
        .setTokens({
          accessToken: "rotated-access",
          refreshToken: "rotated-refresh",
        })
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string)
      expect(stored.accessToken).toBe("rotated-access")
      expect(stored.refreshToken).toBe("rotated-refresh")
      expect(useAuth.getState().tokens?.accessToken).toBe("rotated-access")
    })

    it("leaves storage untouched when there is no saved session", () => {
      useAuth.getState().setUser(buildUser("STAFF"))

      expect(useAuth.getState().isStaff).toBe(true)
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe("refreshAuth", () => {
    it("rotates tokens on success", async () => {
      useAuth.getState().setSession(session())
      postSpy.mockResolvedValue({
        data: { accessToken: "new-access", refreshToken: "new-refresh" },
      } as never)

      await useAuth.getState().refreshAuth()

      expect(postSpy).toHaveBeenCalledWith("/auth/refresh", {
        refreshToken: "refresh-token",
      })
      expect(useAuth.getState().tokens).toEqual({
        accessToken: "new-access",
        refreshToken: "new-refresh",
      })
    })

    it("logs out when the refresh call fails", async () => {
      useAuth.getState().setSession(session())
      postSpy.mockRejectedValue(new ApiError("Expired", 401, "UNAUTHORIZED"))

      await useAuth.getState().refreshAuth()

      expect(useAuth.getState().user).toBeNull()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it("is a no-op without a refresh token", async () => {
      await useAuth.getState().refreshAuth()

      expect(postSpy).not.toHaveBeenCalled()
    })
  })
})
