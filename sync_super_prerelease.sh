#!/bin/bash
# 更新超先行服卡片列表

curl --proto '=https' --tlsv1.2 -sS https://cdn02.moecube.com:444/ygopro-super-pre/data/test-release-v2.json | jq '[.[].id]' > super-pre-release.json
