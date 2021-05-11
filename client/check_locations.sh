#!/usr/bin/env bash

curl https://vacme.kloud.top/api/locations | jq ".locations|.[]|.name" | sort > /tmp/names_fetched.txt
cat ./src/locationMapping.json | jq ".[]|.name" | sort > /tmp/names_mapped.txt
colordiff /tmp/names_fetched.txt /tmp/names_mapped.txt
rm /tmp/names_fetched.txt /tmp/names_mapped.txt