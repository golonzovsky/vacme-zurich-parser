locals {
  gke_master_cidr = "10.32.32.32/28"
}

resource "google_container_cluster" "primary" {
  name     = "main"
  location = local.zone
  release_channel {
    channel = "RAPID"
  }

  remove_default_node_pool = true
  initial_node_count       = 1

  private_cluster_config {
    enable_private_endpoint = false
    enable_private_nodes    = true
    master_ipv4_cidr_block  = local.gke_master_cidr
  }

  ip_allocation_policy {
    cluster_ipv4_cidr_block = ""
    services_ipv4_cidr_block   = ""
  }

  master_auth {
    username = ""
    password = ""

    client_certificate_config {
      issue_client_certificate = false
    }
  }
}

resource "google_container_node_pool" "primary_preemptible_nodes" {
  name       = "preemptible-e2-medium"
  cluster    = google_container_cluster.primary.name
  node_count = 2

  node_config {
    preemptible  = true
    machine_type = "e2-medium"

    metadata = {
      disable-legacy-endpoints = "true"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

#----------------------------------------------------------------------- cert-manager
resource "kubernetes_namespace" "cert_manager" {
  metadata {
    name = "cert-manager"
  }
}

resource "helm_release" "cert_manager" {
  repository = "https://charts.jetstack.io"
  chart      = "cert-manager"
  name       = "cert-manager"
  version    = "v1.1.0"
  namespace  = kubernetes_namespace.cert_manager.metadata[0].name

  set {
    name  = "podDnsPolicy"
    value = "None"
    type  = "string"
  }
  set {
    name  = "podDnsConfig.nameservers"
    value = "{8.8.8.8,1.1.1.1}"
  }
  set {
    name  = "installCRDs"
    value = "true"
  }
}
#----------------------------------------------------------------------- ingress
resource "kubernetes_namespace" "ingress_controller" {
  metadata {
    name = "ingress-controller"
  }
}

resource "helm_release" "nginx_ingress" {
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  name       = "nginx-ingress"
  namespace  = kubernetes_namespace.ingress_controller.metadata[0].name
  version    = "3.29.0"

  values = [
    templatefile(
      "${path.module}/ingress-helm-values.yml",
    { 
      ip_address_private : google_compute_address.nginx_ingress_private.address,
      ip_address_public : google_compute_address.nginx_ingress_public.address,
    })
  ]
}

resource "google_compute_address" "nginx_ingress_private" {
  project      = local.project_id
  name         = "nginx-ingress-private"
  address_type = "INTERNAL"
  description  = "Private nginx-ingress controller IP"
}

resource "google_compute_address" "nginx_ingress_public" {
  project     = local.project_id
  name        = "nginx-ingress-public"
  description = "Public nginx-ingress controller IP"
}
