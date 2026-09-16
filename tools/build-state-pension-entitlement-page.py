#!/usr/bin/env python3
"""Assemble state-pension-entitlement.html from the skeleton.

The page record lives in tools/pagebuild.py under the name
'state-pension-entitlement', and so do the assembly, the checks and the image
stamping that every assembled page shares. This script is only the entry
point that names the page, kept so the command in docs/STATUS.md and in
muscle memory still works.

    python3 tools/build-state-pension-entitlement-page.py
    python3 tools/pagebuild.py state-pension-entitlement    # the same build
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pagebuild import PAGES, build  # noqa: E402

if __name__ == '__main__':
    sys.exit(0 if build(PAGES['state-pension-entitlement']) else 1)
