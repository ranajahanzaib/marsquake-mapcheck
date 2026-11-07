# Methodology

## Source facts

The [Marsquake Service documentation](https://service.earthscope.org/irisws/mars-event/docs/1/help/) states in “Location Search” that events without computed locations receive the InSight lander coordinates (4.5024, 135.6234) because valid QuakeML origins require a location. Single-station location estimates can carry substantial uncertainty. Longitude increases eastward and latitude is planetocentric.

The [Julien Simon derivative dataset](https://huggingface.co/datasets/juliensimon/insight-marsquake-catalog) exposes 15 fields. It contains no dedicated location-quality, distance, back-azimuth or uncertainty columns, even though such information can occur upstream in QuakeML. The bundled dataset card documents its schema and license. Its “2,715 with location estimates” claim and `latitude.notna()` usage example do not establish independent event locations.

## Classification assumptions

Rules version 1.0.0 assigns exactly one primary status, in this order:

1. `MISSING_LOCATION`: either original coordinate is null, absent, or an empty/whitespace string.
2. `INVALID_LOCATION`: either coordinate cannot be parsed as a finite number, is a boolean, or lies outside latitude [−90, 90] or longitude [−180, 180]. There is no silent longitude wrapping.
3. `PLACEHOLDER_LOCATION`: the parsed pair is numerically equal to (4.5024, 135.6234). No spatial radius, rounding, or floating-point tolerance is used.
4. `NON_DEFAULT_LOCATION`: every other valid pair. These are candidate computed locations under the documented convention, not independently verified epicenters.

Normal numeric parsing accepts numeric strings and scientific notation. Missing takes precedence even when the other coordinate is invalid. A NaN or infinity token is invalid, never a missing coordinate. Parquet nulls are detected through Arrow rather than conflated with numeric NaN by a pandas conversion. CSV is read as strings with empty fields preserved. Missing magnitude or depth has no effect on location status.

## Derived computations

All input rows are retained in input order, including duplicate event IDs. A row-based identifier provides unique selection identity within a snapshot; the upstream event ID remains intact. Duplicate IDs and invalid/missing times are flagged separately. Times are normalized to UTC; an invalid time is null and flagged. Source metadata remains available in each event's `source` object. No event type or region name is used to infer location.

- Apparent coverage = valid coordinate pairs / all records × 100.
- Audited coverage = valid non-default pairs / all records × 100.
- Relative reduction = (naive map count − audited map count) / naive map count × 100.
- Placeholder percentage = exact-default rows / all records × 100.
- The non-null importer count is also recorded separately: mere presence can include malformed coordinates. The maps require valid coordinates.
- Empty denominators produce null (unavailable), not fabricated zero coverage.
- Coordinate frequencies and classification counts by signal type derive from the same normalized rows.

The downloaded Parquet, source revision, SHA-256, application/rules/schema versions and record counts are retained. Local `--revision` is an explicit provenance assertion supplied by the operator, not a remote verification of a local file. Without that argument a local input is labelled as local and has no asserted remote revision. Local manifest timestamp records processing/retrieval of the supplied file; it does not prove when someone originally downloaded it.

Reports and normalized data are byte-deterministic for identical input and provenance, except `retrieval_timestamp_utc` in the manifest and its nested copy in the JSON summary. The Markdown report intentionally omits that volatile timestamp. JSON never contains bare NaN or Infinity: original non-finite numeric values become explicit strings, parsed values become null, and classification retains the validation finding. The preserved input file remains the byte-exact source of record. CSV uses original coordinate and measurement values.

## Visualization

Both maps share a 720 × 360 coordinate plane, global extent and projection:

```
x = (longitude + 180) / 360 * 720
y = (90 - latitude) / 180 * 360
```

The genuine USGS MOLA sample is global, north-up, −180° to +180°, positive east. It is a simple cylindrical raster with a 2:1 aspect ratio; it is stretched to exactly this plane, with no cropping or longitude shift. CSS reduces saturation and brightness equally in both panels. The backdrop is relief context, not a quantitative elevation legend.

Repeated pairs are aggregated at their exact source coordinate. Markers are symbols, not geographical uncertainty bounds; their screen radius has no physical meaning. The station crosshair is a separate reference layer on both maps, even when filters return no events. It is not counted as an epicenter. Nearby markers may overlap at this global scale; the searchable paginated table offers access to every record without inventing spatial separation. Non-default points share one style and do not encode magnitude or confidence.

Complete-catalog headline metrics and downloads stay fixed. Selection metrics, both map layers, stack counts, the inspector collection, and the table share the same filters. A minimum magnitude explicitly excludes missing magnitudes. Date endpoints are inclusive UTC calendar dates; a record with an invalid date cannot match an active date bound. Selecting a map marker scopes the table to that exact pair within the current filter selection; “Show all filtered records” restores it. Changing filters clears that temporary scope.

## Scientific limitations

See [scientific-limitations.md](scientific-limitations.md). The rule identifies a documented serialization convention. It cannot prove physical origin or independently establish location confidence.
