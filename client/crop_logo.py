from PIL import Image, ImageChops

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def crop_logo(path):
    try:
        img = Image.open(path)
        img = img.convert("RGBA")
        trimmed = trim(img)
        trimmed.save(path)
        print(f"Successfully cropped {path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    crop_logo("public/logo.png")
