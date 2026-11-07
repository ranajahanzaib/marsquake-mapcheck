import argparse
import shutil
import sys
from pathlib import Path

from .audit import audit_catalog, summarize_audit
from .export import export_audit, write_json
from .provenance import manifest
from .source import read_source, retrieve


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Audit InSight catalog coordinates; preserve provenance."
    )
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("ingest", "audit"):
        cmd = commands.add_parser(name)
        cmd.add_argument(
            "--input",
            type=Path,
            required=name == "audit",
            help="Local CSV or Parquet; ingest defaults to Hugging Face",
        )
        cmd.add_argument(
            "--revision",
            help="Hugging Face commit to download, or asserted provenance for a local source",
        )
        cmd.add_argument("--output", type=Path, default=Path("reports"))
        if name == "ingest":
            cmd.add_argument("--web-output", type=Path, default=Path("web/public/data"))
    args = parser.parse_args(argv)
    try:
        remote = args.input is None
        path, revision = (
            retrieve(args.revision) if remote else (args.input, args.revision)
        )
        events = audit_catalog(read_source(path))
        summary = summarize_audit(events)
        meta = manifest(path, len(events), revision, remote)
        if args.command == "ingest":
            source_dir = Path("data/source")
            source_dir.mkdir(parents=True, exist_ok=True)
            preserved = source_dir / path.name
            if path.resolve() != preserved.resolve():
                shutil.copyfile(path, preserved)
        export_audit(events, summary, meta, args.output)
        if args.command == "ingest":
            args.web_output.mkdir(parents=True, exist_ok=True)
            write_json(args.web_output / "events.json", events)
            for name in (
                "audit.csv",
                "audit-summary.json",
                "audit-report.md",
                "dataset-manifest.json",
            ):
                if (args.output / name).resolve() != (args.web_output / name).resolve():
                    shutil.copyfile(args.output / name, args.web_output / name)
        print(f"Audited {len(events):,} records: {summary['status_counts']}")
        print(
            f"Reports: {args.output}; duplicate IDs: {len(summary['duplicate_event_ids'])}"
        )
        return 0
    except Exception as exc:  # noqa: BLE001 — CLI boundary presents routine source/export errors without tracebacks.
        print(f"mapcheck: {exc}", file=sys.stderr)
        return 1
