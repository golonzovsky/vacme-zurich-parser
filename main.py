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
    'data': []
}


def doRequestFirstPerId(id):
    resp = requests.post('https://zh.vacme.ch/api/v1/reg/dossier/termine/nextfrei/{}/ERSTE_IMPFUNG'.format(id),
                         headers=headers)
    if resp.status_code == 200:
        return resp.json()
    elif resp.status_code == 204:
        return ''
    else:
        logging.error("unexpected response doRequestFirstPerId %s", resp.status_code)
        return ''


def doRequestSecondPerIdAndStart(id, nextDate):
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


def doListLocations():
    return requests.get('https://zh.vacme.ch/api/v1/reg/dossier/odi/all/{}'.format(config['registration_id']), headers=headers).json()


def ensureToken():
    if headers['Authorization'] == '':
        doRefreshToken()
        return

    account_resp = requests.get('https://zh.vacme.ch/auth/realms/vacme/account', headers=headers)
    if account_resp.status_code == 401:
        doRefreshToken()
        account_resp = requests.get('https://zh.vacme.ch/auth/realms/vacme/account', headers=headers)
        if account_resp.status_code == 401:
            logging.error("token refresh failed. cannot recover, exiting")
            sys.exit("Cannon recover token")


def doRefreshToken():
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': config['refresh_token'],
        'client_id': 'vacme-initial-app-prod'
    }
    resp = requests.post('https://zh.vacme.ch/auth/realms/vacme/protocol/openid-connect/token', data=data)

    if resp.status_code != 200:
        logging.error("token refresh failed: %s. cannot recover, exiting", resp.status_code)
        sys.exit("Cannot recover token")

    resp_json = resp.json()
    config['refresh_token'] = resp_json['refresh_token']
    headers['Authorization'] = 'Bearer {}'.format(resp_json['access_token'])
    logging.info("update access token successful, expires in %s; refresh expires in %s", resp_json['expires_in'], resp_json['refresh_expires_in'])


def fetchAvailableFirst(locations):
    next_first_date_locations = []

    for location in locations:
        resp = doRequestFirstPerId(location['id'])
        if resp != '':
            logging.info("found first location: %s %s", location['name'], resp)
            next_first_date_locations.append({
                'locationId': location['id'],
                'name': location['name'],
                'nextDate': resp['nextDate'],
                'nextDateParsed': dt.datetime.strptime(resp['nextDate'], '%Y-%m-%dT%H:%M:%S')
            })
    next_first_date_locations.sort(key=lambda x: x['nextDateParsed'])
    return next_first_date_locations


def fetchSecondLocation(locations):
    next_second_locations = []
    for next in locations:
        resp = doRequestSecondPerIdAndStart(next['locationId'], next['nextDate'])
        if resp != '':
            available = next.copy()
            available['secondDate'] = resp['nextDate']
            logging.info("found location with both available: %s %s", next['name'], available)
            next_second_locations.append(available)
    return next_second_locations


def update_caches():
    logging.info("update caches")
    ensureToken()
    locations = doListLocations()
    logging.info("found %s locations", len(locations))
    first = fetchAvailableFirst(locations)
    logging.info("found %s first appointments", len(first))
    second = fetchSecondLocation(first)
    logging.info("found %s locations with both appointments", len(second))
    cache['data'] = second
    logging.info(second)


@app.route("/")
def home():
    """ Function for test purposes. """
    return jsonify(cache['data'])


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
