#!/usr/bin/env python3
"""Fetch issue statuses from GitHub Project board and update STORIES.md."""

import json
import re
import subprocess
import sys

PROJECT_NUMBER = 48
ORG = "TGM-HIT"
REPO = "TGM-HIT/syt5-gek1051-mobile-application-sirbuysalot"
BASE_URL = f"https://github.com/{REPO}/issues"
STORIES_FILE = "STORIES.md"


def fetch_statuses():
    result = subprocess.run(
        ["gh", "project", "item-list", str(PROJECT_NUMBER),
         "--owner", ORG, "--format", "json"],
        capture_output=True, text=True, check=True,
    )
    data = json.loads(result.stdout)
    statuses = {}
    for item in data["items"]:
        content = item.get("content", {})
        number = content.get("number")
        status = item.get("status", "No Status")
        if number:
            statuses[number] = status
    return statuses


def update_stories(statuses):
    with open(STORIES_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    changed = 0
    for number, status in statuses.items():
        pattern = rf"\|\s*[^|]*\[#{number}\]\({re.escape(BASE_URL)}/{number}\)\s*\|"
        replacement = f"| {status} [#{number}]({BASE_URL}/{number}) |"
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changed += 1
        content = new_content

    with open(STORIES_FILE, "w", encoding="utf-8") as f:
        f.write(content)

    return changed


def main():
    statuses = fetch_statuses()
    changed = update_stories(statuses)
    print(f"Synced {len(statuses)} issues, {changed} status(es) changed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
