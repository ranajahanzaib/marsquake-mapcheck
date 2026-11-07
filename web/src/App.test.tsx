// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { readFileSync, existsSync } from "node:fs";
import App from "./App";
import MarsMap from "./MarsMap";
import {
  coverage,
  downloads,
  emptyFilters,
  filterEvents,
  groups,
  project,
  selectedEvent,
} from "./lib";
import type { CatalogEvent } from "./types";
const events: CatalogEvent[] = JSON.parse(
  readFileSync("public/data/events.json", "utf8"),
);
const summary = JSON.parse(
  readFileSync("public/data/audit-summary.json", "utf8"),
);
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(url.includes("events.json") ? events : summary),
      }),
    ),
  );
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("scientific map semantics", () => {
  it("uses the same global equirectangular projection with east positive", () => {
    expect(project(90, -180)).toEqual([0, 0]);
    expect(project(-90, 180)).toEqual([720, 360]);
    expect(project(0, 0)).toEqual([360, 180]);
  });
  it("plots only non-default records in the audited layer, retaining the station", () => {
    const { container } = render(
      <MarsMap events={events} audited selected={null} onSelect={() => {}} />,
    );
    expect(container.querySelectorAll(".map-point").length).toBe(
      summary.audited_map_count,
    );
    expect(container.querySelectorAll(".placeholder").length).toBe(0);
    expect(container.querySelectorAll(".station").length).toBe(1);
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      "0 0 720 400",
    );
  });
  it("keeps repeated default records at one counted coordinate", () => {
    const { container } = render(
      <MarsMap
        events={events}
        audited={false}
        selected={null}
        onSelect={() => {}}
      />,
    );
    expect(container.querySelectorAll(".placeholder").length).toBe(1);
    expect(container.querySelector(".stack-label")?.textContent).toBe(
      "2,691 placeholders",
    );
    expect(groups(events, false).flat().length).toBe(events.length);
  });
  it("retains the station when filters leave no events", () => {
    const { container } = render(
      <MarsMap events={[]} audited selected={null} onSelect={() => {}} />,
    );
    expect(container.querySelectorAll(".station").length).toBe(1);
    expect(container.querySelectorAll(".map-point").length).toBe(0);
  });
});
describe("synchronized filters and inspection", () => {
  it("handles search, signal, status, dates and missing magnitudes explicitly", () => {
    expect(
      filterEvents(events, { ...emptyFilters, search: "T0045a" })[0].event_id,
    ).toBe("mqs2019aumt");
    expect(
      filterEvents(events, { ...emptyFilters, status: "NON_DEFAULT_LOCATION" })
        .length,
    ).toBe(summary.audited_map_count);
    expect(
      filterEvents(events, { ...emptyFilters, type: "BROADBAND" }).every(
        (e) => e.event_type === "BROADBAND",
      ),
    ).toBe(true);
    expect(
      filterEvents(events, { ...emptyFilters, min: "0" }).every(
        (e) => e.magnitude !== null,
      ),
    ).toBe(true);
    expect(
      filterEvents(events, {
        ...emptyFilters,
        from: "2022-01-01",
        to: "2022-12-31",
      }).every((e) => e.event_time?.startsWith("2022")),
    ).toBe(true);
    expect(
      filterEvents(events, { ...emptyFilters, from: "2023-01-01" }),
    ).toEqual([]);
    expect(coverage(0, 0)).toBe("Unavailable");
  });
  it("selects by row identifier so duplicate event IDs cannot destabilize selection", () => {
    const rows = [
      { ...events[0], row_id: "first" },
      { ...events[0], row_id: "second" },
    ];
    expect(selectedEvent(rows, "second")?.row_id).toBe("second");
    expect(selectedEvent(rows, "removed")?.row_id).toBe("first");
    expect(selectedEvent([], null)).toBe(null);
  });
  it("loads the snapshot, filters both maps, preserves full metrics and renders missing magnitude", async () => {
    const { container } = render(<App />);
    await screen.findByText("2,691 placeholders");
    expect(
      within(screen.getByLabelText("Selected event details")).getByText(
        "Not reported",
      ),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search catalog"), {
      target: { value: "mqs2019aumt" },
    });
    expect(container.querySelector(".naive .map-count")?.textContent).toContain(
      "1",
    );
    expect(
      container.querySelector(".audited .map-count")?.textContent,
    ).toContain("0");
    expect(container.querySelector(".metrics")?.textContent).toContain("2,715");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.change(screen.getByLabelText("Location status"), {
      target: { value: "NON_DEFAULT_LOCATION" },
    });
    expect(container.querySelectorAll(".naive .map-point").length).toBe(24);
    expect(container.querySelectorAll(".audited .map-point").length).toBe(24);
    fireEvent.click(
      screen.getByRole("button", { name: "Inspect mqs2019fddj (S0105a)" }),
    );
    expect(
      within(screen.getByLabelText("Selected event details")).getByRole(
        "heading",
      ).textContent,
    ).toBe("mqs2019fddj");
    fireEvent.change(screen.getByLabelText("Search catalog"), {
      target: { value: "no-such-record" },
    });
    expect(screen.getByText(/No records match/)).toBeTruthy();
    expect(container.querySelectorAll(".station").length).toBe(2);
    await waitFor(() =>
      expect(container.querySelectorAll(".map-point").length).toBe(0),
    );
  });
  it("offers keyboard stack inspection without fabricating positions", async () => {
    render(<App />);
    await screen.findByText("2,691 placeholders");
    fireEvent.keyDown(
      screen.getByRole("button", { name: /2691 placeholder records/ }),
      { key: "Enter" },
    );
    expect(screen.getByText(/Inspecting 2691 records/)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Show all filtered records" }),
    );
    expect(screen.getByText("1–10 of 2,715")).toBeTruthy();
  });
  it("links to real complete-catalog artifacts", async () => {
    render(<App />);
    await screen.findByText("2,691 placeholders");
    for (const [file, title] of downloads) {
      const link = screen.getByRole("link", { name: title });
      expect(link.getAttribute("href")).toBe(`/data/${file}`);
      expect(link.hasAttribute("download")).toBe(true);
      expect(existsSync(`public/data/${file}`)).toBe(true);
    }
  });
});
