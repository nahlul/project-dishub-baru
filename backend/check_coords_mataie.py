import json

with open("data/halte_coords.json", "r", encoding="utf-8") as f:
    coords = json.load(f)

for name in ["Halte Mata Ie 1", "Halte Mata Ie 2", "Shelter Bundaran UIN 1", "Shelter Bundaran UIN 2"]:
    print(f"{name}: {coords.get(name)}")
