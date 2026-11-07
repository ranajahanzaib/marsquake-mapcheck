from pathlib import Path

import pandas as pd
from huggingface_hub import HfApi, hf_hub_download

from .schema import validate_schema

DATASET = "juliensimon/insight-marsquake-catalog"
SOURCE_URL = f"https://huggingface.co/datasets/{DATASET}"
DOCUMENTATION = "https://service.earthscope.org/irisws/mars-event/docs/1/help/"


def retrieve(revision=None):
    api = HfApi()
    info = api.dataset_info(DATASET, revision=revision)
    files = api.list_repo_files(DATASET, repo_type="dataset", revision=info.sha)
    candidates = [f for f in files if f.endswith(".parquet")]
    if candidates != ["data/insight_marsquakes.parquet"]:
        raise ValueError(
            f"Upstream file layout changed; inspect before ingesting: {candidates}"
        )
    return Path(
        hf_hub_download(DATASET, candidates[0], repo_type="dataset", revision=info.sha)
    ), info.sha


def read_source(path):
    path = Path(path)
    if not path.is_file():
        raise ValueError(f"Input file not found: {path}")
    if path.suffix.lower() == ".csv":
        frame = pd.read_csv(path, dtype=str, keep_default_na=False)
        rows = frame.to_dict("records")
    elif path.suffix.lower() == ".parquet":
        import pyarrow.parquet as pq

        table = pq.read_table(path)
        frame = table.to_pandas()
        # Arrow distinguishes actual nulls from non-finite numeric values.
        rows = table.to_pylist()
    else:
        raise ValueError("Unsupported input format; use CSV or Parquet")
    validate_schema(frame.columns)
    return rows
