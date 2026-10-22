#!/usr/bin/env python3
import argparse, json, math, re, unicodedata
from pathlib import Path

import duckdb

def norm(value: str) -> str:
    value = (value or "").strip().lower()
    value = "".join(c for c in unicodedata.normalize("NFKD", value) if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

PROFILES = [
    (["desentupid","desentupimento","encanador","hidraulic","encanamento","esgoto"], ["plumber","plumbing_service","sewer_service","drainage_service","septic_system_service"], ["desentupid","desentupimento","encanador","hidraulic","encanamento","esgoto","plumb","sewer","drain"]),
    (["aquecedor","aquecimento","boiler","gasista"], ["hvac_services","hvac_supplier","water_heater_installation_repair","solar_installation"], ["aquec","boiler","water heater","hvac"]),
    (["energia solar","solar","fotovolta"], ["solar_installation","solar_panel_cleaning","hvac_supplier"], ["solar","fotovolta","energia"]),
    (["paviment","asfalto","asfalt"], ["paving_contractor","general_contractor","construction_company"], ["paviment","asfalt","cbuq","terraplen"]),
    (["veterin","clinica veterin","oncologia veterin"], ["veterinarian","veterinary_clinic","animal_hospital"], ["veterin","pet","animal"]),
    (["pet shop","petshop","banho e tosa"], ["pet_store","pet_groomer"], ["pet","banho","tosa"]),
    (["restaurante","pizzaria","hamburguer","lanchonete"], ["restaurant","pizza","burger_restaurant","fast_food_restaurant"], ["restaurant","pizz","hamburg","lanch"]),
    (["dentista","odontolog"], ["dentist","dental_clinic"], ["dent","odont"]),
    (["clinica","medico","saude"], ["medical_clinic","doctor","hospital"], ["clinic","medic","saude"]),
    (["imobiliaria","imoveis"], ["real_estate_agent","real_estate_services"], ["imobili","imoveis"]),
    (["contabil","contabilidade","contador"], ["accountant","accounting_service"], ["contab","contador"]),
    (["advogado","advocacia"], ["lawyer","law_firm"], ["advog","jurid"]),
    (["academia","fitness"], ["gym","fitness_center"], ["academia","fitness"]),
    (["hotel","pousada"], ["hotel","guest_house","inn"], ["hotel","pousada"]),
    (["oficina","mecanica","auto center"], ["auto_repair","car_repair","tire_shop"], ["oficina","mecan","auto"]),
    (["salao","cabeleireiro","barbearia","beleza"], ["beauty_salon","hair_salon","barber_shop"], ["salao","cabele","barbear","beleza"]),
    (["roupa","moda","confeccao"], ["clothing_store","fashion"], ["roupa","moda","confecc"]),
]

def profile(segment: str):
    n = norm(segment)
    for needles, categories, terms in PROFILES:
        if any(x in n for x in needles):
            return categories, terms
    parts = [p for p in n.split() if len(p) >= 3][:5]
    return [], parts or [n]

def sql_regex(values):
    cleaned = []
    for v in values:
        parts = [p for p in norm(v).split() if p]
        if parts:
            # Escape each token, not the wildcard between tokens. This lets
            # "plumbing_service" match taxonomy text serialized with underscores.
            cleaned.append(".*".join(re.escape(p) for p in parts))
    return "|".join(sorted(set(cleaned)))

def first_list(value):
    if value is None:
        return ""
    if isinstance(value, list):
        for x in value:
            if x:
                return str(x).strip()
        return ""
    return str(value).strip()

def parse_json(value, fallback):
    if value is None:
        return fallback
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return fallback

def haversine(lat1, lng1, lat2, lng2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2-lat1)
    dl = math.radians(lng2-lng1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def score(company):
    value = 50
    if company.get("phone"): value += 14
    if company.get("email"): value += 8
    if company.get("website"): value += 5
    else: value += 14
    if company.get("address"): value += 5
    if company.get("confidence", 0) >= .7: value += 4
    return max(0, min(96, value))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--segment", required=True)
    ap.add_argument("--lat", type=float, required=True)
    ap.add_argument("--lng", type=float, required=True)
    ap.add_argument("--radius-km", type=float, required=True)
    ap.add_argument("--release", default="2026-09-23.1")
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    radius = max(2.0, min(30.0, args.radius_km))
    dlat = radius / 111.2
    dlng = radius / max(30.0, 111.2 * math.cos(math.radians(args.lat)))
    min_lat, max_lat = args.lat-dlat, args.lat+dlat
    min_lng, max_lng = args.lng-dlng, args.lng+dlng

    categories, terms = profile(args.segment)
    name_rx = sql_regex(terms)
    cat_rx = sql_regex(categories)
    filters = []
    if name_rx:
        filters.append("regexp_matches(lower(coalesce(names.primary,'')), ?)")
    if cat_rx:
        filters.append("regexp_matches(lower(coalesce(taxonomy.primary,'')), ?)")
        filters.append("regexp_matches(lower(coalesce(basic_category,'')), ?)")
        filters.append("regexp_matches(lower(cast(taxonomy as varchar)), ?)")
    if not filters:
        filters.append("regexp_matches(lower(coalesce(names.primary,'')), ?)")

    params = [min_lng, max_lng, min_lat, max_lat]
    if name_rx:
        params.append(name_rx)
    if cat_rx:
        params.extend([cat_rx, cat_rx, cat_rx])
    if not name_rx and not cat_rx:
        params.append(sql_regex([args.segment]))

    path = f"s3://overturemaps-us-west-2/release/{args.release}/theme=places/type=place/*"
    query = f"""
      SELECT
        id,
        CAST(names AS JSON) AS names_json,
        basic_category,
        CAST(taxonomy AS JSON) AS taxonomy_json,
        confidence,
        CAST(websites AS JSON) AS websites_json,
        CAST(socials AS JSON) AS socials_json,
        CAST(emails AS JSON) AS emails_json,
        CAST(phones AS JSON) AS phones_json,
        CAST(addresses AS JSON) AS addresses_json,
        bbox.xmin AS lng,
        bbox.ymin AS lat
      FROM read_parquet('{path}', hive_partitioning=1)
      WHERE bbox.xmin BETWEEN ? AND ?
        AND bbox.ymin BETWEEN ? AND ?
        AND (operating_status IS NULL OR operating_status <> 'permanently_closed')
        AND ({' OR '.join(filters)})
      ORDER BY confidence DESC NULLS LAST
      LIMIT 500
    """

    con = duckdb.connect()
    con.execute("INSTALL httpfs;")
    con.execute("LOAD httpfs;")
    con.execute("SET s3_region='us-west-2';")
    rows = con.execute(query, params).fetchall()
    cols = [d[0] for d in con.description]

    results = []
    seen = set()
    for values in rows:
        row = dict(zip(cols, values))
        lat = float(row.get("lat") or 0)
        lng = float(row.get("lng") or 0)
        if not lat or not lng or haversine(args.lat, args.lng, lat, lng) > radius:
            continue

        names = parse_json(row.get("names_json"), {})
        taxonomy = parse_json(row.get("taxonomy_json"), {})
        websites = parse_json(row.get("websites_json"), [])
        socials = parse_json(row.get("socials_json"), [])
        emails = parse_json(row.get("emails_json"), [])
        phones = parse_json(row.get("phones_json"), [])
        addresses = parse_json(row.get("addresses_json"), [])

        name = str(names.get("primary") or "").strip()
        if not name:
            continue
        tax = str(taxonomy.get("primary") or row.get("basic_category") or "Empresa local").strip()
        addr = addresses[0] if isinstance(addresses, list) and addresses else {}
        if not isinstance(addr, dict):
            addr = {}
        freeform = str(addr.get("freeform") or "").strip()
        locality = str(addr.get("locality") or "").strip()
        region = str(addr.get("region") or "").strip()
        address = freeform or " · ".join([x for x in [locality, region] if x])

        company = {
            "source": "overture",
            "source_type": "place",
            "source_id": str(row.get("id") or ""),
            "name": name,
            "category": tax.replace("_", " ").title(),
            "address": address,
            "city": locality,
            "state": region,
            "phone": first_list(phones),
            "email": first_list(emails),
            "website": first_list(websites),
            "socials": socials if isinstance(socials, list) else [],
            "lat": lat,
            "lng": lng,
            "confidence": float(row.get("confidence") or 0),
            "overture_release": args.release,
        }
        company["score"] = score(company)
        key = (norm(name), norm(company["phone"]), norm(company["website"]))
        if key in seen:
            continue
        seen.add(key)
        results.append(company)

    payload = {
        "ok": True,
        "source": "Overture Places",
        "release": args.release,
        "segment": args.segment,
        "radius_km": radius,
        "center": {"lat": args.lat, "lng": args.lng},
        "count": len(results),
        "results": results[:250],
    }
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"count": payload["count"], "release": args.release, "output": str(out)}))

if __name__ == "__main__":
    main()
