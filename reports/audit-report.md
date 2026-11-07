# Marsquake MapCheck — Dataset Location Audit

## Executive Summary

Of 2,715 catalog records, 2,691 carry the documented lander default. Apparent location coverage is 100.00%; audited coverage is 0.88% (24 valid non-default positions). These positions are candidates, not independently verified epicenters.

## Dataset Provenance

Source: juliensimon/insight-marsquake-catalog (https://huggingface.co/datasets/juliensimon/insight-marsquake-catalog).
Revision: 6a14e70827fe23f9b2e31609ddcecce9d3219de4.
Input SHA-256: `bf75d75d984f973d7ac9ae330905cc7192ee5682f94750088ec3a9febd3cce8a`.
Rules: 1.0.0; schema: 1.0.0.
Retrieval timestamp is recorded separately in dataset-manifest.json and is volatile.

## Methodology

Missing coordinates take precedence over invalid coordinates, followed by exact numeric equality to latitude 4.5024 and longitude 135.6234, followed by valid non-default pairs. Latitude must be within ±90 and longitude within ±180, positive east; latitude is planetocentric. No radius or numerical tolerance is used. Source coordinates remain unchanged. Non-finite source numbers are represented as strings in JSON with parsed values null. Actual source nulls remain null.

## Results

| Classification | Records |
| --- | ---: |
| PLACEHOLDER_LOCATION | 2,691 |
| NON_DEFAULT_LOCATION | 24 |
| MISSING_LOCATION | 0 |
| INVALID_LOCATION | 0 |

Valid coordinate pairs: 2,715. Naive non-null importer count: 2,715. Audited exclusions: 2,691. Relative reduction in apparent coverage: 99.12%.
Duplicate identifiers: {}. Invalid or missing event times: 0.

## Misleading Location Pattern

The dataset card labels 2,715 rows as having location estimates and demonstrates latitude.notna() as a located-event check. Coordinate presence alone cannot establish a determined position. The repeated lander pair must not be interpreted as a physical epicenter cluster. This audit derives all counts from its input rather than assuming the card's count.

## Scientific Interpretation

MQS documents that QuakeML requires origin coordinates and assigns the lander position to events lacking computed locations. Non-default locations are candidate computed positions under this convention, with unspecified uncertainty in this derivative dataset. Event type, magnitude, and region name do not determine location eligibility.

## Limitations

No location-quality or uncertainty fields are available in this dataset. No independent seismological verification, waveform analysis, or physical interpretation of signal types is performed. Not all catalog entries are independently confirmed tectonic marsquakes. A real event exactly at the default pair cannot be distinguished using these fields alone. Invalid dates are retained and flagged. Duplicate IDs are reported without removing rows.

## Reproduction Instructions

Run `uv sync --locked`, then `uv run python -m mapcheck ingest --input data/source/insight_marsquakes.parquet --revision 6a14e70827fe23f9b2e31609ddcecce9d3219de4`. Reports and normalized events are deterministic for identical input and provenance, except the explicitly volatile retrieval timestamp in the manifest and summary snapshot metadata. Remote refresh: `uv run python -m mapcheck ingest`.

## Source Attribution

Julien Simon, InSight Marsquake Catalog (2026), CC BY 4.0: https://huggingface.co/datasets/juliensimon/insight-marsquake-catalog . Derived from NASA InSight SEIS / Marsquake Service via IRIS (EarthScope). Changes: normalization, coordinate classification, summaries and visualization.
MQS documentation: https://service.earthscope.org/irisws/mars-event/docs/1/help/ .
Original application code is MIT; this does not relicense scientific data or imagery. No endorsement is implied.
