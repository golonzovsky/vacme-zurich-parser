resource "google_project_service" "places" {
  project = local.project_id
  service = "places-backend.googleapis.com"
  disable_dependent_services = true
}
