# infrastructure

Its terraform definitions of k8s (GKE) cluster running in GCP.  
Main specific for this project - cluster need to have private nodes behind nat. 

Can be simplified a lot by using GCP https loadbalancers. In-cluster `nginx ingress` and `cert-manager` can be removed in this case. This was fast and dirty solution which I'm using elsewhere.

