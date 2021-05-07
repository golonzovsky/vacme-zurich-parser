import logging
import os
import sys
import datetime as dt
import requests
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask
from flask import jsonify

app = Flask(__name__)

config = {
    'refresh_token': os.getenv("REFRESH_TOKEN"),
    'registration_id': os.getenv("REGISTRATION_ID"),
    'refresh_interval_sec': int(os.getenv("REFRESH_INTERVAL_SEC", 60))
}

headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:88.0) Gecko/20100101 Firefox/88.0',
    'Accept': 'application/json',
    'Referer': 'https://zh.vacme.ch/',
    'Content-Type': 'application/json',
    'Authorization': '',
    'Origin': 'https://zh.vacme.ch',
}

cache = {
    'locations': [],
    'lastUpdate': None,
    'vaccination_group': 'N'
}


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
    locations = requests.get('https://zh.vacme.ch/api/v1/reg/dossier/odi/all/{}'.format(config['registration_id']),
                        headers=headers).json()
    logging.info("found %s locations", len(locations))
    return locations


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
        'refresh_token': config['refresh_token'],
        'client_id': 'vacme-initial-app-prod'
    }
    resp = requests.post('https://zh.vacme.ch/auth/realms/vacme/protocol/openid-connect/token', data=req)

    if resp.status_code != 200:
        logging.error("token refresh failed: %s. cannot recover, exiting", resp.status_code)
        sys.exit("Cannot recover token")

    resp_json = resp.json()
    config['refresh_token'] = resp_json['refresh_token']
    headers['Authorization'] = 'Bearer {}'.format(resp_json['access_token'])
    logging.info("update access token successful, expires in %s; refresh expires in %s. %s", resp_json['expires_in'], resp_json['refresh_expires_in'], resp_json['refresh_token'])
    #todo update k8s secret startup seed token instead of just logging it here


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
                'nextDateParsed': parse_date(resp['nextDate'])
            })
    next_first_date_locations.sort(key=lambda x: x['nextDateParsed'])
    logging.info("found %s first appointments", len(next_first_date_locations))
    return next_first_date_locations


def fetch_locations_with_both_appointments(locations):
    next_second_locations = []
    for next in locations:
        resp = do_request_second_appointment(next['locationId'], next['nextDate'])
        if resp != '':
            available = {'locationId': next['locationId'],
                         'name': next['name'],
                         'firstDate': next['nextDateParsed'],
                         'secondDate': parse_date(resp['nextDate'])}
            logging.info("found location with both available: %s %s", next['name'], available)
            next_second_locations.append(available)
    logging.info("found %s locations with both appointments", len(next_second_locations))
    return next_second_locations


def parse_date(st):
    return dt.datetime.strptime(st, '%Y-%m-%dT%H:%M:%S')


def update_caches():
    logging.info("update caches")

    ensure_token()
    locations = fetch_all_locations()
    first = fetch_location_with_available_first_appointment(locations)
    both = fetch_locations_with_both_appointments(first)

    cache['locations'] = both
    cache['lastUpdate'] = dt.datetime.now()

    logging.info(cache)


@app.route("/")
def home():
    return jsonify(cache)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    if config['refresh_token'] == '' or config['registration_id'] == '':
        sys.exit("set both REFRESH_TOKEN and REGISTRATION_ID env variables")

    logging.info("Starting vacme parser")
    update_caches()

    scheduler = BackgroundScheduler()
    scheduler.add_job(func=update_caches, trigger="interval", seconds=config['refresh_interval_sec'])
    scheduler.start()
    atexit.register(lambda: scheduler.shutdown())

    app.run(host='0.0.0.0', port=5000)
