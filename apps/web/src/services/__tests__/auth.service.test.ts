import { apiClient } from "@/lib/axios"
import { authService } from "@/services/auth.service"

interface Spies {
  get: jest.SpyInstance
  post: jest.SpyInstance
  patch: jest.SpyInstance
  delete: jest.SpyInstance
}

let spy: Spies

beforeEach(() => {
  spy = {
    get: jest
      .spyOn(apiClient, "get")
      .mockResolvedValue({ data: null } as never),
    post: jest
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: null } as never),
    patch: jest
      .spyOn(apiClient, "patch")
      .mockResolvedValue({ data: null } as never),
    delete: jest
      .spyOn(apiClient, "delete")
      .mockResolvedValue({ data: null } as never),
  }
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("authService.login", () => {
  it("posts the credentials and unwraps the session", async () => {
    const session = { user: { id: "u1" }, accessToken: "a", refreshToken: "r" }
    spy.post.mockResolvedValue({ data: session } as never)

    const result = await authService.login({
      email: "guest@example.com",
      password: "secret1",
    })

    expect(spy.post).toHaveBeenCalledWith("/auth/login", {
      email: "guest@example.com",
      password: "secret1",
    })
    expect(result).toEqual(session)
  })

  it("propagates API failures", async () => {
    spy.post.mockRejectedValue(new Error("Bad credentials"))

    await expect(
      authService.login({ email: "a@b.com", password: "nope" }),
    ).rejects.toThrow("Bad credentials")
  })
})

describe("authService.register", () => {
  it("posts the registration payload", async () => {
    const payload = {
      email: "new@b.com",
      password: "secret1",
      fullName: "New User",
    }
    spy.post.mockResolvedValue({
      data: { user: { id: "u2" }, accessToken: "a", refreshToken: "r" },
    } as never)

    const result = await authService.register(payload)

    expect(spy.post).toHaveBeenCalledWith("/auth/register", payload)
    expect(result.accessToken).toBe("a")
  })
})

describe("authService social and MFA flows", () => {
  it("posts the google credential payload", async () => {
    spy.post.mockResolvedValue({
      data: { user: { id: "u3" }, accessToken: "g" },
    } as never)

    const result = await authService.googleLogin({
      credential: "id-token",
      email: "g@b.com",
    })

    expect(spy.post).toHaveBeenCalledWith("/auth/google", {
      credential: "id-token",
      email: "g@b.com",
    })
    expect(result.accessToken).toBe("g")
  })

  it("posts the MFA challenge answer", async () => {
    spy.post.mockResolvedValue({
      data: { user: { id: "u4" }, accessToken: "m" },
    } as never)

    const result = await authService.verifyMfa({
      challengeToken: "challenge-1",
      code: "123456",
    })

    expect(spy.post).toHaveBeenCalledWith("/auth/mfa/verify", {
      challengeToken: "challenge-1",
      code: "123456",
    })
    expect(result.accessToken).toBe("m")
  })
})

describe("authService password recovery", () => {
  it("requests a reset link", async () => {
    spy.post.mockResolvedValue({ data: { message: "sent" } } as never)

    const result = await authService.forgotPassword({
      email: "guest@example.com",
    })

    expect(spy.post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "guest@example.com",
    })
    expect(result).toEqual({ message: "sent" })
  })

  it("submits the new password with its token", async () => {
    spy.post.mockResolvedValue({ data: { message: "reset" } } as never)

    await authService.resetPassword({ token: "reset-1", password: "secret2" })

    expect(spy.post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "reset-1",
      password: "secret2",
    })
  })

  it("encodes the verification token in the path", async () => {
    spy.post.mockResolvedValue({
      data: { message: "ok", verified: true },
    } as never)

    const result = await authService.verifyEmail("token/with space")

    expect(spy.post).toHaveBeenCalledWith(
      "/auth/verify-email/token%2Fwith%20space",
    )
    expect(result.verified).toBe(true)
  })
})

describe("authService profile", () => {
  it("reads the profile", async () => {
    spy.get.mockResolvedValue({
      data: { id: "u1", fullName: "Abebe" },
    } as never)

    const profile = await authService.getProfile()

    expect(spy.get).toHaveBeenCalledWith("/auth/me")
    expect(profile.fullName).toBe("Abebe")
  })

  it("patches profile fields", async () => {
    spy.patch.mockResolvedValue({
      data: { id: "u1", fullName: "Renamed" },
    } as never)

    const updated = await authService.updateProfile({
      fullName: "Renamed",
      currentPassword: "old-secret1",
      newPassword: "new-secret1",
    })

    expect(spy.patch).toHaveBeenCalledWith("/auth/me", {
      fullName: "Renamed",
      currentPassword: "old-secret1",
      newPassword: "new-secret1",
    })
    expect(updated.fullName).toBe("Renamed")
  })

  it("uploads the avatar as multipart form data", async () => {
    const file = new File(["img"], "avatar.png", { type: "image/png" })
    spy.post.mockResolvedValue({ data: { id: "u1" } } as never)

    await authService.uploadProfilePhoto(file)

    const [path, body, config] = spy.post.mock.calls[0]
    expect(path).toBe("/auth/me/photo")
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get("photo")).toBe(file)
    expect(config).toEqual({
      headers: { "Content-Type": "multipart/form-data" },
    })
  })
})

describe("authService sessions and deactivation", () => {
  it("lists sessions", async () => {
    const sessions = [{ id: "session-1" }]
    spy.get.mockResolvedValue({ data: sessions } as never)

    await expect(authService.listSessions()).resolves.toEqual(sessions)
    expect(spy.get).toHaveBeenCalledWith("/auth/sessions")
  })

  it("revokes a single session", async () => {
    await authService.revokeSession("session-1")

    expect(spy.delete).toHaveBeenCalledWith("/auth/sessions/session-1")
  })

  it("revokes every other session", async () => {
    await authService.revokeAllOtherSessions()

    expect(spy.delete).toHaveBeenCalledWith("/auth/sessions")
  })

  it("deactivates the account with a reason", async () => {
    await authService.deactivateAccount("no longer travelling")

    expect(spy.post).toHaveBeenCalledWith("/auth/me/deactivate", {
      reason: "no longer travelling",
    })
  })

  it("deactivates without a reason", async () => {
    await authService.deactivateAccount()

    expect(spy.post).toHaveBeenCalledWith("/auth/me/deactivate", {
      reason: undefined,
    })
  })
})

describe("authService.logout", () => {
  it("posts the logout request and resolves", async () => {
    await expect(authService.logout()).resolves.toBeUndefined()

    expect(spy.post).toHaveBeenCalledWith("/auth/logout")
  })
})
