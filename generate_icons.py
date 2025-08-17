import os
from PIL import Image, ImageDraw, ImageFont
import math

def create_icon(size, filename):
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a circular background with gradient-like effect
    center = size // 2
    radius = center - 10
    
    # Background circle
    draw.ellipse([10, 10, size-10, size-10], fill=(102, 126, 234, 255))
    
    # Inner circle for modern look
    inner_radius = radius * 0.7
    inner_start = center - inner_radius
    inner_end = center + inner_radius
    draw.ellipse([inner_start, inner_start, inner_end, inner_end], fill=(118, 75, 162, 255))
    
    # Add "E" letter for EarnPro
    try:
        # Try to use a basic font
        font_size = int(size * 0.4)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Draw "E" in the center
    text = "E"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2
    
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
    
    # Save the image
    img.save(f'public/{filename}', 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Create the required icon sizes
icon_sizes = [
    (192, 'pwa-192x192.png'),
    (512, 'pwa-512x512.png'),
    (192, 'icon-192x192.png'),
    (512, 'icon-512x512.png'),
    (180, 'apple-touch-icon.png'),
    (32, 'favicon-32x32.png'),
    (16, 'favicon-16x16.png')
]

# Create public directory if it doesn't exist
os.makedirs('public', exist_ok=True)

for size, filename in icon_sizes:
    create_icon(size, filename)

print("All icons created successfully!")
