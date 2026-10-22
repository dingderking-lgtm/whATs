"""Package the Vercel-ready source without preview output or QA screenshots."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib

root = Path(__file__).resolve().parent.parent
release = root / 'release'
release.mkdir(exist_ok=True)
files = [root / name for name in [
    'index.html', 'guide.html', 'troubleshooting.html', 'messages-files.html',
    'web-vs-desktop.html', 'about.html', 'privacy.html', '404.html',
    'package.json', 'package-lock.json', 'vercel.json', '.gitignore', 'README.md',
]]
for file in files:
    if not file.is_file():
        raise FileNotFoundError(f'Required release file is missing: {file}')
files += sorted((root / 'assets').rglob('*'))
files += sorted((root / 'scripts').rglob('*'))
files += [root / 'docs' / name for name in ['sources.md', 'acceptance.md', 'render-social.py', 'package-release.py']]
files = [file for file in files if file.is_file()]
archive = release / 'whatsapp-web-vercel.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED, compresslevel=9) as output:
    for file in files:
        output.write(file, file.relative_to(root).as_posix())
with ZipFile(archive) as output:
    assert output.testzip() is None
    assert 'vercel.json' in output.namelist()
    assert not any(name.startswith(('dist/', 'node_modules/', 'docs/qa/')) for name in output.namelist())
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(release / 'SHA256.txt').write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
print(f'{archive}\n{len(files)} files, {archive.stat().st_size} bytes\nSHA256 {digest}')
