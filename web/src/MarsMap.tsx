import { Crosshair } from "lucide-react";
import { groups, project, formatNumber } from "./lib";
import type { CatalogEvent } from "./types";

export function Station() {
  const [x, y] = project(4.5024, 135.6234);
  return (
    <g
      className="station"
      aria-label="InSight reference station at 4.5024 north, 135.6234 east"
    >
      <title>InSight station · 4.5024° N, 135.6234° E</title>
      <path d={`M${x - 11},${y}h22 M${x},${y - 11}v22`} />
      <rect x={x - 4} y={y - 4} width="8" height="8" />
      <text x={x - 8} y={y + 28} textAnchor="end">
        InSight
      </text>
    </g>
  );
}
export default function MarsMap({
  events,
  audited,
  onSelect,
  selected,
}: {
  events: CatalogEvent[];
  audited: boolean;
  onSelect: (rows: CatalogEvent[]) => void;
  selected: string | null;
}) {
  const clusters = groups(events, audited);
  const count = clusters.reduce((n, g) => n + g.length, 0);
  return (
    <article className={`map-panel ${audited ? "audited" : "naive"}`}>
      <div className="map-heading">
        <div>
          <span className="eyebrow">
            {audited
              ? "02 / AFTER CLASSIFICATION"
              : "01 / BEFORE CLASSIFICATION"}
          </span>
          <h2>{audited ? "Audited locations" : "Naive import"}</h2>
        </div>
        <span className="map-count">
          {formatNumber(count)}
          <small>mapped records</small>
        </span>
      </div>
      <p className="map-description">
        {audited
          ? "Documented placeholders are excluded. Only valid non-default catalog positions remain."
          : "Every event with valid coordinates is plotted as though its position were determined."}
      </p>
      <svg
        className="mars-map"
        viewBox="0 0 720 400"
        role="group"
        aria-label={`${audited ? "Audited" : "Naive"} global Mars map: ${count} records at ${clusters.length} coordinate pairs. Use the event table for full keyboard-accessible details.`}
      >
        <defs>
          <clipPath id={audited ? "clip-a" : "clip-n"}>
            <rect width="720" height="360" />
          </clipPath>
        </defs>
        <rect width="720" height="360" fill="#272422" />
        <image
          href={`${import.meta.env.BASE_URL}maps/mola.jpg`}
          width="720"
          height="360"
          preserveAspectRatio="none"
          className="basemap"
        />
        <g className="grid">
          {[-120, -60, 0, 60, 120].map((lon) => (
            <line
              key={lon}
              x1={project(0, lon)[0]}
              x2={project(0, lon)[0]}
              y1="0"
              y2="360"
            />
          ))}
          {[-60, -30, 0, 30, 60].map((lat) => (
            <line
              key={lat}
              x1="0"
              x2="720"
              y1={project(lat, 0)[1]}
              y2={project(lat, 0)[1]}
            />
          ))}
        </g>
        <g className="map-labels">
          <text x="10" y="18">
            90° N
          </text>
          <text x="10" y="177">
            0°
          </text>
          <text x="10" y="349">
            90° S
          </text>
          {[-180, -90, 0, 90, 180].map((lon, i) => (
            <text
              key={lon}
              x={Math.max(12, Math.min(708, project(0, lon)[0]))}
              y="383"
              textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}
            >
              {lon === 0 ? "0°" : `${Math.abs(lon)}° ${lon < 0 ? "W" : "E"}`}
            </text>
          ))}
        </g>
        <g clipPath={`url(#${audited ? "clip-a" : "clip-n"})`}>
          {clusters.map((rows) => {
            const e = rows[0];
            const [x, y] = project(e.parsed_latitude!, e.parsed_longitude!);
            const placeholder = e.location_status === "PLACEHOLDER_LOCATION";
            return (
              <g
                key={`${x},${y}`}
                className={`map-point ${placeholder ? "placeholder" : "candidate"} ${rows.some((r) => r.row_id === selected) ? "selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`${rows.length} ${placeholder ? "placeholder" : "non-default"} records at ${e.latitude}, ${e.longitude}. Inspect records.`}
                onClick={() => onSelect(rows)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    onSelect(rows);
                  }
                }}
              >
                <title>
                  {e.event_id}
                  {rows.length > 1
                    ? ` + ${rows.length - 1} records`
                    : ""} · {e.latitude}, {e.longitude}
                </title>
                <circle
                  className="hit-target"
                  cx={x}
                  cy={y}
                  r={placeholder ? 26 : 11}
                />
                {placeholder ? (
                  <>
                    <circle className="stack-ring" cx={x} cy={y} r="25" />
                    <circle cx={x} cy={y} r="17" />
                    <text
                      x={x}
                      y={y - 35}
                      textAnchor="middle"
                      className="stack-label"
                    >
                      {formatNumber(rows.length)} placeholders
                    </text>
                  </>
                ) : (
                  <circle cx={x} cy={y} r={rows.length > 1 ? 6 : 4} />
                )}
              </g>
            );
          })}
        </g>
        <Station />
      </svg>
      <div className="map-legend">
        {!audited && (
          <span>
            <i className="dot copper" />
            Placeholder stack
          </span>
        )}
        <span>
          <i className="dot mint" />
          Non-default position
        </span>
        <span>
          <Crosshair size={13} />
          InSight station
        </span>
      </div>
      {audited && (
        <p className="map-caution">
          Non-default coordinates do not imply zero location uncertainty.
        </p>
      )}
    </article>
  );
}
