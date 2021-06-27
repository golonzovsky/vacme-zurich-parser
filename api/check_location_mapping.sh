#!/usr/bin/env bash

curl https://vacme.kloud.top/api/v2/locations -s | jq ".locations|.[]|.name" | sort > /tmp/names_fetched.txt
cat locationMapping.json | jq ".[]|.name" | sort > /tmp/names_mapped.txt
colordiff --suppress-common-lines -ty /tmp/names_fetched.txt /tmp/names_mapped.txt
rm /tmp/names_fetched.txt /tmp/names_mapped.txt
