# Data sources and licensing

## Catalog

Julien Simon (2026), **InSight Marsquake Catalog**, Hugging Face. [Dataset repository](https://huggingface.co/datasets/juliensimon/insight-marsquake-catalog). Based on the NASA InSight SEIS / Marsquake Service catalog distributed via IRIS, now EarthScope. Dataset license: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution and modification notice are shown in the application, generated reports, and this repository. Code's MIT license does not relicense the dataset.

Bundled file: `data/source/insight_marsquakes.parquet`, downloaded with `huggingface_hub.hf_hub_download` after inspecting the repository file listing. Revision: `6a14e70827fe23f9b2e31609ddcecce9d3219de4`. The manifest records its SHA-256; the original dataset card is preserved beside it. All events are real source records. Processing adds normalization, validation findings, location statuses and summaries without overwriting source coordinates.

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

## Scientific documentation

- [Current MQS / EarthScope documentation](https://service.earthscope.org/irisws/mars-event/docs/1/help/), specifically “Location Search”: authoritative default pair, single-station caveats and coordinate conventions; verified during implementation.
- [Current upstream event service](https://service.earthscope.org/irisws/mars-event/1/).
- [Legacy IRIS documentation](https://service.iris.edu/irisws/mars-event/docs/1/help/).

The application ingests the Hugging Face file, not the live event service. It does not conflate service capabilities with fields actually present in this derivative dataset.

## Basemap

[USGS Astrogeology: Mars MGS MOLA Global Color Shaded Relief, 463 m](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_global_color_shaded_relief_463m).

Bundled `web/public/maps/mola.jpg` is the publisher's 1024 × 512 JPEG sample, not the 1 GB GeoTIFF. [Exact sample URL](https://astrogeology.usgs.gov/ckan/dataset/0c30e797-b7d7-4d06-87c2-d3b01abcd797/resource/c384f456-8182-4e40-94de-727b74dab4ec/download/mars_mgs_colorhillshade_mola_1024.jpg).

The USGS metadata explicitly specifies minimum/maximum longitude −180/+180, latitude −90/+90, simple cylindrical projection, positive-east longitude, planetocentric latitude and use constraints “None”. The sample's north-up global arrangement was visually checked (Tharsis/Olympus to the west, Elysium to the east), and its 2:1 dimensions match the global geographic extent. No longitude shift, horizontal flip or cropping is applied. This USGS/NASA government imagery is public domain; attribution is retained. CSS desaturation and dimming improve overlay legibility, not geography.

No NASA, USGS, EarthScope, Julien Simon or MQS endorsement is implied. There are no runtime tile servers, external fonts, tracking scripts or paid APIs.
