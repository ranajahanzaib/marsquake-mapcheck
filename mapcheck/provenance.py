import hashlib
from datetime import UTC, datetime

from . import __version__
from .classify import DEFAULT_LATITUDE, DEFAULT_LONGITUDE, RULES_VERSION
from .schema import SCHEMA_VERSION
from .source import DATASET, DOCUMENTATION, SOURCE_URL


def manifest(path, count, revision, remote):
    return {
        "source_dataset": DATASET if remote or revision else "Local catalog input",
        "source_url": SOURCE_URL if remote or revision else None,
        "dataset_revision": revision,
        "retrieval_timestamp_utc": datetime.now(UTC).isoformat(),
        "input_file": path.name,
        "input_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "input_records": count,
        "output_records": count,
        "schema_version": SCHEMA_VERSION,
        "classification_rules_version": RULES_VERSION,
        "placeholder_latitude": DEFAULT_LATITUDE,
        "placeholder_longitude": DEFAULT_LONGITUDE,
        "application_version": __version__,
        "references": [SOURCE_URL, DOCUMENTATION],
        "volatile_metadata": ["retrieval_timestamp_utc"],
        "dataset_license": "CC BY 4.0",
        "dataset_attribution": "Julien Simon; based on InSight SEIS / Marsquake Service via IRIS (EarthScope)",
    }
