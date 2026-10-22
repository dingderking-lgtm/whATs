"""Regenerate the local social preview card; not needed for deployment."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import io
import cairosvg

root = Path(__file__).resolve().parent.parent
scale = 2
image = Image.new('RGB', (1200 * scale, 630 * scale), '#fcfaf6')
draw = ImageDraw.Draw(image)
regular = 'C:/Windows/Fonts/msyh.ttc'
bold = 'C:/Windows/Fonts/msyhbd.ttc'

def text(position, content, size, color='#172e27', heavy=False):
    draw.text(tuple(round(v * scale) for v in position), content,
              font=ImageFont.truetype(bold if heavy else regular, size * scale), fill=color)

def rect(bounds, radius, color):
    draw.rounded_rectangle(tuple(v * scale for v in bounds), radius * scale, fill=color)

logo_bytes = cairosvg.svg2png(url=str(root / 'assets/whatsapp-icon.svg'), output_width=92, output_height=92)
logo = Image.open(io.BytesIO(logo_bytes)).convert('RGBA')
image.paste(logo, (144, 124), logo)
text((134, 63), 'WhatsApp Web', 26, heavy=True)
text((75, 183), '让对话，', 62, heavy=True)
text((75, 267), '在电脑上继续。', 62, '#148745', heavy=True)
text((79, 385), '官方入口  /  设备关联教程  /  常见问题', 21, '#637560')
rect((77, 461, 329, 518), 29, '#25d366')
text((104, 473), 'WhatsApp 网页版', 22, heavy=True)
draw.ellipse((760*scale, 95*scale, 1160*scale, 495*scale), fill='#e5eedb')
rect((730, 176, 1117, 390), 18, '#ffffff')
rect((755, 203, 954, 258), 12, '#edf2e9')
text((778, 216), '周末一起出发？', 19)
rect((839, 281, 1090, 343), 12, '#d4f7b4')
text((860, 297), '好呀，电脑上接着聊。', 18)
text((76, 568), '独立中文使用指南 · 非 WhatsApp 官方网站', 16, '#6e7e68')
image.resize((1200, 630), Image.Resampling.LANCZOS).save(root / 'assets/og-cover.png', optimize=True)
print('Created assets/og-cover.png (1200 x 630)')
