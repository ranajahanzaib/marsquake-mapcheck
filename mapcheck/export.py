import csv
import json
from pathlib import Path

COLUMNS = [
    "event_id",
    "contributor_id",
    "event_time",
    "latitude",
    "longitude",
    "event_type",
    "magnitude",
    "location_status",
    "location_reason_code",
    "naive_map_eligible",
    "audited_map_eligible",
    "audit_explanation",
    "recommended_action",
]


def write_json(path, value):
    path.write_text(
        json.dumps(
            value,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        + "\n",
        encoding="utf-8",
    )


def report(summary, manifest):
    n = summary["total_records"]
    apparent = summary["apparent_location_coverage"]
    audited = summary["audited_location_coverage"]
    fmt = lambda v: "unavailable" if v is None else f"{v:.2f}%"
    statuses = "\n".join(
        f"| {k} | {v:,} |" for k, v in summary["status_counts"].items()
    )
    return f"""# Marsquake MapCheck — Dataset Location Audit

## Executive Summary

Of {n:,} catalog records, {summary["status_counts"]["PLACEHOLDER_LOCATION"]:,} carry the documented lander default. Apparent location coverage is {fmt(apparent)}; audited coverage is {fmt(audited)} ({summary["audited_map_count"]:,} valid non-default positions). These positions are candidates, not independently verified epicenters.

## Dataset Provenance

Source: {manifest["source_dataset"]} ({manifest["source_url"] or "local input"}).
Revision: {manifest["dataset_revision"] or "unavailable"}.
Input SHA-256: `{manifest["input_sha256"]}`.
Rules: {manifest["classification_rules_version"]}; schema: {manifest["schema_version"]}.
Retrieval timestamp is recorded separately in dataset-manifest.json and is volatile.

## Methodology

Missing coordinates take precedence over invalid coordinates, followed by exact numeric equality to latitude 4.5024 and longitude 135.6234, followed by valid non-default pairs. Latitude must be within ±90 and longitude within ±180, positive east; latitude is planetocentric. No radius or numerical tolerance is used. Source coordinates remain unchanged. Non-finite source numbers are represented as strings in JSON with parsed values null. Actual source nulls remain null.

## Results

| Classification | Records |
| --- | ---: |
{statuses}

Valid coordinate pairs: {summary["valid_coordinate_pairs"]:,}. Naive non-null importer count: {summary["naive_non_null_count"]:,}. Audited exclusions: {summary["excluded_count"]:,}. Relative reduction in apparent coverage: {fmt(summary["coverage_reduction_percent"])}.
Duplicate identifiers: {json.dumps(summary["duplicate_event_ids"])}. Invalid or missing event times: {summary["invalid_event_time_count"]}.

## Misleading Location Pattern

The dataset card labels 2,715 rows as having location estimates and demonstrates latitude.notna() as a located-event check. Coordinate presence alone cannot establish a determined position. The repeated lander pair must not be interpreted as a physical epicenter cluster. This audit derives all counts from its input rather than assuming the card's count.

## Scientific Interpretation

MQS documents that QuakeML requires origin coordinates and assigns the lander position to events lacking computed locations. Non-default locations are candidate computed positions under this convention, with unspecified uncertainty in this derivative dataset. Event type, magnitude, and region name do not determine location eligibility.

## Limitations

No location-quality or uncertainty fields are available in this dataset. No independent seismological verification, waveform analysis, or physical interpretation of signal types is performed. Not all catalog entries are independently confirmed tectonic marsquakes. A real event exactly at the default pair cannot be distinguished using these fields alone. Invalid dates are retained and flagged. Duplicate IDs are reported without removing rows.

## Reproduction Instructions

Run `uv sync --locked`, then `uv run python -m mapcheck ingest --input data/source/insight_marsquakes.parquet --revision {manifest["dataset_revision"] or "REVISION"}`. Reports and normalized events are deterministic for identical input and provenance, except the explicitly volatile retrieval timestamp in the manifest and summary snapshot metadata. Remote refresh: `uv run python -m mapcheck ingest`.

## Source Attribution

Julien Simon, InSight Marsquake Catalog (2026), CC BY 4.0: https://huggingface.co/datasets/juliensimon/insight-marsquake-catalog . Derived from NASA InSight SEIS / Marsquake Service via IRIS (EarthScope). Changes: normalization, coordinate classification, summaries and visualization.
MQS documentation: https://service.earthscope.org/irisws/mars-event/docs/1/help/ .
Original application code is MIT; this does not relicense scientific data or imagery. No endorsement is implied.
"""


def export_audit(events, summary, manifest, output_directory):
    out = Path(output_directory)
    out.mkdir(parents=True, exist_ok=True)
    with (out / "audit.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        for e in events:
            row = {k: e.get(k) for k in COLUMNS}
            for k in ("latitude", "longitude", "event_time", "magnitude"):
                row[k] = e["source"].get(k)
            writer.writerow(row)
    write_json(out / "audit-summary.json", {**summary, "snapshot": manifest})
    write_json(out / "dataset-manifest.json", manifest)
    (out / "audit-report.md").write_text(report(summary, manifest), encoding="utf-8")
