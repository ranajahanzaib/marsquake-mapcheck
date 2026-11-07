from collections import Counter, defaultdict

from .classify import STATUSES
from .model import NormalizedEvent
from .normalize import normalize


def audit_catalog(rows: list[dict]) -> list[NormalizedEvent]:
    events = [normalize(row, i) for i, row in enumerate(rows)]
    counts = Counter(e["event_id"] for e in events)
    for e in events:
        if counts[e["event_id"]] > 1:
            e["validation_findings"].append("DUPLICATE_EVENT_ID")
    return events


def summarize_audit(events: list[NormalizedEvent]) -> dict:
    total = len(events)
    status = {key: sum(e["location_status"] == key for e in events) for key in STATUSES}
    naive = sum(e["naive_map_eligible"] for e in events)
    audited = sum(e["audited_map_eligible"] for e in events)
    percent = lambda n: 100 * n / total if total else None
    pairs = Counter(
        (e["parsed_latitude"], e["parsed_longitude"])
        for e in events
        if e["naive_map_eligible"]
    )
    by_type = defaultdict(Counter)
    for e in events:
        by_type[e.get("event_type") or "UNSPECIFIED"][e["location_status"]] += 1
    ids = Counter(e["event_id"] for e in events)
    return {
        "total_records": total,
        "status_counts": status,
        "valid_coordinate_pairs": naive,
        "naive_non_null_count": sum(e["naive_non_null_eligible"] for e in events),
        "naive_map_count": naive,
        "audited_map_count": audited,
        "excluded_count": total - audited,
        "placeholder_percent": percent(status["PLACEHOLDER_LOCATION"]),
        "apparent_location_coverage": percent(naive),
        "audited_location_coverage": percent(audited),
        "coverage_reduction_percent": 100 * (naive - audited) / naive
        if naive
        else None,
        "coordinate_pair_frequencies": [
            {"latitude": a, "longitude": b, "count": n}
            for (a, b), n in sorted(pairs.items(), key=lambda p: (-p[1], p[0]))
        ],
        "counts_by_event_type": dict(sorted(by_type.items())),
        "duplicate_event_ids": {k: v for k, v in sorted(ids.items()) if v > 1},
        "invalid_event_time_count": sum(e["event_time"] is None for e in events),
    }
