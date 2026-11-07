"""Pure classification; numeric equality, never a spatial radius."""

import math
from typing import Any

DEFAULT_LATITUDE = 4.5024
DEFAULT_LONGITUDE = 135.6234
RULES_VERSION = "1.0.0"
STATUSES = (
    "PLACEHOLDER_LOCATION",
    "NON_DEFAULT_LOCATION",
    "MISSING_LOCATION",
    "INVALID_LOCATION",
)
DETAILS = {
    "PLACEHOLDER_LOCATION": (
        "MQS_LANDER_DEFAULT",
        "These coordinates identify the InSight lander, not a determined epicenter.",
        "Preserve the original coordinates for provenance, but exclude them from physical epicenter mapping.",
    ),
    "NON_DEFAULT_LOCATION": (
        "VALID_NON_DEFAULT",
        "The published catalog supplies non-default coordinates. Location uncertainty has not been independently assessed by this tool.",
        "Eligible for catalog-derived epicenter mapping; location uncertainty remains unspecified in this dataset.",
    ),
    "MISSING_LOCATION": (
        "COORDINATE_MISSING",
        "At least one coordinate is absent or empty.",
        "Retain the record; geographical plotting is unavailable.",
    ),
    "INVALID_LOCATION": (
        "COORDINATE_INVALID",
        "At least one coordinate is malformed, non-finite, or outside latitude ±90 / longitude ±180 degrees.",
        "Retain source values and verify coordinates upstream before mapping.",
    ),
}


def missing(value: Any) -> bool:
    return value is None or isinstance(value, str) and not value.strip()


def number(value: Any) -> float | None:
    if isinstance(value, bool) or missing(value):
        return None
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (TypeError, ValueError, OverflowError):
        return None


def classify_location(event: dict) -> dict:
    lat, lon = event.get("latitude"), event.get("longitude")
    a, b = number(lat), number(lon)
    if missing(lat) or missing(lon):
        status = "MISSING_LOCATION"
    elif a is None or b is None or not -90 <= a <= 90 or not -180 <= b <= 180:
        status = "INVALID_LOCATION"
    elif (a, b) == (DEFAULT_LATITUDE, DEFAULT_LONGITUDE):
        status = "PLACEHOLDER_LOCATION"
    else:
        status = "NON_DEFAULT_LOCATION"
    code, explanation, action = DETAILS[status]
    valid = status in STATUSES[:2]
    return {
        "location_status": status,
        "location_reason_code": code,
        "audit_explanation": explanation,
        "recommended_action": action,
        "naive_non_null_eligible": not missing(lat) and not missing(lon),
        "naive_map_eligible": valid,
        "audited_map_eligible": status == "NON_DEFAULT_LOCATION",
        "plottable_as_epicenter": status == "NON_DEFAULT_LOCATION",
        "parsed_latitude": a,
        "parsed_longitude": b,
    }
