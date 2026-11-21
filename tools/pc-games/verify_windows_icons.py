"""Verify an icon group in each shipped PE resource against the original ICO frames."""
import struct
from pathlib import Path

import pefile


def verify_icons(ico, images):
    source = Path(ico).read_bytes()
    reserved, kind, count = struct.unpack_from('<HHH', source)
    if reserved or kind != 1 or not count:
        raise ValueError('Invalid game ICO')
    frames = {}
    for i in range(count):
        width, height, _, _, _, _, length, start = struct.unpack_from('<4B2H2I', source, 6 + i * 16)
        frames[width or 256, height or 256] = source[start:start + length]
    results = {}
    for image in images:
        with pefile.PE(str(image), fast_load=True) as pe:
            pe.parse_data_directories(directories=[pefile.DIRECTORY_ENTRY['IMAGE_DIRECTORY_ENTRY_RESOURCE']])
            resources = {}
            for item in pe.DIRECTORY_ENTRY_RESOURCE.entries:
                if item.id not in (3, 14):  # RT_ICON, RT_GROUP_ICON
                    continue
                for name in item.directory.entries:
                    for language in name.directory.entries:
                        entry = language.data.struct
                        key = name.id if name.id is not None else str(name.name)
                        resources[item.id, key] = pe.get_data(entry.OffsetToData, entry.Size)
        for (kind, name), group in resources.items():
            if kind != 14:
                continue
            _, _, n = struct.unpack_from('<HHH', group)
            actual = {}
            for i in range(n):
                width, height, _, _, _, _, _, resource = struct.unpack_from('<4B2HIH', group, 6 + 14 * i)
                actual[width or 256, height or 256] = resources[3, resource]
            if actual == frames:
                results[Path(image).name] = {'group': name, 'sizes': sorted(w for w, h in frames)}
                break
        else:
            raise ValueError(f'{image} does not embed the complete original game icon')
    return results
