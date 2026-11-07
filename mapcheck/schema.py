FIELDS = [
    "event_id",
    "event_time",
    "latitude",
    "longitude",
    "depth_km",
    "author",
    "catalog",
    "contributor",
    "contributor_id",
    "mag_type",
    "magnitude",
    "mag_author",
    "event_location_name",
    "event_type",
    "event_type_short",
]
SCHEMA_VERSION = "1.0.0"


def validate_schema(columns):
    absent = set(FIELDS) - set(columns)
    if absent:
        raise ValueError(
            "Invalid schema; missing columns: " + ", ".join(sorted(absent))
        )
