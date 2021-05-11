data "google_project" "project" {
  project_id = local.project_id
}

# DNS ------------------------------------------------------------------------------------------------------------------

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

# NAT configuration  ---------------------------------------------------------------------------------------------------

data "google_compute_network" "default" {
  name = "default"
}

resource "google_compute_router" "router" {
  name    = "router"
  network = data.google_compute_network.default.id
}

resource "google_compute_address" "nat_ip" {
  name    = "nat-ip"
}

resource "google_compute_router_nat" "internet_gateway" {
  name                               = "main-nat"
  router                             = google_compute_router.router.name
  region                             = local.region
  nat_ip_allocate_option             = "MANUAL_ONLY"
  nat_ips                            = [google_compute_address.nat_ip.self_link]
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# Master access node for private cluster admission-webhooks (cert-managerr)  -------------------------------------------

resource "google_compute_firewall" "allow_master_access_to_pods" {
  name        = "allow-master-access-to-pods"
  network     = data.google_compute_network.default.id
  priority    = 100
  description = "Allow master access to pod network"

  allow {
    protocol = "all"
  }

  source_ranges = [
    local.gke_master_cidr
  ]
}