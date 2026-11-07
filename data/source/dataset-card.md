---
license: cc-by-4.0
pretty_name: "InSight Marsquake Catalog"
language:
  - en
description: "Complete catalog of ~1,400 marsquakes detected by NASA InSight's SEIS seismometer on Mars (2019-2022). Final v14 release."
task_categories:
  - tabular-classification
  - tabular-regression
tags:
  - space
  - mars
  - insight
  - marsquake
  - seismology
  - nasa
  - planetary-science
  - open-data
  - tabular-data
  - parquet
size_categories:
  - 1K<n<10K
configs:
  - config_name: default
    data_files:
      - split: train
        path: data/insight_marsquakes.parquet
    default: true
---

# InSight Marsquake Catalog

*Part of the [Space Probe and Mission Datasets](https://huggingface.co/collections/juliensimon/space-probe-and-mission-datasets-69c3fe82d410a42b1e313167) collection on Hugging Face.*

Complete catalog of marsquakes detected by NASA InSight's SEIS seismometer on Mars,
sourced from the IRIS Mars Event Service. Currently **2,715** seismic events.

## Dataset description

NASA's InSight lander operated on Mars from November 2018 to December 2022,
deploying the SEIS (Seismic Experiment for Interior Structure) seismometer —
the first seismometer successfully placed on another planet. Over the course
of the mission, SEIS detected over 1,300 marsquakes, revealing the internal
structure of Mars for the first time.

This dataset contains the complete MQS catalog, including event times,
locations (where determinable), magnitudes, and event type classifications
ranging from low-frequency broadband events to super-high-frequency signals.

## Schema

| Column | Type | Description |
|--------|------|-------------|
| `event_id` | string | MQS event identifier (e.g. "mqs2022wrzi") |
| `event_time` | datetime | Origin time of the seismic event (UTC) |
| `latitude` | float64 | Event latitude on Mars (degrees, null if undetermined) |
| `longitude` | float64 | Event longitude on Mars (degrees, null if undetermined) |
| `depth_km` | float64 | Event depth in km (null if undetermined) |
| `author` | string | Author of the event origin |
| `catalog` | string | Source catalog identifier |
| `contributor` | string | Contributing agency |
| `contributor_id` | string | InSight sol-based event name (e.g. "S1415a") |
| `mag_type` | string | Magnitude type (MW, MbS, etc.) |
| `magnitude` | float64 | Event magnitude |
| `mag_author` | string | Author of the magnitude estimate |
| `event_location_name` | string | Named region on Mars (e.g. "Elysium Southwest") |
| `event_type` | string | MQS event type classification (BROADBAND, LOW_FREQUENCY, etc.) |
| `event_type_short` | string | Short event type label (BB, LF, HF, VF, SF, 2.4Hz) |

## Quick stats

- **2,715** seismic events
- **672** with magnitude estimates
- **2,715** with location estimates
- **6** distinct event type classifications
- Date range: **2019-01-12 to 2022-11-19**
- Strongest event: **mqs2022isne** (magnitude 4.6)

## Usage

```python
from datasets import load_dataset

ds = load_dataset("juliensimon/insight-marsquake-catalog", split="train")
df = ds.to_pandas()

# Events with known locations
located = df[df["latitude"].notna()]
print(f"{len(located):,} events with determined locations")

# Strongest marsquakes
strongest = df.nlargest(10, "magnitude")[["event_time", "magnitude", "event_type", "latitude", "longitude"]]

# Events by type
by_type = df["event_type"].value_counts()

# Events per year
df["year"] = df["event_time"].dt.year
by_year = df.groupby("year").size()
```

## Data source

[IRIS Mars Event Service](http://service.iris.edu/irisws/mars-event/1/) —
the official distribution point for the InSight Marsquake Service (MQS) catalog,
maintained by the InSight Mars SEIS Data Service at IRIS.

## Update schedule

Static dataset (InSight mission ended December 2022). No automatic updates.

## Related datasets

- [mars-craters-robbins](https://huggingface.co/datasets/juliensimon/mars-craters-robbins) — Mars crater database
- [mars-chemcam-compositions](https://huggingface.co/datasets/juliensimon/mars-chemcam-compositions) — Curiosity ChemCam rock compositions
- [mars-perseverance-weather](https://huggingface.co/datasets/juliensimon/mars-perseverance-weather) — Perseverance MEDA weather data
- [deep-space-probes](https://huggingface.co/datasets/juliensimon/deep-space-probes) — Active deep space probe catalog

## Pipeline

Source code: [juliensimon/space-datasets](https://github.com/juliensimon/space-datasets)

## Support

If you find this dataset useful, please give it a ❤️ on the [dataset page](https://huggingface.co/datasets/juliensimon/insight-marsquake-catalog) and share feedback in the Community tab! Also consider giving a ⭐️ to the [space-datasets](https://github.com/juliensimon/space-datasets) repo.

## Citation

```bibtex
@dataset{insight_marsquake_catalog,
  author = {Simon, Julien},
  title = {InSight Marsquake Catalog},
  year = {2026},
  publisher = {Hugging Face},
  url = {https://huggingface.co/datasets/juliensimon/insight-marsquake-catalog},
  note = {Based on NASA InSight SEIS marsquake catalog via IRIS Mars Event Service}
}
```

## License

[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)
