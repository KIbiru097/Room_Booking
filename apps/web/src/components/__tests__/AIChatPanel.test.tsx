import { render, screen, act, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AIChatPanel, { type AIChatProps } from "@/components/AIChatPanel"
import { aiService, tripApi } from "@/lib/services"
import { toast } from "@/components/ui/Toast"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"

jest.mock("@/lib/services", () => ({
  aiService: { chat: jest.fn(), voice: jest.fn() },
  tripApi: { list: jest.fn(), addItem: jest.fn() },
}))

jest.mock("@/components/ui/Toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
  ToastContainer: () => null,
  useToastStore: { getState: () => ({ addToast: jest.fn() }) },
}))

const chatMock = aiService.chat as jest.Mock
const voiceMock = aiService.voice as jest.Mock
const listMock = tripApi.list as jest.Mock
const addItemMock = tripApi.addItem as jest.Mock

const originalScrollIntoView = Element.prototype.scrollIntoView

type Deferred<T,> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: "u-1",
  email: "guest@luxstay.test",
  fullName: "Guest User",
  role: "CUSTOMER",
  isActive: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  ...overrides,
})

const setTokens = (
  tokens: { accessToken: string ;refreshToken: string } | null,
) => {
  useAuth.setState({
    user: tokens ? buildUser() : null,
    tokens,
    loading: false,
    isInitialized: true,
    isAdmin: false,
    isManager: false,
    isStaff: false,
    isCustomer: Boolean(tokens),
  })
}

const getInput = () => screen.getByRole("textbox") as HTMLInputElement
const getSendButton = () => screen.getByRole("button", { name: "Send message" })

const renderPanel = (props: Partial<AIChatProps> = {}) => {
  setTokens({ accessToken: "access", refreshToken: "refresh" })
  return render(<AIChatPanel initialOpen {...props} />)
}

const sendMessage = async (
  user: ReturnType<typeof userEvent.setup>,
  text: string,
) => {
  await user.type(getInput(), text)
  await user.keyboard("{Enter}")
}

describe("AIChatPanel", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn()
  })

  afterAll(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView
  })

  beforeEach(() => {
    localStorage.clear()
    chatMock.mockReset()
    voiceMock.mockReset()
    listMock.mockReset()
    addItemMock.mockReset()
    setTokens({ accessToken: "access", refreshToken: "refresh" })
  })

  it("renders nothing without an authenticated session", () => {
    setTokens(null)
    const { container } = render(<AIChatPanel initialOpen />)
    expect(container).toBeEmptyDOMElement()
  })

  it("greets the user with the empty state and default starter prompts", () => {
    renderPanel()

    expect(screen.getByText("LuxStay AI Concierge")).toBeInTheDocument()
    expect(
      screen.getByText("Grounded Ethiopia Travel Assistant"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Welcome! How can I assist you today?"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "☕ Coffee near Bole" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "🚨 Emergency hotlines" }),
    ).toBeInTheDocument()
    expect(getSendButton()).toBeDisabled()
  })

  it("fills the input when a default starter prompt is chosen", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValue({
      conversationId: "c1",
      message: "ok",
      toolCallsExecuted: [],
    })
    renderPanel()

    await user.click(
      screen.getByRole("button", { name: "☕ Coffee near Bole" }),
    )

    expect(getInput().value).toBe(
      "Tell me about the best coffee spots near Bole.",
    )
    expect(chatMock).not.toHaveBeenCalled()
  })

  it("sends custom suggested prompts immediately", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValue({
      conversationId: "c1",
      message: "Castle details",
      toolCallsExecuted: [],
    })
    renderPanel({
      suggestedPrompts: [
        "Show me castles",
        "Plan a day trip",
        "Three",
        "Four",
        "Five",
      ],
    })

    expect(screen.getByRole("button", { name: "Three" })).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Five" }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Show me castles" }))

    expect(chatMock).toHaveBeenCalledTimes(1)
    expect(chatMock).toHaveBeenCalledWith({
      message: "Show me castles",
      conversationId: undefined,
      hotelId: undefined,
      language: "en",
    })
  })

  it("sends on Enter, renders both bubbles and reuses the conversation id", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValueOnce({
      conversationId: "conv-9",
      message: "Here are three cafes.",
      toolCallsExecuted: [],
    })
    renderPanel({ hotelId: "h-7" })

    await sendMessage(user, "Where can I drink coffee?")

    expect(
      await screen.findByText("Where can I drink coffee?"),
    ).toBeInTheDocument()
    expect(await screen.findByText("Here are three cafes.")).toBeInTheDocument()
    expect(chatMock).toHaveBeenLastCalledWith({
      message: "Where can I drink coffee?",
      conversationId: undefined,
      hotelId: "h-7",
      language: "en",
    })
    expect(getInput().value).toBe("")

    chatMock.mockResolvedValueOnce({
      conversationId: "conv-9",
      message: "Anything else?",
      toolCallsExecuted: [],
    })
    await sendMessage(user, "One more question")

    expect(await screen.findByText("Anything else?")).toBeInTheDocument()
    expect(chatMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        conversationId: "conv-9",
        message: "One more question",
      }),
    )
  })

  it("sends through the send button as well", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValue({
      conversationId: "c1",
      message: "done",
      toolCallsExecuted: [],
    })
    renderPanel()

    await user.type(getInput(), "hello there")
    expect(getSendButton()).toBeEnabled()
    await user.click(getSendButton())

    expect(await screen.findByText("done")).toBeInTheDocument()
    expect(chatMock).toHaveBeenCalledTimes(1)
  })

  it("locks the input and shows the typing indicator while a reply is pending", async () => {
    const user = userEvent.setup()
    const pending = deferred<{
      conversationId: string
      message: string
      toolCallsExecuted: string[]
    }>()
    chatMock.mockReturnValue(pending.promise)
    renderPanel()

    await sendMessage(user, "slow question")

    expect(getInput()).toBeDisabled()
    expect(getSendButton()).toBeDisabled()

    await act(async () => {
      pending.resolve({
        conversationId: "c1",
        message: "all done",
        toolCallsExecuted: [],
      })
    })

    expect(await screen.findByText("all done")).toBeInTheDocument()
    expect(getInput()).toBeEnabled()
    expect(getSendButton()).toBeDisabled()

    await user.type(getInput(), "follow up")
    expect(getSendButton()).toBeEnabled()
  })

  it("shows the API error message and recovers on the next attempt", async () => {
    const user = userEvent.setup()
    chatMock.mockRejectedValueOnce(new Error("rate limited"))
    renderPanel()

    await sendMessage(user, "first try")
    expect(await screen.findByText("rate limited")).toBeInTheDocument()

    chatMock.mockResolvedValueOnce({
      conversationId: "c1",
      message: "recovered",
      toolCallsExecuted: [],
    })
    await sendMessage(user, "second try")

    expect(await screen.findByText("recovered")).toBeInTheDocument()
    expect(screen.queryByText("rate limited")).not.toBeInTheDocument()
  })

  it("falls back to a generic error when the failure has no message", async () => {
    const user = userEvent.setup()
    chatMock.mockRejectedValueOnce({ weird: true })
    renderPanel()

    await sendMessage(user, "boom")

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument()
  })

  it("ignores empty submissions", async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(getInput())
    await user.keyboard("{Enter}")

    expect(chatMock).not.toHaveBeenCalled()
  })

  it("requests the Amharic language when the document is in Amharic", async () => {
    const user = userEvent.setup()
    localStorage.setItem("luxstay_lang", "am")
    chatMock.mockResolvedValue({
      conversationId: "c1",
      message: "ok",
      toolCallsExecuted: [],
    })
    renderPanel()

    await sendMessage(user, "Selam")

    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({ language: "am", message: "Selam" }),
    )
  })

  it("renders tool badges and verified place cards from a reply", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValueOnce({
      conversationId: "c1",
      message: "Two verified places nearby.",
      toolCallsExecuted: ["search_places", "weather_lookup"],
      placeCards: [
        {
          id: "p1",
          name: "Entoto Park",
          category: "Nature",
          distanceKm: 0.45,
          images: ["/images/entoto.jpg"],
          verifiedSource: { name: "Ethio Tourism Board" },
        },
        {
          id: "p2",
          name: "Sheger Park",
          distanceKm: 1.5,
          images: [],
        },
      ],
    })
    renderPanel()

    await sendMessage(user, "show places")

    expect(await screen.findByText("Verified tools:")).toBeInTheDocument()
    expect(screen.getByText("search_places")).toBeInTheDocument()
    expect(screen.getByText("weather_lookup")).toBeInTheDocument()

    expect(
      await screen.findByText("Verified nearby places"),
    ).toBeInTheDocument()
    const firstCard = screen.getByRole("link", { name: /Entoto Park/ })
    expect(firstCard).toHaveAttribute("href", "/discover/p1")
    expect(firstCard).toHaveTextContent("Nature · 450m")
    expect(firstCard).toHaveTextContent("✓ Ethio Tourism Board")

    const secondCard = screen.getByRole("link", { name: /Sheger Park/ })
    expect(secondCard).toHaveAttribute("href", "/discover/p2")
    expect(secondCard).toHaveTextContent("Place · 1.5 km")
    expect(secondCard).toHaveTextContent("✓ Verified source")
    expect(within(secondCard).queryByRole("img")).not.toBeInTheDocument()
  })

  it("offers a draft itinerary proposal that can be dismissed", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValueOnce({
      conversationId: "c1",
      message:
        "I drafted a relaxed day. Would you like to add this to your trip?",
      toolCallsExecuted: [],
    })
    renderPanel()

    await sendMessage(user, "plan my day")

    expect(
      await screen.findByText("Draft Itinerary Proposal"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Would you like to add this recommended activity to your active trip?",
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Dismiss" }))

    expect(
      screen.queryByText("Draft Itinerary Proposal"),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/I drafted a relaxed day/)).toBeInTheDocument()
    expect(listMock).not.toHaveBeenCalled()
  })

  it("tells the user to create a trip when none exists", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValueOnce({
      conversationId: "c1",
      message: "Would you like to add this to your trip?",
      toolCallsExecuted: [],
    })
    listMock.mockResolvedValue({ data: [], total: 0 })
    renderPanel()

    await sendMessage(user, "plan my day")
    await user.click(
      await screen.findByRole("button", { name: "Confirm & Add" }),
    )

    expect(toast.info).toHaveBeenCalledWith(
      "No active trip",
      "Please create a trip itinerary in My Trips first.",
    )
    expect(addItemMock).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("adds the confirmed draft to the first active trip", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValueOnce({
      conversationId: "c1",
      message: "Drafted an itinerary for you.",
      toolCallsExecuted: [],
    })
    listMock.mockResolvedValue({
      data: [
        {
          id: "trip-1",
          title: "Ethiopia Hop",
          startDate: "2026-03-10T00:00:00.000Z",
          endDate: "2026-03-17T00:00:00.000Z",
        },
      ],
      total: 1,
    })
    addItemMock.mockResolvedValue({})
    renderPanel()

    await sendMessage(user, "add something")
    await user.click(
      await screen.findByRole("button", { name: "Confirm & Add" }),
    )

    expect(listMock).toHaveBeenCalledTimes(1)
    expect(addItemMock).toHaveBeenCalledWith("trip-1", {
      dayDate: "2026-03-10",
      title: "Recommended Activity",
      itemType: "CUSTOM",
      startTime: "10:00",
      durationMin: 90,
      notes: "Suggested by LuxStay AI Travel Assistant",
      createdBy: "AI",
      userConfirmed: true,
    })
    expect(toast.success).toHaveBeenCalledWith(
      "Added to Itinerary!",
      'Scheduled in "Ethiopia Hop".',
    )
    expect(
      await screen.findByText("Drafted an itinerary for you."),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Confirm & Add" }),
    ).not.toBeInTheDocument()
  })

  it("keeps the confirm button disabled while the draft is being saved", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValueOnce({
      conversationId: "c1",
      message: "drafted",
      toolCallsExecuted: ["draft_itinerary"],
    })
    const pendingTrips = deferred<{
      data: Array<{ id: string ;title: string ;startDate: string }>
      total: number
    }>()
    listMock.mockReturnValue(pendingTrips.promise)
    renderPanel()

    await sendMessage(user, "plan")
    const confirm = await screen.findByRole("button", { name: "Confirm & Add" })
    await user.click(confirm)

    expect(confirm).toBeDisabled()

    await act(async () => {
      pendingTrips.resolve({
        data: [
          { id: "t", title: "Trip", startDate: "2026-01-05T00:00:00.000Z" },
        ],
        total: 1,
      })
    })

    expect(addItemMock).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByRole("button", { name: "Confirm & Add" }),
    ).not.toBeInTheDocument()
  })

  it("reports failures while saving a draft and keeps the proposal visible", async () => {
    const user = userEvent.setup()
    chatMock.mockResolvedValueOnce({
      conversationId: "c1",
      message: "Would you like to add this to your trip?",
      toolCallsExecuted: [],
    })
    listMock.mockResolvedValue({
      data: [
        { id: "trip-1", title: "Trip", startDate: "2026-04-01T00:00:00.000Z" },
      ],
      total: 1,
    })
    addItemMock.mockRejectedValue(new Error("quota exceeded"))
    renderPanel()

    await sendMessage(user, "plan")
    await user.click(
      await screen.findByRole("button", { name: "Confirm & Add" }),
    )

    expect(toast.error).toHaveBeenCalledWith("Failed to add", "quota exceeded")
    expect(
      screen.getByRole("button", { name: "Confirm & Add" }),
    ).toBeInTheDocument()
  })

  it("opens and closes the floating drawer from the launcher pill", async () => {
    const user = userEvent.setup()
    setTokens({ accessToken: "access", refreshToken: "refresh" })
    const onClose = jest.fn()
    render(<AIChatPanel onClose={onClose} />)

    expect(screen.queryByText("LuxStay AI Concierge")).not.toBeInTheDocument()
    const launcher = screen.getByRole("button", {
      name: "Open AI travel assistant",
    })
    await user.click(launcher)

    expect(screen.getByText("LuxStay AI Concierge")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close AI chat" }))

    expect(screen.queryByText("LuxStay AI Concierge")).not.toBeInTheDocument()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole("button", { name: "Open AI travel assistant" }),
    ).toBeInTheDocument()
  })

  it("renders the inline variant without a pill or close control", () => {
    renderPanel({ variant: "inline", className: "custom-class" })

    expect(screen.getByText("LuxStay AI Concierge")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Open AI travel assistant" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Close AI chat" }),
    ).not.toBeInTheDocument()
  })

  it("honours the placeholder, initial prompt and focuses the input", () => {
    renderPanel({
      placeholder: "Type your question",
      initialPrompt: "Hello AI",
    })

    const input = screen.getByPlaceholderText(
      "Type your question",
    ) as HTMLInputElement
    expect(input.value).toBe("Hello AI")
    expect(document.activeElement).toBe(input)
  })

  it("disables the send button until the input has content", async () => {
    const user = userEvent.setup()
    renderPanel()

    expect(getSendButton()).toBeDisabled()

    await user.type(getInput(), "x")
    expect(getSendButton()).toBeEnabled()

    await user.clear(getInput())
    expect(getSendButton()).toBeDisabled()
  })
})

describe("AIChatPanel voice input", () => {
  const mockTrack = { stop: jest.fn() }
  const mockStream = { getTracks: () => [mockTrack] }

  class MockMediaRecorder {
    static emitData = false
    state: "inactive" | "recording" = "inactive"
    mimeType = "audio/webm"
    ondataavailable: ((event: { data: Blob }) => void) | null = null
    onstop: (() => void) | null = null

    constructor(public stream: unknown) {}

    start() {
      this.state = "recording"
      if (MockMediaRecorder.emitData) {
        this.ondataavailable?.({
          data: new Blob(["voice-bytes"], { type: "audio/webm" }),
        })
      }
    }

    stop() {
      this.state = "inactive"
      this.onstop?.()
    }
  }

  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn()
  })

  afterAll(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView
  })

  beforeEach(() => {
    localStorage.clear()
    chatMock.mockReset()
    voiceMock.mockReset()
    listMock.mockReset()
    addItemMock.mockReset()
    mockTrack.stop.mockClear()
    MockMediaRecorder.emitData = false
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: jest.fn().mockResolvedValue(mockStream) },
    })
    ;(globalThis as { MediaRecorder?: unknown }).MediaRecorder =
      MockMediaRecorder
  })

  afterEach(() => {
    delete (navigator as { mediaDevices?: MediaDevices }).mediaDevices
    delete (globalThis as { MediaRecorder?: unknown }).MediaRecorder
  })

  it("offers no microphone control when recording is unsupported", () => {
    delete (navigator as { mediaDevices?: MediaDevices }).mediaDevices
    delete (globalThis as { MediaRecorder?: unknown }).MediaRecorder

    renderPanel()

    expect(screen.queryByTitle("Hold or tap to speak")).not.toBeInTheDocument()
  })

  it("starts and stops recording through the microphone button", async () => {
    const user = userEvent.setup()
    renderPanel()

    const input = getInput()
    const mic = screen.getByTitle("Hold or tap to speak")
    await user.click(mic)

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true,
    })
    expect(screen.getByTitle("Stop recording")).toBeInTheDocument()
    expect(input).toBeDisabled()
    expect(
      screen.getByPlaceholderText("Listening… tap mic to send"),
    ).toBeInTheDocument()

    await user.click(screen.getByTitle("Stop recording"))

    expect(screen.getByTitle("Hold or tap to speak")).toBeInTheDocument()
    expect(input).toBeEnabled()
    expect(voiceMock).not.toHaveBeenCalled()
    expect(mockTrack.stop).toHaveBeenCalled()
  })

  it("sends the recorded audio and renders both transcript bubbles", async () => {
    const user = userEvent.setup()
    MockMediaRecorder.emitData = true
    voiceMock.mockResolvedValue({
      conversationId: "voice-conv",
      transcript: "  Best coffee in Addis?  ",
      message: "Here are the top cafes.",
    })
    renderPanel()

    await user.click(screen.getByTitle("Hold or tap to speak"))
    await user.click(screen.getByTitle("Stop recording"))

    expect(await screen.findByText("Best coffee in Addis?")).toBeInTheDocument()
    expect(
      await screen.findByText("Here are the top cafes."),
    ).toBeInTheDocument()
    expect(voiceMock).toHaveBeenCalledTimes(1)
    expect(voiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        audioBase64: "dm9pY2UtYnl0ZXM=",
        mimeType: "audio/webm",
        language: "en",
      }),
    )
    expect(screen.getByTitle("Hold or tap to speak")).toBeInTheDocument()
  })

  it("surfaces voice failures", async () => {
    const user = userEvent.setup()
    MockMediaRecorder.emitData = true
    voiceMock.mockRejectedValue(new Error("microphone busy"))
    renderPanel()

    await user.click(screen.getByTitle("Hold or tap to speak"))
    await user.click(screen.getByTitle("Stop recording"))

    expect(await screen.findByText("microphone busy")).toBeInTheDocument()
    expect(screen.getByTitle("Hold or tap to speak")).toBeInTheDocument()
  })

  it("stops the live stream when unmounted mid-recording", async () => {
    const user = userEvent.setup()
    voiceMock.mockResolvedValue({
      conversationId: "v",
      transcript: "",
      message: "",
    })
    const { unmount } = renderPanel()

    await user.click(screen.getByTitle("Hold or tap to speak"))
    expect(screen.getByTitle("Stop recording")).toBeInTheDocument()

    unmount()

    expect(mockTrack.stop).toHaveBeenCalled()
    await act(async () => {})
  })
})

describe("AIChatPanel microphone errors", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn()
  })

  afterAll(() => {
    Element.prototype.scrollIntoView = originalScrollIntoView
  })

  beforeEach(() => {
    localStorage.clear()
    chatMock.mockReset()
    voiceMock.mockReset()
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: jest
          .fn()
          .mockRejectedValue(new Error("permission denied")),
      },
    })
    ;(globalThis as { MediaRecorder?: unknown }).MediaRecorder = class {
      state: "inactive" | "recording" = "inactive"
      ondataavailable: ((event: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start() {}
      stop() {}
    }
  })

  afterEach(() => {
    delete (navigator as { mediaDevices?: MediaDevices }).mediaDevices
    delete (globalThis as { MediaRecorder?: unknown }).MediaRecorder
  })

  it("reports an unavailable microphone when access is refused", async () => {
    const user = userEvent.setup()
    renderPanel()

    await user.click(screen.getByTitle("Hold or tap to speak"))

    expect(
      await screen.findByText(
        "Microphone unavailable — voice requires permission.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByTitle("Hold or tap to speak")).toBeInTheDocument()
  })
})
