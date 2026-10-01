"""Preserve originals and encode same-size WebP assets; no visual editing."""
from pathlib import Path
from PIL import Image
import json

files = [Path('public/images') / name for name in ['host-cta-cutout.png', 'kiosk-hero.png', 'host-cta.jpg', 'step-1-qr.jpg', 'step-2-upload.jpg', 'step-3-settings.jpg', 'step-4-collect.jpg']]
files += [Path('public/models') / name for name in ['kiosk-front.png', 'kiosk-side.png']]
results = []
for src in files:
    with Image.open(src) as image:
        dest = src.with_suffix('.webp')
        image.save(dest, 'WEBP', quality=94 if src.parent.name == 'models' else 88, method=4)
        with Image.open(dest) as check:
            assert check.size == image.size
            assert ('A' in check.mode) == ('A' in image.mode)
        result = {'source': str(src), 'webp': str(dest), 'width': image.width, 'height': image.height, 'beforeBytes': src.stat().st_size, 'afterBytes': dest.stat().st_size, 'mode': image.mode}
        results.append(result)
        print(json.dumps(result), flush=True)
        if src.parent.name == 'images':
            for width in ([400, 800] if src.stem.startswith('step-') else [480, 768]):
                resized = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
                variant = src.with_name(f'{src.stem}-{width}.webp')
                resized.save(variant, 'WEBP', quality=88, method=4)
                with Image.open(variant) as check:
                    assert check.size == resized.size
                    assert ('A' in check.mode) == ('A' in image.mode)
                results.append({'source': str(src), 'webp': str(variant), 'width': resized.width, 'height': resized.height, 'beforeBytes': src.stat().st_size, 'afterBytes': variant.stat().st_size, 'mode': image.mode})
Path('docs/seo/image-optimization.json').write_text(json.dumps(results, indent=2))
