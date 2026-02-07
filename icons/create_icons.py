from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    # Create image with gradient-like background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (purple)
    for i in range(size):
        color_val = int(102 + (118 - 102) * i / size)
        draw.rectangle([(0, i), (size, i+1)], fill=(color_val, 126, 234, 255))
    
    # Draw two chat bubbles representing debate
    margin = size // 6
    bubble_height = size // 3
    bubble_width = int(size * 0.6)
    
    # Left bubble (ChatGPT)
    draw.ellipse([margin, margin, margin + bubble_width, margin + bubble_height], 
                 fill=(255, 255, 255, 230))
    
    # Right bubble (Gemini) - offset
    right_margin = size - margin - bubble_width
    top_margin = size - margin - bubble_height
    draw.ellipse([right_margin, top_margin, right_margin + bubble_width, top_margin + bubble_height], 
                 fill=(255, 255, 255, 180))
    
    # Save
    img.save(f'icon{size}.png', 'PNG')
    print(f'Created icon{size}.png')

# Create icons in different sizes
for size in [16, 48, 128]:
    create_icon(size)

print('All icons created successfully!')
