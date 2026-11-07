import math
from datetime import datetime

import pandas as pd

from .classify import classify_location, number
from .model import NormalizedEvent


def json_value(value):
    """Non-finite source numbers are retained as tokens, never invalid JSON."""
    if value is None or value is pd.NA or value is pd.NaT:
        return None
    if isinstance(value, (datetime, pd.Timestamp)):
        return value.isoformat().replace("+00:00", "Z")
    if isinstance(value, float) and not math.isfinite(value):
        return str(value)
    if hasattr(value, "item"):
        return json_value(value.item())
    return value


def normalize(row: dict, index: int) -> NormalizedEvent:
    source = {k: json_value(v) for k, v in row.items()}
    if not isinstance(source.get("event_id"), str) or not source["event_id"].strip():
        raise ValueError(f"Row {index + 1}: event_id must be a nonempty string")
    parsed_time = pd.to_datetime(row.get("event_time"), utc=True, errors="coerce")
    event = dict(source)
    event["source"] = source
    event["row_id"] = f"row-{index + 1}"
    event["event_time"] = (
        None if pd.isna(parsed_time) else parsed_time.isoformat().replace("+00:00", "Z")
    )
    event["magnitude"] = number(row.get("magnitude"))
    event["depth_km"] = number(row.get("depth_km"))
    event["validation_findings"] = (
        [] if event["event_time"] else ["INVALID_OR_MISSING_EVENT_TIME"]
    )
    event.update(classify_location(row))
    return event
