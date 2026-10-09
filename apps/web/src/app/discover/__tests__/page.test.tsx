import { render, screen } from "@testing-library/react"
import DiscoverPage, { metadata, revalidate } from "@/app/discover/page"

jest.mock("@/app/discover/DiscoverView", () => ({
  __esModule: true,
  default: (props: {
    initialDestinations: unknown[]
    initialPlaces: unknown[]
  }) => (
    <div
      data-testid="discover-view"
      data-destinations={JSON.stringify(props.initialDestinations)}
      data-places={JSON.stringify(props.initialPlaces)}
    />
  ),
}))

const fetchMock = jest.fn()

const DESTINATIONS = [
  { id: "gondar", name: "Gondar" },
  { id: "lalibela", name: "Lalibela" },
]
const NEARBY = { data: [{ id: "p1", name: "Unity Park" }] }

beforeEach(() => {
  jest.clearAllMocks()
  ;(global as unknown as { fetch: unknown }).fetch = fetchMock
})

afterEach(() => {
  jest.restoreAllMocks()
})

function mockFetchOnce(payload: unknown, ok = true) {
  fetchMock.mockResolvedValueOnce({ ok, json: async () => payload })
}

describe("DiscoverPage", () => {
  it("exposes static rendering metadata", () => {
    expect(revalidate).toBe(300)
    expect(metadata.title).toBe("Discover Ethiopia")
    expect(metadata.description).toContain("Explore Ethiopia")
  })

  it("preloads destinations and nearby places from the API", async () => {
    mockFetchOnce(DESTINATIONS)
    mockFetchOnce(NEARBY)

    render(await DiscoverPage())

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [destinationsUrl] = fetchMock.mock.calls[0]
    const [nearbyUrl] = fetchMock.mock.calls[1]
    expect(destinationsUrl).toContain("/discover/destinations?limit=50")
    expect(nearbyUrl).toContain("/discover/nearby?lat=9.0105&lng=38.7612")
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      next: { revalidate: 300 },
    })

    const view = screen.getByTestId("discover-view")
    expect(JSON.parse(view.dataset.destinations as string)).toEqual(
      DESTINATIONS,
    )
    expect(JSON.parse(view.dataset.places as string)).toEqual(NEARBY.data)
  })

  it("passes empty collections when a request fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"))

    render(await DiscoverPage())

    const view = screen.getByTestId("discover-view")
    expect(JSON.parse(view.dataset.destinations as string)).toEqual([])
    expect(JSON.parse(view.dataset.places as string)).toEqual([])
  })

  it("treats a non-2xx response as missing data", async () => {
    mockFetchOnce(null, false)
    mockFetchOnce(null, false)

    render(await DiscoverPage())

    const view = screen.getByTestId("discover-view")
    expect(JSON.parse(view.dataset.destinations as string)).toEqual([])
    expect(JSON.parse(view.dataset.places as string)).toEqual([])
  })

  it("tolerates a payload without the expected shape", async () => {
    mockFetchOnce([])
    mockFetchOnce({ unexpected: true })

    render(await DiscoverPage())

    const view = screen.getByTestId("discover-view")
    expect(JSON.parse(view.dataset.destinations as string)).toEqual([])
    expect(JSON.parse(view.dataset.places as string)).toEqual([])
  })
})
