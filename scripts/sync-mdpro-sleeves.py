"""从 MDPro3 Protector 资源包提取全部静态卡套图，保留多贴图版本。

依赖：uv run --with UnityPy python scripts/sync-mdpro-sleeves.py SOURCE
SOURCE 是 MasterDuel/Protector，资源包版本记录在输出清单中。
"""
import argparse
import concurrent.futures
import json
import re
from pathlib import Path
import UnityPy

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--revision', default='unknown')
parser.add_argument('--names', type=Path, help='MDPro3 Data/locales/zh-CN/IDS/IDS_ITEM.txt')
args = parser.parse_args()
names = dict(re.findall(r'\[IDS_ITEM\.ID(\d+)\]\s*\n([^\n]+)', args.names.read_text() if args.names else ''))
root = Path(__file__).resolve().parents[1]
out = root / 'neos-assets/sleeves'
out.mkdir(parents=True, exist_ok=True)

def convert(folder):
    entries = []
    env = UnityPy.load(str(folder))
    for obj in env.objects:
        if obj.type.name != 'Texture2D': continue
        tex = obj.read()
        if not re.fullmatch(r'ProtectorIcon\d+(?:_\d+)?', tex.m_Name): continue
        identity = tex.m_Name.removeprefix('ProtectorIcon')
        filename = identity + '.webp'
        tex.image.save(out / filename, 'WEBP', quality=88, method=6)
        code, _, variant = identity.partition('_')
        name = names.get(code, f'卡套 {code}') + (f' · {variant}' if variant else '')
        entries.append({'id': identity, 'name': name, 'file': filename})
    if not entries: raise RuntimeError(f'No protector texture in {folder}')
    return entries

folders = sorted(p for p in args.source.iterdir() if p.is_dir() and p.name.isdigit())
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    entries = [e for group in pool.map(convert, folders) for e in group]
entries.sort(key=lambda item: item['id'])
assert len({entry['id'] for entry in entries}) == len(entries)
(root / 'src/config/sleeves.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n')
(out / 'source.json').write_text(json.dumps({
    'repository': 'https://code.moenext.com/sherry_chaos/mdpro3-assetbundles',
    'revision': args.revision,
    'path': 'StandaloneWindows64/MasterDuel/Protector',
    'protectors': len(folders),
    'textures': len(entries),
    'format': 'WebP',
    'quality': 88,
}, indent=2) + '\n')
print(f'Converted {len(entries)} static sleeve textures from {len(folders)} protectors')
