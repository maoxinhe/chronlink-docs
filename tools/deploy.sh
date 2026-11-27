#!/bin/bash
# 本地构建 -> 推送 gh-pages -> 触发 Pages 构建
set -e
cd "$(dirname "$0")/.."
GH_TOKEN="${GH_TOKEN:?需要 GH_TOKEN}"
npx vuepress build docs
rm -rf /tmp/ghp && cp -r docs/.vuepress/dist /tmp/ghp
cd /tmp/ghp && touch .nojekyll
if [ ! -d .git ]; then
  git init -q && git checkout -q -b gh-pages
  git remote add origin "https://x-access-token:${GH_TOKEN}@github.com/maoxinhe/chronlink-docs.git"
fi
git add -A && git -c user.email=bot@camzy.tech -c user.name=ChronLink commit -qm "build: $(date +%Y-%m-%d\ %H:%M)" || true
git push -f -q origin gh-pages
curl -s -X POST -H "Authorization: Bearer ${GH_TOKEN}" -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/maoxinhe/chronlink-docs/pages/builds > /dev/null
echo "deployed"
