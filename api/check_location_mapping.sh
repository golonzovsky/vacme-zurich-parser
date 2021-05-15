#!/usr/bin/env bash

curl https://vacme.kloud.top/api/v2/locations | jq ".locations|.[]|.name" | sort > /tmp/names_fetched.txt
cat locationMapping.json | jq ".[]|.name" | sort > /tmp/names_mapped.txt
colordiff -y /tmp/names_fetched.txt /tmp/names_mapped.txt
rm /tmp/names_fetched.txt /tmp/names_mapped.txt