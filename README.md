# vacme-zurich-parser

https://zh.vacme.ch provides a way to register for vaccination in Zurich. Since there is not much free slots - its quite tedious to find available one. You need to click dozens of locations.   

This tries to simplify this by exposing rest api with up to date available slots for vaccination in Zurich.  
Be aware is uses personal refresh token for existing registration and reverse engineered api, so its all quite fragile.  

Python is not my primary language, so I have no idea what I'm doin.. ¯\_(ツ)_/¯ 

## local deployment
if you want to run it locally, find your REGISTRATION_ID and REFRESH_TOKEN from browser network tab and run:
```bash
docker run --rm -it -e REGISTRATION_ID=? -e REFRESH_TOKEN=? golonzovsky/vacme-parser
```

or run python code directly.

## cloud deployment
if you want to run it in the cluster - sometimes api starts to redirect into capcha. AFAIK once its solved IP is added and you can call apis.  

If you run in k8s - you need to make your cluster with private nodes and create NAT.. Then you need to solve capcha from your NAT ip using socks proxy. Example for GKE:
```
gcloud beta compute ssh --zone "europe-west6-a" "gke-main-preemptible-e2-medium-3b140cfc-wv1s" --tunnel-through-iap --project "?????" -- -N -p 22 -D localhost:5000
```

Currently deployed to https://vacme.kloud.top with refresh interval 20 min.
