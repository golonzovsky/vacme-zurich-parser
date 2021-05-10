import logging
import os
import sys
import datetime as dt
import requests
import atexit
import base64
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask
from flask import jsonify
from kubernetes import client, config

app = Flask(__name__)

app_config = {
    'refresh_token': os.getenv("REFRESH_TOKEN"),
    'registration_id': os.getenv("REGISTRATION_ID"),
    'refresh_interval_sec': int(os.getenv("REFRESH_INTERVAL_SEC", 60))
}

headers = {
    'User-Agent': 'Friendly parser. https://github.com/golonzovsky/vacme-zurich-parser',
    'Accept': 'application/json',
    'Referer': 'https://zh.vacme.ch/',
    'Content-Type': 'application/json',
    'Origin': 'https://zh.vacme.ch',
    'Authorization': '',
}

cache = {
    'locations': [],
    'last_refresh': None,
    'refresh_interval_sec': app_config['refresh_interval_sec'],
    'vaccination_group': 'N',
    'source': 'https://github.com/golonzovsky/vacme-zurich-parser',
}

all_locations = {
    'locations': []
}

k8s_API = {}

def do_request_first_appointment(id):
    resp = requests.post('https://zh.vacme.ch/api/v1/reg/dossier/termine/nextfrei/{}/ERSTE_IMPFUNG'.format(id),
                         headers=headers)
    if resp.status_code == 200:
        return resp.json()
    elif resp.status_code == 204:
        return ''
    else:
        logging.error("unexpected response doRequestFirstPerId %s", resp.status_code)
        return ''


def do_request_second_appointment(id, nextDate):
    data = '{"nextDate": "%s"}' % nextDate
    resp = requests.post('https://zh.vacme.ch/api/v1/reg/dossier/termine/nextfrei/{}/ZWEITE_IMPFUNG'.format(id),
                         headers=headers, data=data)
    if resp.status_code == 200:
        return resp.json()
    elif resp.status_code == 204:
        return ''
    else:
        logging.error("unexpected response doRequestFirstPerId %s", resp.status_code)
        return ''


def fetch_all_locations():
    resp = requests.get('https://zh.vacme.ch/api/v1/reg/dossier/odi/all/{}'.format(app_config['registration_id']),
                        headers=headers).json()
    logging.info("found %s locations", len(resp))
    all_locations['locations'] = resp
    return resp


def ensure_token():
    if headers['Authorization'] == '':
        do_refresh_token()
        return

    account_resp = requests.get('https://zh.vacme.ch/auth/realms/vacme/account', headers=headers)
    if account_resp.status_code == 401:
        do_refresh_token()
        account_resp = requests.get('https://zh.vacme.ch/auth/realms/vacme/account', headers=headers)
        if account_resp.status_code == 401:
            logging.error("token refresh failed. cannot recover, exiting")
            sys.exit("Cannon recover token")


def do_refresh_token():
    req = {
        'grant_type': 'refresh_token',
        'refresh_token': app_config['refresh_token'],
        'client_id': 'vacme-initial-app-prod'
    }
    resp = requests.post('https://zh.vacme.ch/auth/realms/vacme/protocol/openid-connect/token', data=req)

    if resp.status_code != 200:
        logging.error("token refresh failed: %s. cannot recover, exiting", resp.status_code)
        sys.exit("Cannot recover token")

    if resp.headers['content-type'] == 'text/html':
        logging.error("token refresh require captcha %s %s", resp.status_code, resp.headers['content-type'])
        sys.exit("Please enter captcha. Exiting.")

    resp_json = resp.json()
    new_refresh_token = resp_json['refresh_token']
    app_config['refresh_token'] = new_refresh_token
    headers['Authorization'] = 'Bearer {}'.format(resp_json['access_token'])
    logging.info("update access token successful, expires in %s; refresh expires in %s. %s", resp_json['expires_in'], resp_json['refresh_expires_in'],
                 new_refresh_token)
    update_token_secret(new_refresh_token)


def update_token_secret(new_token):
    body = {
        "metadata": {
            "annotations": {
                "vacme/last-update": dt.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
            }
        },
        "data": {
            "refresh_token": base64.b64encode(new_token.encode("utf-8")).decode("ascii")
        }
    }
    client.CoreV1Api().patch_namespaced_secret("vacme-parser", "vacme", body, pretty=True)


def fetch_location_with_available_first_appointment(locations):
    next_first_date_locations = []

    for location in locations:
        resp = do_request_first_appointment(location['id'])
        if resp != '':
            logging.info("found first location: %s %s", location['name'], resp)
            next_first_date_locations.append({
                'locationId': location['id'],
                'name': location['name'],
                'nextDate': resp['nextDate'],
                'nextDateMillis': parse_date_to_milli(resp['nextDate'])
            })
    next_first_date_locations.sort(key=lambda x: x['nextDateMillis'])
    logging.info("found %s first appointments", len(next_first_date_locations))
    return next_first_date_locations


def fetch_locations_with_both_appointments(locations):
    next_second_locations = []
    for next in locations:
        resp = do_request_second_appointment(next['locationId'], next['nextDate'])
        if resp != '':
            available = {'name': next['name'],
                         'firstDate': next['nextDateMillis'],
                         'secondDate': parse_date_to_milli(resp['nextDate'])
                         }
            logging.info("found location with both available: %s %s", next['name'], available)
            next_second_locations.append(available)
    logging.info("found %s locations with both appointments", len(next_second_locations))
    return next_second_locations


def parse_date_to_milli(st):
    return int(dt.datetime.strptime(st, '%Y-%m-%dT%H:%M:%S').timestamp() * 1000)


def now_millis():
    return int(dt.datetime.now().timestamp() * 1000)


def update_caches():
    logging.info("update caches")

    ensure_token()
    all_locations = fetch_all_locations()
    first = fetch_location_with_available_first_appointment(all_locations)
    both = fetch_locations_with_both_appointments(first)

    cache['locations'] = both
    cache['last_refresh'] = now_millis()

    logging.info(cache)


@app.route("/api/locations")
def api_locations():
    return jsonify(all_locations)


@app.route("/api/")
def api_home():
    return jsonify(cache)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    if app_config['refresh_token'] == '' or app_config['registration_id'] == '':
        sys.exit("set both REFRESH_TOKEN and REGISTRATION_ID env variables")

    try:
        config.load_incluster_config()
    except Exception:
        config.load_kube_config()

    logging.info("Starting vacme parser")
    update_caches()

    scheduler = BackgroundScheduler()
    scheduler.add_job(func=update_caches, trigger="interval", seconds=app_config['refresh_interval_sec'])
    scheduler.start()
    atexit.register(lambda: scheduler.shutdown())

    app.run(host='0.0.0.0', port=5000)