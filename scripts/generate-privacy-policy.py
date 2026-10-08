#!/usr/bin/env python3
"""Keep the offline policy derived from the single bilingual HTML source."""
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

class PolicyParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sections = {}
        self.language = None
        self.block = None
        self.parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'section':
            self.language = attrs.get('lang')
            self.sections[self.language] = []
        if self.language and tag in ('h1', 'h2', 'p', 'address', 'li'):
            self.block = tag
            self.parts = []
        if self.block and tag == 'br':
            self.parts.append('\n')
        if self.block and tag == 'a':
            self.href = attrs.get('href', '')

    def handle_data(self, data):
        if self.block:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if self.block and tag == 'a' and self.href.startswith('https://'):
            self.parts.append(' (' + self.href + ')')
        if tag == self.block:
            self.sections[self.language].append({'kind': self.block, 'text': ''.join(self.parts).strip()})
            self.block = None
        if tag == 'section':
            self.language = None

parser = PolicyParser()
parser.feed((ROOT / 'docs/RateKunst-privacy-policy.html').read_text())
assert set(parser.sections) == {'de', 'en'}
for blocks in parser.sections.values():
    assert len([b for b in blocks if b['kind'] == 'h2']) == 10
content = json.dumps({'updated': '2026-10-08', 'sections': parser.sections}, ensure_ascii=False, indent=2) + '\n'
output = ROOT / 'assets/privacy-policy.json'
args = argparse.ArgumentParser()
args.add_argument('--check', action='store_true')
if args.parse_args().check:
    assert output.read_text() == content, 'Regenerate assets/privacy-policy.json'
else:
    output.write_text(content)
