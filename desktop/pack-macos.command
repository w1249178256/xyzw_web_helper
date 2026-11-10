#!/bin/bash
set -e
cd "$(dirname "$0")"
node build.mjs mac
printf '\n安装包目录：%s/release\n' "$PWD"
