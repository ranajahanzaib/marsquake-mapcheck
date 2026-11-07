import csv
import json
from pathlib import Path

import pytest

from mapcheck.audit import audit_catalog, summarize_audit
from mapcheck.classify import classify_location
from mapcheck.cli import main
from mapcheck.export import export_audit
from mapcheck.provenance import manifest
from mapcheck.source import read_source


@pytest.mark.parametrize(
    "lat,lon,status",
    [
        (4.5024, 135.6234, "PLACEHOLDER_LOCATION"),
        ("4.5024", "135.6234", "PLACEHOLDER_LOCATION"),
        (-7.734646, 165.825626, "NON_DEFAULT_LOCATION"),
        (None, None, "MISSING_LOCATION"),
        (None, 4, "MISSING_LOCATION"),
        (4, None, "MISSING_LOCATION"),
        ("", 4, "MISSING_LOCATION"),
        (91, 0, "INVALID_LOCATION"),
        (-91, 0, "INVALID_LOCATION"),
        (0, 181, "INVALID_LOCATION"),
        (float("nan"), 0, "INVALID_LOCATION"),
        (float("inf"), 0, "INVALID_LOCATION"),
        ("bad", 0, "INVALID_LOCATION"),
        (True, 0, "INVALID_LOCATION"),
        (None, "bad", "MISSING_LOCATION"),
        (1, -150, "NON_DEFAULT_LOCATION"),
        (4.5024000001, 135.6234, "NON_DEFAULT_LOCATION"),
        (0, 0, "NON_DEFAULT_LOCATION"),
        (-90, -180, "NON_DEFAULT_LOCATION"),
        (90, 180, "NON_DEFAULT_LOCATION"),
    ],
)
def test_classification(lat, lon, status):
    row = {"latitude": lat, "longitude": lon, "magnitude": None, "depth_km": None}
    result = classify_location(row)
    assert result["location_status"] == status
    assert result["audited_map_eligible"] == (status == "NON_DEFAULT_LOCATION")
    assert result["naive_map_eligible"] == (
        status in ("NON_DEFAULT_LOCATION", "PLACEHOLDER_LOCATION")
    )
    assert row["latitude"] is lat


def test_audit_and_exports(tmp_path):
    rows = [
        {"event_id": "same", "event_time": "2020-01-01", "latitude": a, "longitude": b}
        for a, b in [(4.5024, 135.6234), (0, 0), (None, 3), ("nan", 3)]
    ]
    events = audit_catalog(rows)
    assert events == audit_catalog(rows)
    summary = summarize_audit(events)
    assert sum(summary["status_counts"].values()) == 4
    assert summary["duplicate_event_ids"] == {"same": 4}
    assert len({e["row_id"] for e in events}) == 4
    assert summary["apparent_location_coverage"] == 50
    assert summary["audited_location_coverage"] == 25
    assert summary["coverage_reduction_percent"] == 50
    assert summary["naive_non_null_count"] == 3
    assert events[0]["latitude"] == rows[0]["latitude"]
    meta = manifest(Path("data/source/insight_marsquakes.parquet"), 4, None, False)
    export_audit(events, summary, meta, tmp_path)
    first = {p.name: p.read_bytes() for p in tmp_path.iterdir()}
    export_audit(events, summary, meta, tmp_path)
    assert first == {p.name: p.read_bytes() for p in tmp_path.iterdir()}
    exported = list(csv.DictReader((tmp_path / "audit.csv").open()))
    assert len(exported) == 4
    assert exported[0]["latitude"] == "4.5024"
    assert (
        sum(e["audited_map_eligible"] == "True" for e in exported)
        == summary["audited_map_count"]
    )
    assert (
        json.loads((tmp_path / "audit-summary.json").read_text())["status_counts"]
        == summary["status_counts"]
    )
    assert summarize_audit([])["apparent_location_coverage"] is None


def test_snapshot():
    events = audit_catalog(read_source("data/source/insight_marsquakes.parquet"))
    lookup = {e["event_id"]: e for e in events}
    assert lookup["mqs2019aumt"]["location_status"] == "PLACEHOLDER_LOCATION"
    assert lookup["mqs2019fddj"]["location_status"] == "NON_DEFAULT_LOCATION"
    committed = json.loads(Path("web/public/data/events.json").read_text())
    assert events == committed
    assert (
        summarize_audit(events)["status_counts"]
        == json.loads(Path("reports/audit-summary.json").read_text())["status_counts"]
    )


def test_cli_errors(tmp_path, capsys):
    assert main(["audit", "--input", str(tmp_path / "missing.csv")]) == 1
    bad = tmp_path / "bad.csv"
    bad.write_text("event_id\nx\n")
    assert main(["audit", "--input", str(bad)]) == 1
    corrupt = tmp_path / "bad.parquet"
    corrupt.write_text("broken")
    assert main(["audit", "--input", str(corrupt)]) == 1
    assert "Traceback" not in capsys.readouterr().err


def test_csv_roundtrip(tmp_path):
    from mapcheck.schema import FIELDS

    path = tmp_path / "edge.csv"
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        w.writerow(
            {"event_id": "a", "latitude": "", "longitude": "nan", "event_time": "bad"}
        )
        w.writerow({"event_id": "b", "latitude": "nan", "longitude": "0"})
    a, b = audit_catalog(read_source(path))
    assert a["location_status"] == "MISSING_LOCATION"
    assert b["location_status"] == "INVALID_LOCATION"
    assert a["validation_findings"] == ["INVALID_OR_MISSING_EVENT_TIME"]
    json.dumps([a, b], allow_nan=False)


def test_parquet_null_is_distinct_from_nan(tmp_path):
    import pyarrow as pa
    import pyarrow.parquet as pq

    from mapcheck.schema import FIELDS

    rows = [{field: None for field in FIELDS} for _ in range(2)]
    rows[0].update(event_id="null", latitude=None, longitude=0.0)
    rows[1].update(event_id="nan", latitude=float("nan"), longitude=0.0)
    path = tmp_path / "values.parquet"
    pq.write_table(pa.Table.from_pylist(rows), path)
    a, b = audit_catalog(read_source(path))
    assert a["location_status"] == "MISSING_LOCATION"
    assert b["location_status"] == "INVALID_LOCATION"
    assert b["source"]["latitude"] == "nan"
    json.dumps([a, b], allow_nan=False)


def test_cli_regeneration_determinism(tmp_path):
    args = [
        "audit",
        "--input",
        "data/source/insight_marsquakes.parquet",
        "--output",
        str(tmp_path),
    ]
    assert main(args) == 0
    before = {p.name: p.read_bytes() for p in tmp_path.iterdir()}
    assert main(args) == 0
    after = {p.name: p.read_bytes() for p in tmp_path.iterdir()}
    for name, content in before.items():
        if name in ("dataset-manifest.json", "audit-summary.json"):
            a, b = json.loads(content), json.loads(after[name])
            if name == "audit-summary.json":
                a["snapshot"].pop("retrieval_timestamp_utc")
                b["snapshot"].pop("retrieval_timestamp_utc")
            else:
                a.pop("retrieval_timestamp_utc")
                b.pop("retrieval_timestamp_utc")
            assert a == b
        else:
            assert content == after[name]
