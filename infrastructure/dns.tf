locals {
  domains = [
    "kloud.top",
  ]
}

resource "google_dns_managed_zone" "public_domain" {
  for_each    = toset(local.domains)
  name        = "${replace(each.key, ".", "-")}-public"
  dns_name    = "${each.key}."
  description = "${each.key} public DNS zone"
}

resource "google_dns_managed_zone" "private_domain" {
  for_each    = toset(local.domains)
  name        = "${replace(each.key, ".", "-")}-private"
  dns_name    = "${each.key}."
  description = "${each.key} private DNS zone"

  visibility = "private"

  private_visibility_config {
    networks {
      network_url = data.google_compute_network.default.self_link
    }
  }
}

resource "google_dns_record_set" "public_root" {
  for_each     = toset(local.domains)
  name         = "${each.key}."
  managed_zone = google_dns_managed_zone.public_domain[each.key].name
  type         = "A"
  ttl          = 300

  rrdatas = [google_compute_address.nginx_ingress_public.address]
}

resource "google_dns_record_set" "public_wildcard" {
  for_each     = toset(local.domains)
  name         = "*.${each.key}."
  managed_zone = google_dns_managed_zone.public_domain[each.key].name
  type         = "A"
  ttl          = 300

  rrdatas = [google_compute_address.nginx_ingress_public.address]
}

resource "google_dns_record_set" "private_wildcard" {
  for_each     = toset(local.domains)
  name         = "*.${each.key}."
  managed_zone = google_dns_managed_zone.private_domain[each.key].name
  type         = "A"
  ttl          = 300

  rrdatas = [google_compute_address.nginx_ingress_private.address]
}
