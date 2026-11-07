"""JSON-facing types. Source values are retained separately from derived fields."""

from typing import Literal, TypedDict

LocationStatus = Literal[
    "PLACEHOLDER_LOCATION",
    "NON_DEFAULT_LOCATION",
    "MISSING_LOCATION",
    "INVALID_LOCATION",
]


class NormalizedEvent(TypedDict):
    row_id: str
    event_id: str
    event_time: str | None
    latitude: float | str | None
    longitude: float | str | None
    source: dict
    magnitude: float | None
    depth_km: float | None
    parsed_latitude: float | None
    parsed_longitude: float | None
    location_status: LocationStatus
    location_reason_code: str
    audit_explanation: str
    recommended_action: str
    naive_non_null_eligible: bool
    naive_map_eligible: bool
    audited_map_eligible: bool
    plottable_as_epicenter: bool
    validation_findings: list[str]
