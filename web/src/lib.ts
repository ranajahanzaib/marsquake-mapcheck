import type { CatalogEvent, Status } from "./types";
export const labels: Record<Status, string> = {
  PLACEHOLDER_LOCATION: "Placeholder",
  NON_DEFAULT_LOCATION: "Non-default",
  MISSING_LOCATION: "Missing",
  INVALID_LOCATION: "Invalid",
};
export const project = (lat: number, lon: number): [number, number] => [
  ((lon + 180) / 360) * 720,
  ((90 - lat) / 180) * 360,
];
export interface Filters {
  search: string;
  type: string;
  status: string;
  from: string;
  to: string;
  min: string;
}
export const emptyFilters: Filters = {
  search: "",
  type: "",
  status: "",
  from: "",
  to: "",
  min: "",
};
export function filterEvents(events: CatalogEvent[], f: Filters) {
  const query = f.search.trim().toLowerCase();
  return events.filter(
    (e) =>
      (!query ||
        `${e.event_id} ${e.contributor_id ?? ""}`
          .toLowerCase()
          .includes(query)) &&
      (!f.type || e.event_type === f.type) &&
      (!f.status || e.location_status === f.status) &&
      (!f.from || (!!e.event_time && e.event_time.slice(0, 10) >= f.from)) &&
      (!f.to || (!!e.event_time && e.event_time.slice(0, 10) <= f.to)) &&
      (f.min === "" || (e.magnitude !== null && e.magnitude >= Number(f.min))),
  );
}
export function groups(events: CatalogEvent[], audited: boolean) {
  const result = new Map<string, CatalogEvent[]>();
  for (const e of events)
    if (audited ? e.audited_map_eligible : e.naive_map_eligible) {
      const key = `${e.parsed_latitude},${e.parsed_longitude}`;
      result.set(key, [...(result.get(key) ?? []), e]);
    }
  return [...result.values()];
}
export const downloads = [
  ["audit.csv", "Full CSV audit"],
  ["audit-summary.json", "JSON summary"],
  ["audit-report.md", "Readable report"],
  ["dataset-manifest.json", "Provenance manifest"],
];
export const dataUrl = (file: string) =>
  `${import.meta.env.BASE_URL}data/${file}`;
export const formatNumber = (n: number) => n.toLocaleString("en-US");
export const coverage = (n: number, d: number) =>
  d ? `${((100 * n) / d).toFixed(2)}%` : "Unavailable";
export const selectedEvent = (events: CatalogEvent[], id: string | null) =>
  events.find((e) => e.row_id === id) ?? events[0] ?? null;
