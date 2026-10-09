import { render, act } from "@testing-library/react"
import Aurora from "@/components/Aurora"

const mockRenderers: any[] = []
const mockPrograms: any[] = []
const mockColors: string[] = []
const mockLoseContext = jest.fn()

jest.mock("ogl", () => {
  class MockRenderer {
    gl: any
    setSize = jest.fn()
    render = jest.fn()
    constructor() {
      const canvas = document.createElement("canvas")
      this.gl = {
        canvas,
        clearColor: jest.fn(),
        enable: jest.fn(),
        blendFunc: jest.fn(),
        BLEND: 3042,
        ONE: 1,
        ONE_MINUS_SRC_ALPHA: 771,
        getExtension: jest.fn(() => ({ loseContext: mockLoseContext })),
      }
      mockRenderers.push(this)
    }
  }

  class MockProgram {
    uniforms: any
    constructor(_gl: any, options: any) {
      this.uniforms = options.uniforms
      mockPrograms.push(this)
    }
  }

  class MockColor {
    r = 0
    g = 0
    b = 0
    constructor(hex: string) {
      mockColors.push(hex)
    }
  }

  class MockTriangle {
    attributes: Record<string, unknown> = { uv: { itemSize: 2 } }
    constructor() {}
  }

  class MockMesh {
    constructor(_gl: any, _options: any) {}
  }

  return {
    Renderer: MockRenderer,
    Program: MockProgram,
    Color: MockColor,
    Triangle: MockTriangle,
    Mesh: MockMesh,
  }
})

let mockFrameCb: FrameRequestCallback | null = null
let mockFrameId = 0

const originalMatchMedia = window.matchMedia
const originalWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth",
)
const originalHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight",
)

describe("Aurora", () => {
  beforeEach(() => {
    mockRenderers.length = 0
    mockPrograms.length = 0
    mockColors.length = 0
    mockLoseContext.mockClear()
    mockFrameCb = null
    mockFrameId = 0

    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        mockFrameCb = cb
        mockFrameId += 1
        return mockFrameId
      })
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
      mockFrameCb = null
    })

    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get: () => 800,
    })
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get: () => 600,
    })
  })

  afterEach(() => {
    if (originalWidth)
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalWidth)
    if (originalHeight)
      Object.defineProperty(
        HTMLElement.prototype,
        "offsetHeight",
        originalHeight,
      )
    delete (document as { hidden?: boolean }).hidden
    window.matchMedia = originalMatchMedia
    jest.restoreAllMocks()
  })

  const runFrame = (ts: number) => {
    const cb = mockFrameCb
    if (!cb) return
    act(() => {
      cb(ts)
    })
  }

  it("mounts a WebGL canvas with default uniforms", () => {
    const { container } = render(<Aurora />)

    expect(mockRenderers).toHaveLength(1)
    expect(container.querySelector("canvas")).toBeInTheDocument()

    const renderer = mockRenderers[0]
    expect(renderer.gl.canvas.parentNode).toBe(container.firstElementChild)
    expect(renderer.gl.clearColor).toHaveBeenCalledWith(0, 0, 0, 0)
    expect(renderer.gl.enable).toHaveBeenCalledWith(3042)
    expect(renderer.gl.blendFunc).toHaveBeenCalledWith(1, 771)
    expect(renderer.setSize).toHaveBeenCalledWith(800, 600)

    expect(mockPrograms).toHaveLength(1)
    const uniforms = mockPrograms[0].uniforms
    expect(uniforms.uAmplitude.value).toBe(1.2)
    expect(uniforms.uBlend.value).toBe(0.6)
    expect(uniforms.uLightMode.value).toBe(0)
    expect(uniforms.uResolution.value).toEqual([800, 600])
    expect(uniforms.uColorStops.value).toHaveLength(3)
    expect(mockColors).toEqual(["#1E3A8A", "#A16207", "#1E3A8A"])
  })

  it("passes custom props through to the shader uniforms", () => {
    render(
      <Aurora
        colorStops={["#FF0000", "#00FF00", "#0000FF"]}
        amplitude={2.5}
        blend={0.2}
        lightMode
      />,
    )

    const uniforms = mockPrograms[0].uniforms
    expect(uniforms.uAmplitude.value).toBe(2.5)
    expect(uniforms.uBlend.value).toBe(0.2)
    expect(uniforms.uLightMode.value).toBe(1)
    expect(mockColors).toEqual(["#FF0000", "#00FF00", "#0000FF"])
  })

  it("skips WebGL entirely when reduced motion is preferred", () => {
    window.matchMedia = (jest.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })) as unknown as typeof window.matchMedia)

    const { container } = render(<Aurora />)

    expect(mockRenderers).toHaveLength(0)
    expect(mockPrograms).toHaveLength(0)
    expect(container.querySelector("canvas")).not.toBeInTheDocument()
  })

  it("renders frames, throttles to roughly 30fps and follows prop updates", () => {
    const { rerender } = render(<Aurora speed={2} />)

    expect(mockRenderers[0].render).not.toHaveBeenCalled()

    runFrame(40)
    expect(mockRenderers[0].render).toHaveBeenCalledTimes(1)
    expect(mockPrograms[0].uniforms.uTime.value).toBeCloseTo(0.04 * 2)
    expect(mockPrograms[0].uniforms.uAmplitude.value).toBe(1.2)

    runFrame(50)
    expect(mockRenderers[0].render).toHaveBeenCalledTimes(1)

    rerender(<Aurora speed={2} amplitude={3} />)
    runFrame(120)
    expect(mockRenderers[0].render).toHaveBeenCalledTimes(2)
    expect(mockPrograms[0].uniforms.uAmplitude.value).toBe(3)
    expect(mockPrograms[0].uniforms.uTime.value).toBeCloseTo(0.12 * 2)
  })

  it("resizes the renderer with its container", () => {
    render(<Aurora />)

    const renderer = mockRenderers[0]
    renderer.setSize.mockClear()

    act(() => {
      window.dispatchEvent(new Event("resize"))
    })

    expect(renderer.setSize).toHaveBeenCalledWith(800, 600)
  })

  it("pauses the animation loop while the tab is hidden and resumes after", () => {
    render(<Aurora />)
    expect(mockFrameCb).not.toBeNull()

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    })
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(mockFrameCb).toBeNull()

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    })
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })
    expect(mockFrameCb).not.toBeNull()

    const renderer = mockRenderers[0]
    renderer.render.mockClear()
    runFrame(80)
    expect(renderer.render).toHaveBeenCalledTimes(1)
  })

  it("tears down the canvas, listeners and GL context on unmount", () => {
    const { container, unmount } = render(<Aurora />)
    const renderer = mockRenderers[0]

    expect(container.querySelector("canvas")).toBeInTheDocument()

    unmount()

    expect(mockFrameCb).toBeNull()
    expect(container.querySelector("canvas")).not.toBeInTheDocument()
    expect(renderer.gl.getExtension).toHaveBeenCalledWith("WEBGL_lose_context")
    expect(mockLoseContext).toHaveBeenCalledTimes(1)

    renderer.setSize.mockClear()
    act(() => {
      window.dispatchEvent(new Event("resize"))
    })
    expect(renderer.setSize).not.toHaveBeenCalled()
  })
})
