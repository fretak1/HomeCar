import re
import os

file_path = r"c:\Users\Fretak\Desktop\HomeCar\server\prisma\seed_synthetic.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

coords = {
    '"Addis Ababa"': 'lat: 9.032, lng: 38.748,',
    '"Tigray"': 'lat: 13.496, lng: 39.475,',
    '"Afar"': 'lat: 11.792, lng: 40.958,',
    '"Amhara"': 'lat: 11.593, lng: 37.390,',
    '"Oromia"': 'lat: 8.541, lng: 39.270,',
    '"Somali"': 'lat: 9.350, lng: 42.800,',
    '"Benishangul-Gumuz"': 'lat: 10.066, lng: 34.533,',
    '"Gambela"': 'lat: 8.250, lng: 34.583,',
    '"Harari"': 'lat: 9.312, lng: 42.124,',
    '"Sidama"': 'lat: 7.050, lng: 38.467,',
    '"South Ethiopia"': 'lat: 6.860, lng: 37.760,',
    '"Central Ethiopia"': 'lat: 7.550, lng: 37.850,',
    '"South West Ethiopia"': 'lat: 7.266, lng: 36.233,',
    '"Dire Dawa"': 'lat: 9.600, lng: 41.866,'
}

for key, latlng in coords.items():
    # Find the line with `city: "..."` following the region key
    pattern = r'(' + key + r': {\s*city: "[^"]+",)'
    replacement = r'\1\n    ' + latlng
    content = re.sub(pattern, replacement, content)

# update math random
content = content.replace('lat: 9.0 + Math.random() * 0.5,', 'lat: (regionData.lat || 9.0) + (Math.random() - 0.5) * 0.05,')
content = content.replace('lng: 38.7 + Math.random() * 0.5', 'lng: (regionData.lng || 38.7) + (Math.random() - 0.5) * 0.05')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Coordinates successfully patched into seed_synthetic.ts!")
