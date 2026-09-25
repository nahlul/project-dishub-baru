import json

with open("data/halte_campus.json", "r", encoding="utf-8") as f:
    campus = json.load(f)
with open("data/halte_darussalam.json", "r", encoding="utf-8") as f:
    darussalam = json.load(f)

print("In Darussalam:", any(h["nama"] == "Shelter Bundaran UIN 1" for h in darussalam))
print("In Campus:", any(h["nama"] == "Shelter Bundaran UIN 1" for h in campus))

uin_haltes_darussalam = [h["nama"] for h in darussalam if "uin" in h["nama"].lower()]
print("UIN haltes in Darussalam:", uin_haltes_darussalam)
