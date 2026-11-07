export type Status =
  | "PLACEHOLDER_LOCATION"
  | "NON_DEFAULT_LOCATION"
  | "MISSING_LOCATION"
  | "INVALID_LOCATION";
export interface CatalogEvent {
  row_id: string;
  event_id: string;
  contributor_id: string | null;
  event_time: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  parsed_latitude: number | null;
  parsed_longitude: number | null;
  magnitude: number | null;
  depth_km: number | null;
  mag_type: string | null;
  event_type: string | null;
  event_location_name: string | null;
  location_status: Status;
  location_reason_code: string;
  audit_explanation: string;
  recommended_action: string;
  naive_map_eligible: boolean;
  audited_map_eligible: boolean;
  source: Record<string, unknown>;
  validation_findings: string[];
}
export interface Summary {
  total_records: number;
  status_counts: Record<Status, number>;
  apparent_location_coverage: number | null;
  audited_location_coverage: number | null;
  audited_map_count: number;
  naive_map_count: number;
  snapshot: {
    dataset_revision: string | null;
    retrieval_timestamp_utc: string;
    input_sha256: string;
    classification_rules_version: string;
  };
}
