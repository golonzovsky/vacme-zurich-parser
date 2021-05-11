
resource "google_dns_managed_zone" "public_domain_kloud_top" {
  name        = "kloud-top-public"
  dns_name    = "kloud.top."
  description = "kloud.top public DNS zone"
}

resource "google_dns_record_set" "public_root" {
  name         = "kloud.top."
  managed_zone = google_dns_managed_zone.public_domain_kloud_top.name
  type         = "A"
  ttl          = 300
  rrdatas = [google_compute_address.nginx_ingress_public.address]
}

resource "google_dns_record_set" "public_wildcard" {
  name         = "*.kloud.top."
  managed_zone = google_dns_managed_zone.public_domain_kloud_top.name
  type         = "A"
  ttl          = 300
  rrdatas = [google_compute_address.nginx_ingress_public.address]
}
