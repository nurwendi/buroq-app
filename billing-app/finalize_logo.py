import base64
from PIL import Image
import io

# Load the recovered PNG
with open('/tmp/test_logo.png', 'rb') as f:
    img = Image.open(f)
    
    # Flatten onto white background
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        img = img.convert('RGBA')
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    else:
        img = img.convert("RGB")
    
    # Convert to monochrome (1-bit)
    bw = img.convert("1")
    
    buf = io.BytesIO()
    bw.save(buf, format="PNG")
    new_b64 = base64.b64encode(buf.getvalue()).decode()
    
    # Read the current logo.ts to preserve comments etc
    with open('src/constants/logo.ts', 'r') as f:
        content = f.read()
    
    import re
    new_content = re.sub(r'BUROQ_LOGO_BASE64 = ".*?";', f'BUROQ_LOGO_BASE64 = "{new_b64}";', content, flags=re.DOTALL)
    
    with open('src/constants/logo.ts', 'w') as f:
        f.write(new_content)
    
    print("SUCCESS: Logo updated with clean monochrome version")
