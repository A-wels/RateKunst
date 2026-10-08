#!/usr/bin/env python3
"""Validate ELF load segments in the actual AAB and SDK startup manifest."""
import struct
import sys
import zipfile
from pathlib import Path

bundle = Path(sys.argv[1])
checked = []
failures = []
with zipfile.ZipFile(bundle) as archive:
    for name in archive.namelist():
        if not name.endswith('.so') or not any('/' + abi + '/' in name for abi in ('arm64-v8a', 'x86_64')):
            continue
        data = archive.read(name)
        assert data[:5] == b'\x7fELF\x02', 'Expected ELF64: ' + name
        endian = '<' if data[5] == 1 else '>'
        offset = struct.unpack_from(endian + 'Q', data, 32)[0]
        size, count = struct.unpack_from(endian + 'HH', data, 54)
        segments = [struct.unpack_from(endian + 'IIQQQQQQ', data, offset + i * size) for i in range(count)]
        loads = [segment for segment in segments if segment[0] == 1]
        assert loads, 'No LOAD segments: ' + name
        if any(segment[7] < 16384 or (segment[2] - segment[3]) % 16384 != 0 for segment in loads):
            failures.append(name)
        checked.append(name)
assert checked, 'No 64-bit libraries found'
assert not failures, 'Libraries incompatible with 16 KB pages: ' + ', '.join(failures)
manifest_root = bundle.parents[3] / 'intermediates/merged_manifests/release'
manifests = list(manifest_root.rglob('AndroidManifest.xml'))
assert manifests, 'Release merged manifest missing: ' + str(manifest_root)
for manifest in manifests:
    assert 'MobileAdsInitProvider' not in manifest.read_text(), 'AdMob startup provider still enabled'
print(f'PASS: {len(checked)} ELF64 libraries aligned for 16 KB pages; AdMob startup provider disabled.')
