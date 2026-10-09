import { render, waitFor } from "@testing-library/react"
import PwaRegistration from "@/components/PwaRegistration"

type MutableNavigator = Navigator & { serviceWorker?: ServiceWorkerContainer }

const mutableNavigator = navigator as MutableNavigator
const originalNodeEnv = process.env.NODE_ENV
const originalServiceWorker = Object.getOwnPropertyDescriptor(
  mutableNavigator,
  "serviceWorker",
)

const stubServiceWorker = (register: jest.Mock) => {
  Object.defineProperty(mutableNavigator, "serviceWorker", {
    value: { register },
    configurable: true,
    writable: true,
  })
}

const clearServiceWorker = () => {
  if (originalServiceWorker) {
    Object.defineProperty(
      mutableNavigator,
      "serviceWorker",
      originalServiceWorker,
    )
  } else {
    Reflect.deleteProperty(mutableNavigator, "serviceWorker")
  }
}

describe("PwaRegistration", () => {
  afterEach(() => {
    ;(process.env as Record<string, string>).NODE_ENV = originalNodeEnv
    clearServiceWorker()
  })

  it("renders nothing", () => {
    const { container } = render(<PwaRegistration />)
    expect(container).toBeEmptyDOMElement()
  })

  it("does not register the worker outside production", () => {
    const register = jest.fn().mockResolvedValue({})
    stubServiceWorker(register)

    render(<PwaRegistration />)

    expect(register).not.toHaveBeenCalled()
  })

  it("registers /sw.js with the root scope in production", async () => {
    ;(process.env as Record<string, string>).NODE_ENV = "production"
    const register = jest.fn().mockResolvedValue({})
    stubServiceWorker(register)

    render(<PwaRegistration />)

    await waitFor(() => expect(register).toHaveBeenCalledTimes(1))
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" })
  })

  it("stays silent when the browser has no service worker support", () => {
    ;(process.env as Record<string, string>).NODE_ENV = "production"
    clearServiceWorker()

    expect(() => render(<PwaRegistration />)).not.toThrow()
  })

  it("swallows registration failures", async () => {
    ;(process.env as Record<string, string>).NODE_ENV = "production"
    const register = jest.fn().mockRejectedValue(new Error("insecure context"))
    stubServiceWorker(register)

    const { container } = render(<PwaRegistration />)

    await waitFor(() => expect(register).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
