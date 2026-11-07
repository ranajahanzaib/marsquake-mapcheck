# Scientific limitations

- Non-default positions are **not independently verified** by this application. Significant location uncertainty can remain, especially with one seismic station.
- This derivative dataset does not expose a dedicated location-quality field, distance, back-azimuth, or uncertainty bounds. MapCheck manufactures none of these.
- Exact-default coordinates are treated as placeholders according to the MQS convention. A genuinely located event exactly at the lander cannot be distinguished using these fields alone. A corrupted or differently encoded default would require upstream verification; no neighborhood around the lander is suppressed.
- Signal type, event quality, magnitude availability and location availability are different concepts. Some catalog records are automatically generated entries or other signal classifications; not every row represents an independently confirmed tectonic marsquake.
- Region names are reported metadata, not evidence of a computed epicenter. Missing magnitude/depth is never replaced by zero. Magnitude scales differ; the optional threshold is a filter on published values, not a calibration across scales.
- The bundled Hugging Face snapshot is a derivative catalog, not a live MQS synchronization. Refreshing the source can change statistics, schema or record ordering. Row IDs identify rows within a snapshot, not immutable identities across future snapshots.
- The naive view intentionally plots valid stored coordinates as positions; the audited view removes only missing, invalid and documented exact-default pairs. Remaining spatial patterns should not be interpreted as a complete or unbiased distribution of Martian seismicity.
- Maps use global equirectangular projection. Symbols overlap and have no geophysical size, uncertainty radius, or intensity meaning. The event table supplies the accessible complete alternative.
- No waveform analysis, prediction, tectonic inference, location reconstruction, real-time monitoring, or upstream QuakeML parsing is performed.
