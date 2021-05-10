locals {
  project_id = var.project_id
  region     = "europe-west6"
  zone       = "europe-west6-a"
  
  k8s_host  = "https://${google_container_cluster.primary.endpoint}"
  k8s_token = data.google_client_config.current.access_token
  k8s_ca    = base64decode(google_container_cluster.primary.master_auth[0].cluster_ca_certificate)
}

provider "google-beta" {
  project = local.project_id
  region  = local.region
  zone    = local.zone
}

provider "google" {
  project = local.project_id
  region  = local.region
  zone    = local.zone
}

provider "kubernetes" {
  host                   = local.k8s_host
  token                  = local.k8s_token
  cluster_ca_certificate = local.k8s_ca
}

provider "helm" {
  kubernetes {
    host                   = local.k8s_host
    token                  = local.k8s_token
    cluster_ca_certificate = local.k8s_ca
  }
}

data "google_client_config" "current" {}