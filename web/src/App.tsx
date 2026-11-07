import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ExternalLink,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Filters } from "./lib";
import {
  coverage,
  dataUrl,
  downloads,
  emptyFilters,
  filterEvents,
  formatNumber,
  labels,
  selectedEvent,
} from "./lib";
import MarsMap from "./MarsMap";
import type { CatalogEvent, Summary } from "./types";

function Metric({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric ${accent ? "accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
export default function App() {
  const [events, setEvents] = useState<CatalogEvent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selection, setSelection] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [stack, setStack] = useState<string[] | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all(
      ["events.json", "audit-summary.json"].map((file) =>
        fetch(dataUrl(file)).then((r) => {
          if (!r.ok) throw Error(`Cannot load ${file} (${r.status})`);
          return r.json();
        }),
      ),
    )
      .then(([data, stats]) => {
        if (active) {
          setEvents(data);
          setSummary(stats);
        }
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
  }, []);
  const filtered = useMemo(
    () => filterEvents(events, filters),
    [events, filters],
  );
  const tableRows = useMemo(
    () => (stack ? filtered.filter((e) => stack.includes(e.row_id)) : filtered),
    [filtered, stack],
  );
  const inspected = selectedEvent(tableRows, selection);
  const pageCount = Math.max(1, Math.ceil(tableRows.length / 10));
  const types = useMemo(
    () =>
      [
        ...new Set(
          events.map((e) => e.event_type).filter((v): v is string => !!v),
        ),
      ].sort(),
    [events],
  );
  function update(key: keyof Filters, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
    setStack(null);
  }
  const candidates = filtered.filter((e) => e.audited_map_eligible).length;
  const naive = filtered.filter((e) => e.naive_map_eligible).length;
  const placeholders = filtered.filter(
    (e) => e.location_status === "PLACEHOLDER_LOCATION",
  ).length;
  function inspect(rows: CatalogEvent[]) {
    setSelection(rows[0].row_id);
    setStack(rows.map((e) => e.row_id));
    setPage(0);
    document.getElementById("records")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to comparison
      </a>
      <header className="app-header">
        <a href="#" className="wordmark">
          <Crosshair size={22} />
          <span>
            MARSQUAKE <b>MAPCHECK</b>
          </span>
        </a>
        <span className="header-note">AN INDEPENDENT CATALOG AUDIT</span>
        <a
          className="source-link"
          href="https://huggingface.co/datasets/juliensimon/insight-marsquake-catalog"
          target="_blank"
          rel="noreferrer"
        >
          Dataset source <ExternalLink size={13} />
        </a>
      </header>
      <main id="main">
        <section className="hero">
          <div>
            <p className="eyebrow">
              <span className="status-light" /> INSIGHT / SEIS CATALOG ·
              LOCATION AUDIT 01
            </p>
            <h1>
              Not every coordinate <br />
              is a <em>location.</em>
            </h1>
            <p className="hero-subtitle">
              Where a marsquake is recorded isn't always where it happened.
            </p>
            <p className="hero-copy">
              A dataset can contain coordinates for an event without containing
              a scientifically determined epicenter. One documented default
              changes the map.
            </p>
            <a
              className="primary-link"
              href={dataUrl("audit-report.md")}
              download
            >
              <ArrowDownToLine size={16} /> Download the audit report
            </a>
          </div>
          <aside className="coordinate-note">
            <span className="eyebrow">THE COORDINATE IN QUESTION</span>
            <div>
              4.5024° <span>N</span>
              <br />
              135.6234° <span>E</span>
            </div>
            <p>
              <Crosshair size={16} /> InSight landing site
            </p>
            <small>
              A station reference.
              <br />A default origin.
              <br />
              Not a determined epicenter.
            </small>
          </aside>
        </section>
        {error ? (
          <div role="alert" className="error">
            <h2>Snapshot unavailable</h2>
            <p>{error}</p>
            <p>
              Run the ingestion command in the README, then reload this page.
            </p>
          </div>
        ) : !summary ? (
          <p role="status">Loading the local catalog snapshot…</p>
        ) : (
          <>
            <section
              className="metrics"
              aria-label="Complete catalog statistics"
            >
              <Metric
                label="TOTAL CATALOG RECORDS"
                value={formatNumber(summary.total_records)}
                note="Complete published snapshot"
              />
              <Metric
                label="APPARENT LOCATION COVERAGE"
                value={coverage(summary.naive_map_count, summary.total_records)}
                note={`${formatNumber(summary.naive_map_count)} valid coordinate pairs`}
              />
              <Metric
                label="AUDITED LOCATION COVERAGE"
                value={coverage(
                  summary.audited_map_count,
                  summary.total_records,
                )}
                note={`${summary.audited_map_count} non-default catalog positions`}
                accent
              />
              <Metric
                label="PLACEHOLDER COORDINATES"
                value={formatNumber(summary.status_counts.PLACEHOLDER_LOCATION)}
                note="Records assigned the lander position"
              />
            </section>
            <div className="takeaway">
              <span className="eyebrow">THE FINDING</span>
              <p>
                <strong>
                  {coverage(
                    summary.status_counts.PLACEHOLDER_LOCATION,
                    summary.total_records,
                  )}{" "}
                  of records share the documented default.
                </strong>{" "}
                Coordinate availability dramatically overstates located-event
                coverage.
              </p>
              <ArrowDown size={20} />
            </div>
            <section className="comparison" aria-labelledby="comparison-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">ONE CATALOG. TWO INTERPRETATIONS.</p>
                  <h2 id="comparison-title">
                    Same coordinates. Different conclusions.
                  </h2>
                </div>
                <span className="projection-note">
                  EQUIRECTANGULAR · POSITIVE EAST
                </span>
              </div>
              <form
                className="filters"
                onSubmit={(e) => e.preventDefault()}
                aria-label="Shared map and record filters"
              >
                <label className="search">
                  <span>Search catalog</span>
                  <div>
                    <Search size={15} />
                    <input
                      type="search"
                      value={filters.search}
                      onChange={(e) => update("search", e.target.value)}
                      placeholder="Event ID or InSight name"
                    />
                  </div>
                </label>
                <label>
                  <span>Event type</span>
                  <select
                    value={filters.type}
                    onChange={(e) => update("type", e.target.value)}
                  >
                    <option value="">All event types</option>
                    {types.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Location status</span>
                  <select
                    value={filters.status}
                    onChange={(e) => update("status", e.target.value)}
                  >
                    <option value="">All classifications</option>
                    {Object.entries(labels).map(([s, l]) => (
                      <option key={s} value={s}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>From (UTC)</span>
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => update("from", e.target.value)}
                  />
                </label>
                <label>
                  <span>To (UTC)</span>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => update("to", e.target.value)}
                  />
                </label>
                <label>
                  <span>Min. magnitude</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Any"
                    value={filters.min}
                    onChange={(e) => update("min", e.target.value)}
                  />
                </label>
                <button
                  className="reset"
                  type="button"
                  onClick={() => {
                    setFilters(emptyFilters);
                    setStack(null);
                    setPage(0);
                  }}
                >
                  <RotateCcw size={15} />
                  Reset
                </button>
                <small className="filter-help">
                  Minimum magnitude excludes records with missing magnitude. All
                  filters apply to both maps and the event table.
                </small>
              </form>
              <div
                className="selection-summary"
                role="status"
                aria-live="polite"
              >
                <span>
                  ACTIVE SELECTION{" "}
                  <b>{formatNumber(filtered.length)} records</b>
                </span>
                <span>
                  {formatNumber(naive)} naive · <b>{candidates} audited</b> ·{" "}
                  {formatNumber(placeholders)} placeholders
                </span>
                <span>
                  Coverage: {coverage(naive, filtered.length)} apparent →{" "}
                  {coverage(candidates, filtered.length)} audited
                </span>
              </div>
              <div className="map-comparison">
                <MarsMap
                  events={filtered}
                  audited={false}
                  selected={inspected?.row_id ?? null}
                  onSelect={inspect}
                />
                <MarsMap
                  events={filtered}
                  audited
                  selected={inspected?.row_id ?? null}
                  onSelect={inspect}
                />
              </div>
              <div className="map-difference">
                <span className="difference-symbol">≠</span>
                <div>
                  <h3>What's different?</h3>
                  <p>
                    The large stack at InSight represents repeated default
                    coordinates, not a physical cluster of epicenters. Excluding
                    that exact pair leaves {candidates} candidate located
                    records in this selection. The crosshair remains: it marks
                    the station independently.
                  </p>
                </div>
              </div>
            </section>
            <section id="records" className="records-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">FOLLOW THE EVIDENCE</p>
                  <h2>Inspect the catalog.</h2>
                </div>
                <span className="projection-note">SOURCE VALUES PRESERVED</span>
              </div>
              <div className="records-layout">
                <div className="event-table-wrap">
                  {stack && (
                    <div className="stack-notice">
                      Inspecting {tableRows.length} records at a selected
                      coordinate.
                      <button
                        onClick={() => {
                          setStack(null);
                          setPage(0);
                        }}
                      >
                        Show all filtered records
                      </button>
                    </div>
                  )}
                  <div className="table-scroll">
                    <table>
                      <caption className="sr-only">
                        Filtered catalog records. Select an event to read its
                        audit.
                      </caption>
                      <thead>
                        <tr>
                          <th>Event / InSight name</th>
                          <th>Date (UTC)</th>
                          <th>Magnitude</th>
                          <th>Location status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.slice(page * 10, page * 10 + 10).map((e) => (
                          <tr
                            key={e.row_id}
                            className={
                              inspected?.row_id === e.row_id ? "active-row" : ""
                            }
                          >
                            <td>
                              <button
                                className="event-select"
                                aria-label={`Inspect ${e.event_id} (${e.contributor_id ?? "unnamed"})`}
                                onClick={() => setSelection(e.row_id)}
                                aria-pressed={inspected?.row_id === e.row_id}
                              >
                                {e.event_id}
                                <small>
                                  {e.contributor_id ?? "Not supplied"}
                                </small>
                              </button>
                            </td>
                            <td>
                              {e.event_time?.slice(0, 10) ?? "Unavailable"}
                            </td>
                            <td>
                              {e.magnitude === null
                                ? "Not reported"
                                : `${e.magnitude} ${e.mag_type ?? ""}`}
                            </td>
                            <td>
                              <span
                                className={`status-badge ${e.location_status}`}
                              >
                                {labels[e.location_status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!tableRows.length && (
                      <p className="empty-state">
                        No records match this selection. Reset or adjust the
                        filters.
                      </p>
                    )}
                  </div>
                  <div className="pagination">
                    <span>
                      {tableRows.length
                        ? `${page * 10 + 1}–${Math.min((page + 1) * 10, tableRows.length)} of ${formatNumber(tableRows.length)}`
                        : "0 records"}
                    </span>
                    <div>
                      <button
                        aria-label="Previous page"
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span>
                        {page + 1} / {pageCount}
                      </span>
                      <button
                        aria-label="Next page"
                        disabled={page + 1 >= pageCount}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <aside
                  className="inspector"
                  aria-label="Selected event details"
                  aria-live="polite"
                >
                  {inspected ? (
                    <>
                      <p className="eyebrow">RECORD INSPECTOR</p>
                      <h3>{inspected.event_id}</h3>
                      <span
                        className={`status-badge ${inspected.location_status}`}
                      >
                        {labels[inspected.location_status]}
                      </span>
                      <dl>
                        <dt>InSight name</dt>
                        <dd>{inspected.contributor_id ?? "Not supplied"}</dd>
                        <dt>Time / UTC</dt>
                        <dd>{inspected.event_time ?? "Unavailable"}</dd>
                        <dt>Signal type</dt>
                        <dd>{inspected.event_type ?? "Not supplied"}</dd>
                        <dt>Magnitude</dt>
                        <dd>
                          {inspected.magnitude === null
                            ? "Not reported"
                            : `${inspected.magnitude} ${inspected.mag_type ?? ""}`}
                        </dd>
                        <dt>Original latitude</dt>
                        <dd>
                          {String(inspected.source.latitude ?? "Not supplied")}°
                        </dd>
                        <dt>Original longitude</dt>
                        <dd>
                          {String(inspected.source.longitude ?? "Not supplied")}
                          °
                        </dd>
                        <dt>Reported region</dt>
                        <dd>
                          {inspected.event_location_name ?? "Not supplied"}
                        </dd>
                      </dl>
                      <div className="audit-reason">
                        <small>{inspected.location_reason_code}</small>
                        <p>{inspected.audit_explanation}</p>
                      </div>
                      <p className="recommendation">
                        {inspected.recommended_action}
                      </p>
                    </>
                  ) : (
                    <p>No event selected.</p>
                  )}
                </aside>
              </div>
            </section>
            <section className="explanation">
              <div>
                <p className="eyebrow">PROVENANCE BEFORE POSITION</p>
                <h2>Why the default exists.</h2>
                <p>
                  InSight operated a single seismic station on Mars. Many
                  signals lack the distance and back-azimuth information needed
                  to calculate a location. But QuakeML requires origin
                  coordinates.
                </p>
                <p>
                  The Marsquake Service assigns the lander's coordinates to
                  events without computed epicenters. A naive importer turns
                  that structural requirement into a misleading map.
                </p>
                <a
                  href="https://service.earthscope.org/irisws/mars-event/docs/1/help/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the upstream documentation <ExternalLink size={14} />
                </a>
              </div>
              <div className="methodology">
                <h3>A coordinate is a claim. Check its provenance.</h3>
                <ol>
                  <li>
                    <span>01</span>Missing coordinate? <b>Unlocated.</b>
                  </li>
                  <li>
                    <span>02</span>Malformed or out of range? <b>Invalid.</b>
                  </li>
                  <li>
                    <span>03</span>Exact lander pair? <b>Placeholder.</b>
                  </li>
                  <li>
                    <span>04</span>Valid, different pair?{" "}
                    <b>Candidate location.</b>
                  </li>
                </ol>
                <details>
                  <summary>Methodology & scientific limitations</summary>
                  <p>
                    Rules v{summary.snapshot.classification_rules_version}:
                    numeric equality to (4.5024, 135.6234), with no radius or
                    tolerance. Longitude must be −180° to +180°, positive east;
                    latitude is planetocentric. Both maps use the same global
                    projection and USGS MOLA raster.
                  </p>
                  <p>
                    The dataset has no dedicated location-quality or uncertainty
                    fields. Non-default positions are not independently
                    verified. Signal type, magnitude and region names are not
                    location evidence. Not every catalog entry is a confirmed
                    tectonic marsquake. A real event exactly at the default pair
                    cannot be distinguished with these fields.
                  </p>
                  <p>
                    The dataset card's latitude.notna() example establishes
                    coordinate presence, not determined locations. The audit
                    preserves all source rows and coordinates.
                  </p>
                </details>
              </div>
            </section>
            <section className="downloads">
              <div>
                <p className="eyebrow">REPRODUCE THE FINDING</p>
                <h2>Take the evidence with you.</h2>
                <p>
                  Complete-catalog reports. Current filters do not change these
                  files.
                </p>
              </div>
              <div className="download-links">
                {downloads.map(([file, title]) => (
                  <a
                    key={file}
                    href={dataUrl(file)}
                    download
                    aria-label={title}
                  >
                    <span>
                      {title}
                      <small>{file}</small>
                    </span>
                    <ArrowDownToLine size={18} />
                  </a>
                ))}
              </div>
            </section>
            <div className="provenance">
              <span>
                SNAPSHOT{" "}
                <code>
                  {summary.snapshot.dataset_revision?.slice(0, 12) ??
                    "Local source"}
                </code>
              </span>
              <span>
                RETRIEVED{" "}
                {summary.snapshot.retrieval_timestamp_utc.slice(0, 10)} UTC
              </span>
              <a href={dataUrl("dataset-manifest.json")} download>
                View provenance <ArrowRight size={13} />
              </a>
            </div>
          </>
        )}
      </main>
      <footer>
        <div className="footer-brand">
          <Crosshair size={20} />
          <span>
            MARSQUAKE MAPCHECK
            <small>Valid structures. Careful interpretations.</small>
          </span>
        </div>
        <p>
          Dataset:{" "}
          <a href="https://huggingface.co/datasets/juliensimon/insight-marsquake-catalog">
            Julien Simon / InSight Marsquake Catalog
          </a>{" "}
          · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>
          <br />
          Derived from InSight SEIS / MQS via IRIS (EarthScope). Classification
          and visualization added.
          <br />
          Basemap:{" "}
          <a href="https://astrogeology.usgs.gov/search/map/mars_mgs_mola_global_color_shaded_relief_463m">
            USGS / NASA MGS MOLA
          </a>{" "}
          · Public domain. Code: MIT.
          <br />
          Independent research software. No NASA, USGS or MQS endorsement.
        </p>
      </footer>
    </>
  );
}
