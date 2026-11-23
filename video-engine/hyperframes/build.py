import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
source = Path(sys.argv[1] if len(sys.argv) > 1 else "../../source.json").resolve()
data = json.loads(source.read_text(encoding="utf-8"))

if int(data.get("schema", 0)) != 10:
    raise SystemExit("Cotativa Motion Director V2 schema 10 required")
if data.get("engine") != "hyperframes":
    raise SystemExit("engine=hyperframes required")
if data.get("motion_director") != "cotativa_motion_director_v2":
    raise SystemExit("cotativa_motion_director_v2 required")
if data.get("creative_style") != "motion_stage_v2":
    raise SystemExit("motion_stage_v2 required")
motion = data.get("motion") or {}
if motion.get("version") != "cotativa-motion-runtime-v2":
    raise SystemExit("cotativa-motion-runtime-v2 required")
if motion.get("runtime_policy") != "director_exclusive":
    raise SystemExit("Motion Director V2 must own the timeline exclusively")
if motion.get("recipes") or motion.get("packs"):
    raise SystemExit("Legacy recipes/packs are forbidden in Motion V2")
if data.get("narrative_model") != "retention_ladder_v1":
    raise SystemExit("retention_ladder_v1 required")
if motion.get("narrative_model") != "retention_ladder_v1":
    raise SystemExit("Motion runtime must preserve retention_ladder_v1")
master = data.get("master_template") or {}
if master.get("role") != "technical_shell" or master.get("creative_authority") is not False:
    raise SystemExit("Master template must be a non-creative technical shell")

scenes = list(data.get("scenes") or [])
if not 3 <= len(scenes) <= 6:
    raise SystemExit("Motion V2 retention contract requires 3 to 6 scenes")
if int(data.get("scene_count") or 0) != len(scenes):
    raise SystemExit("scene_count must match scenes length")
roles = [str((scene or {}).get("role") or "") for scene in scenes]
if not roles or roles[0] != "hook" or roles[-1] != "cta":
    raise SystemExit("Retention narrative must start with hook and end with cta")
if any((scene or {}).get("director") != "cotativa_motion_director_v2" for scene in scenes):
    raise SystemExit("Every scene must belong to cotativa_motion_director_v2")
if any(((scene or {}).get("motion_direction") or {}).get("timeline") != "relative" for scene in scenes):
    raise SystemExit("Every scene must use relative timing")

brand = data.get("brand") or {}
master_template = data.get("master_template") or {}
master_template_id = str(master_template.get("id") or "saas_dashboard")
theme = data.get("theme") or {}
icon_pack = str(data.get("icon_pack") or "lucide")
watermark = data.get("watermark") or {"enabled": True, "mode": "subtle", "variant": "auto", "position": "center"}
template = (ROOT / "index.template.tpl").read_text(encoding="utf-8")

def esc(value):
    return html.escape(str(value or ""), quote=True)

def safe_json(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

theme_colors = dict((theme.get("colors") or {}))
accent = str(theme_colors.get("accent") or "#7DD3FC")
primary = str(theme_colors.get("primary") or "#3B82F6")
bg = str(theme_colors.get("bg") or "#061625")

scene_durations = [
    max(1.8, min(5.5, float((scene or {}).get("hold_seconds") or data.get("seconds_per_scene") or 2.65)))
    for scene in scenes
]
scene_starts = []
cursor = 0.0
for duration in scene_durations:
    scene_starts.append(round(cursor, 3))
    cursor += duration
total_duration = round(cursor, 3)
if any(scene_starts[i] >= scene_starts[i+1] for i in range(len(scene_starts)-1)):
    raise SystemExit("Motion V2 scene starts must be strictly increasing")
if total_duration < 8.0 or total_duration > 30.0:
    raise SystemExit("Motion V2 total duration outside retention short-form target")
target_duration = float(data.get("duration_target_seconds") or total_duration)
if abs(target_duration-total_duration) > 0.15:
    raise SystemExit("duration_target_seconds does not match scene holds")

scene_ids = [f"scene-{i}" for i in range(len(scenes))]
scene_sections_html = "\n".join(
    f'  <section id="scene-{i}" class="clip{" hero" if i == 0 else ""}" '
    f'data-start="{scene_starts[i]:.3f}" data-duration="{scene_durations[i]:.3f}" '
    f'data-track-index="1"><div class="scene-inner"></div></section>'
    for i in range(len(scenes))
)

values = {
    "BRAND_NAME": esc(brand.get("name") or "COTATIVA"),
    "BRAND_SITE": esc(brand.get("site") or "cotativa.com"),
    "BRAND_TAGLINE": esc(brand.get("tagline") or "TECNOLOGIA PARA NEGÓCIOS"),
    "BRAND_CONFIG_JSON": safe_json(brand),
    "CREATIVE_STYLE": esc(data.get("creative_style") or "motion_stage_v2"),
    "MOTION_CONFIG_JSON": safe_json(data.get("motion") or {}),
    "MASTER_TEMPLATE_ID": esc(master_template_id),
    "MASTER_TEMPLATE_CONFIG_JSON": safe_json(master_template),
    "THEME_CONFIG_JSON": safe_json(theme),
    "ICON_PACK": esc(icon_pack),
    "WATERMARK_CONFIG_JSON": safe_json(watermark),
    "SCENES_CONFIG_JSON": safe_json(scenes),
    "THEME_BG": esc(bg),
    "THEME_PRIMARY": esc(primary),
    "THEME_ACCENT": esc(accent),
    "TOTAL_DURATION": f"{total_duration:.3f}",
    "SCENE_STARTS_JSON": safe_json(scene_starts),
    "SCENE_IDS_JSON": safe_json(scene_ids),
    "SCENE_SECTIONS_HTML": scene_sections_html,
}
for key, value in values.items():
    template = template.replace("{{" + key + "}}", value)

(ROOT / "index.html").write_text(template, encoding="utf-8")

assets = ROOT / "assets"
icons_out = assets / "icons"
brand_out = assets / "brand"
icons_out.mkdir(parents=True, exist_ok=True)
brand_out.mkdir(parents=True, exist_ok=True)

brand_mask_src = ROOT.parent.parent / "assets" / "img" / "logo-cotativa-horizontal-claro.webp"
if not brand_mask_src.exists():
    raise SystemExit("Official Cotativa horizontal logo asset not found")
shutil.copy2(brand_mask_src, brand_out / "cotativa-horizontal.webp")

pack_dirs = {
    "lucide": "lucide",
    "tabler": "tabler",
    "phosphor": "ph",
    "heroicons": "heroicons",
    "carbon": "carbon",
}
pack_dir = pack_dirs.get(icon_pack, "lucide")
icons_json = ROOT / "node_modules" / "@iconify-json" / pack_dir / "icons.json"
if not icons_json.exists():
    raise SystemExit(f"Icon pack not installed: {icon_pack}")

pack_data = json.loads(icons_json.read_text(encoding="utf-8"))
pack_icons = dict(pack_data.get("icons") or {})
pack_width = int(pack_data.get("width") or 24)
pack_height = int(pack_data.get("height") or 24)

ALIASES = {
    "lucide": {
        "search":["search"],"world":["globe-2","globe"],"chart":["chart-no-axes-column-increasing","chart-bar","bar-chart-3"],
        "message":["message-circle","messages-square"],"map":["map-pin"],"target":["target"],"megaphone":["megaphone"],
        "users":["users"],"laptop":["laptop"],"rocket":["rocket"],"code":["code-2","code"],"lightbulb":["lightbulb"],
        "shield":["shield-check"],"gauge":["gauge"],"mobile":["smartphone"],"money":["circle-dollar-sign","badge-dollar-sign"],
        "check":["badge-check","circle-check-big"],"click":["mouse-pointer-click"],"workflow":["workflow"],"sparkles":["sparkles"],
        "robot":["bot"],"cart":["shopping-cart"],"building":["building-2","building"],"growth":["trending-up"],"arrow":["arrow-right"],
        "seo":["search-check","search"],"ad":["badge-dollar-sign","megaphone"]
    },
    "tabler": {
        "search":["search"],"world":["world-www","world"],"chart":["chart-bar"],"message":["message-circle"],"map":["map-pin"],
        "target":["target-arrow","target"],"megaphone":["ad","speakerphone"],"users":["users"],"laptop":["device-laptop"],
        "rocket":["rocket"],"code":["code"],"lightbulb":["bulb"],"shield":["shield-check"],"gauge":["gauge"],
        "mobile":["device-mobile"],"money":["currency-dollar"],"check":["rosette-discount-check","circle-check"],"click":["click"],
        "workflow":["hierarchy-2","route"],"sparkles":["sparkles"],"robot":["robot"],"cart":["shopping-cart"],"building":["building"],
        "growth":["trending-up"],"arrow":["arrow-right"],"seo":["seo","search"],"ad":["ad"]
    },
    "phosphor": {
        "search":["magnifying-glass"],"world":["globe"],"chart":["chart-bar"],"message":["chat-circle","chats-circle"],
        "map":["map-pin"],"target":["target"],"megaphone":["megaphone"],"users":["users"],"laptop":["laptop"],
        "rocket":["rocket"],"code":["code"],"lightbulb":["lightbulb"],"shield":["shield-check"],"gauge":["gauge"],
        "mobile":["device-mobile"],"money":["currency-dollar"],"check":["seal-check","check-circle"],"click":["cursor-click"],
        "workflow":["flow-arrow","arrows-left-right"],"sparkles":["sparkle"],"robot":["robot"],"cart":["shopping-cart"],
        "building":["buildings","building"],"growth":["trend-up"],"arrow":["arrow-right"],"seo":["magnifying-glass","globe"],
        "ad":["megaphone"]
    },
    "heroicons": {
        "search":["magnifying-glass"],"world":["globe-alt"],"chart":["chart-bar"],"message":["chat-bubble-left-right"],
        "map":["map-pin"],"target":["cursor-arrow-rays"],"megaphone":["megaphone"],"users":["user-group"],
        "laptop":["computer-desktop"],"rocket":["rocket-launch"],"code":["code-bracket"],"lightbulb":["light-bulb"],
        "shield":["shield-check"],"gauge":["presentation-chart-line"],"mobile":["device-phone-mobile"],"money":["currency-dollar"],
        "check":["check-badge"],"click":["cursor-arrow-ripple"],"workflow":["arrows-right-left"],"sparkles":["sparkles"],
        "robot":["cpu-chip"],"cart":["shopping-cart"],"building":["building-office-2","building-office"],"growth":["arrow-trending-up"],
        "arrow":["arrow-right"],"seo":["magnifying-glass"],"ad":["megaphone"]
    },
    "carbon": {
        "search":["search"],"world":["earth","earth-filled"],"chart":["chart-bar"],"message":["chat"],"map":["location"],
        "target":["target"],"megaphone":["bullhorn"],"users":["user-multiple"],"laptop":["laptop"],"rocket":["rocket"],
        "code":["code"],"lightbulb":["idea"],"shield":["security"],"gauge":["dashboard"],"mobile":["mobile"],
        "money":["currency-dollar"],"check":["checkmark-outline","checkmark-filled"],"click":["cursor-1"],"workflow":["flow"],
        "sparkles":["sparkle"],"robot":["bot"],"cart":["shopping-cart"],"building":["building"],"growth":["growth"],
        "arrow":["arrow-right"],"seo":["search"],"ad":["bullhorn"]
    },
}

NORMALIZE = {
    "world-www":"world","chart-bar":"chart","message-circle":"message","map-pin":"map","target-arrow":"target",
    "ad":"ad","users":"users","device-laptop":"laptop","seo":"seo","search":"search",
    "brand-google":"brand-google","brand-whatsapp":"brand-whatsapp"
}

SEMANTICS = {
    "search","world","chart","message","map","target","megaphone","users","laptop","rocket","code","lightbulb",
    "shield","gauge","mobile","money","check","click","workflow","sparkles","robot","cart","building","growth","arrow","seo","ad"
}
for scene in scenes:
    raw = str(scene.get("icon") or "world")
    SEMANTICS.add(NORMALIZE.get(raw, raw))

def pick_icon_name(semantic):
    aliases = (ALIASES.get(icon_pack) or ALIASES["lucide"]).get(semantic, [semantic])
    for candidate in aliases:
        if candidate in pack_icons:
            return candidate
    tokens = [x for x in re.split(r"[-_ ]+", semantic) if x]
    for name in pack_icons.keys():
        if all(tok in name for tok in tokens[:1]):
            return name
    for fallback_name in ["circle","question-mark-circle","information","info","dot-mark"]:
        if fallback_name in pack_icons:
            return fallback_name
    return next(iter(pack_icons.keys()))

def materialize_icon(semantic):
    name = pick_icon_name(semantic)
    icon = pack_icons[name]
    width = int(icon.get("width") or pack_width)
    height = int(icon.get("height") or pack_height)
    body = str(icon.get("body") or "").replace("currentColor", accent)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" aria-hidden="true">{body}</svg>'
    )
    (icons_out / f"{semantic}.svg").write_text(svg, encoding="utf-8")

for semantic in sorted(SEMANTICS):
    if re.fullmatch(r"[a-z0-9-]+", semantic):
        materialize_icon(semantic)

source_icons = ROOT.parent.parent / "assets" / "video" / "tabler"
for brand_name in ["brand-google","brand-whatsapp"]:
    src = source_icons / (brand_name + ".svg")
    if src.exists():
        raw = src.read_text(encoding="utf-8").replace("currentColor", accent)
        (icons_out / (brand_name + ".svg")).write_text(raw, encoding="utf-8")

wa = source_icons / "brand-whatsapp.svg"
if wa.exists():
    raw = wa.read_text(encoding="utf-8").replace("currentColor", bg)
    (icons_out / "brand-whatsapp-dark.svg").write_text(raw, encoding="utf-8")

gsap_src = ROOT / "node_modules" / "gsap" / "dist" / "gsap.min.js"
if gsap_src.exists():
    shutil.copy2(gsap_src, assets / "gsap.min.js")

shader_src = ROOT / "node_modules" / "@hyperframes" / "shader-transitions" / "dist" / "index.global.js"
if shader_src.exists():
    shutil.copy2(shader_src, assets / "shader-transitions.js")

for name in [
    "premium-motion.js","master-templates.js","master-template-registry.json",
    "theme-registry.json","icon-pack-registry.json","watermark-registry.json"
]:
    src = ROOT / name
    if src.exists():
        shutil.copy2(src, assets / name)

print(json.dumps({
    "engine": "hyperframes",
    "engine_version": data.get("engine_version") or "0.8.81",
    "scenes": len(scenes),
    "creative_style": data.get("creative_style"),
    "master_template": master_template_id,
    "theme": theme.get("id"),
    "icon_pack": icon_pack,
    "watermark": {
        "enabled": bool(watermark.get("enabled", True)),
        "mode": watermark.get("mode") or "subtle",
        "variant": watermark.get("variant") or "auto",
    },
    "motion_pack": (data.get("motion") or {}).get("version"),
    "motion_profile": (data.get("motion") or {}).get("profile"),
    "shader_transitions": [x.get("shader") for x in ((data.get("motion") or {}).get("transitions") or [])],
}, ensure_ascii=False))
