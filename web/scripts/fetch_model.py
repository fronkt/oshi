"""Fetch a Poly Haven model (.blend + textures) for the hero render.

Poly Haven assets are CC0. Usage:
    python fetch_model.py potted_plant_01 [out_dir] [resolution]
Then render with scripts/bonsai_model.py. Default resolution 2k (plenty for the hero).
"""
import json, os, sys, urllib.request

API = "https://api.polyhaven.com/files/%s"


def grab(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return os.path.getsize(dest)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=180) as r, open(dest, "wb") as f:
        f.write(r.read())
    return os.path.getsize(dest)


def main():
    aid = sys.argv[1] if len(sys.argv) > 1 else "potted_plant_01"
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(".", "_model", aid)
    res = sys.argv[3] if len(sys.argv) > 3 else "2k"
    with urllib.request.urlopen(API % aid, timeout=60) as r:
        d = json.loads(r.read().decode("utf-8"))
    if res not in d["blend"]:
        res = list(d["blend"].keys())[0]
    node = d["blend"][res]["blend"]
    blendpath = os.path.join(out, os.path.basename(node["url"]))
    print("blend %s -> %d KB  (%s)" % (res, grab(node["url"], blendpath) // 1024, blendpath))
    for rel, meta in node.get("include", {}).items():
        u = meta["url"] if isinstance(meta, dict) else meta
        rel = rel.replace(chr(92), "/")
        print("  tex %s -> %d KB" % (rel, grab(u, os.path.join(out, rel)) // 1024))


if __name__ == "__main__":
    main()
