#!/usr/bin/env python3
"""Generate A2P Atlas country dataset from AWS End User Messaging SMS table."""

import csv
import json
import re
import urllib.request
from pathlib import Path

OUT_PATHS = [
    Path(__file__).resolve().parents[1] / "src" / "a2p-atlas" / "data" / "countries.json",
    Path(__file__).resolve().parents[1] / "backend" / "data" / "countries.json",
    Path(__file__).resolve().parents[1] / "mcp" / "a2p-regulatory" / "data" / "countries.json",
]
ALPHA_CSV_URL = (
    "https://raw.githubusercontent.com/eGullGolf/countries-alphanumeric-sms-sender-support/"
    "master/alphasendersupport.csv"
)

# Parsed from AWS End User Messaging SMS country table (docs.aws.amazon.com)
AWS_ROWS = """
Afghanistan AF 93 No No Yes No Yes
Albania AL 355 No No Yes No Yes
Algeria DZ 213 No No Yes No Yes
Andorra AD 376 No No Yes No No
Angola AO 244 No No Yes No Yes
Anguilla AI 1-264 No No Yes No Yes
Antigua and Barbuda AG 1-268 No No Yes No Yes
Argentina AR 54 Yes No No No Yes
Armenia AM 374 No No Yes No Yes
Aruba AW 297 No No Yes No No
Australia AU 61 No Yes Registration required Yes Yes
Austria AT 43 Yes Yes Yes Yes Yes
Azerbaijan AZ 994 No No Yes No Yes
Bahamas BS 1-242 No No No No No
Bahrain BH 973 No No Yes No Yes
Bangladesh BD 880 No No Yes No Yes
Barbados BB 1-246 No No Yes No Yes
Belarus BY 375 No No Registration required No Yes
Belgium BE 32 Yes Yes No Yes Yes
Belize BZ 501 No No Yes No Yes
Bermuda BM 1-441 No No Yes No Yes
Bhutan BT 975 No No Yes No Yes
Bolivia BO 591 No No Yes No Yes
Bosnia and Herzegovina BA 387 No No Yes No Yes
Botswana BW 267 No No Yes No Yes
Brazil BR 55 Yes No No Yes Yes
Brunei BN 673 No No Yes No Yes
Bulgaria BG 359 Yes No Yes Yes Yes
Burkina Faso BF 226 No No Yes No Yes
Burundi BI 257 No No Yes No Yes
Cambodia KH 855 No No Yes No Yes
Cameroon CM 237 Yes No Yes Yes Yes
Canada CA 1 Yes Yes No Yes Yes
Cape Verde CV 238 No No Yes No Yes
Cayman Islands KY 1-345 No No No No Yes
Central African Republic CF 236 No No Yes No Yes
Chad TD 235 No No Yes No No
Chile CL 56 Yes Yes No Yes Yes
China CN 86 Yes No No Yes No
Colombia CO 57 Yes No No No Yes
Comoros KM 269 No No Yes No Yes
Cook Islands CK 682 No No Yes Yes Yes
Costa Rica CR 506 Yes Yes No Yes Yes
Croatia HR 385 Yes No Yes Yes Yes
Cyprus CY 357 No No Yes No Yes
Czechia CZ 420 No Yes Yes Yes Yes
Democratic Republic of the Congo CD 243 No No Yes No Yes
Denmark DK 45 No Yes Yes Yes Yes
Djibouti DJ 253 No No Yes No Yes
Dominica DM 1-767 No No Yes No Yes
Dominican Republic DO 1-809 Yes No No Yes Yes
Ecuador EC 593 Yes No No Yes Yes
Egypt EG 20 Yes No Registration required Yes Yes
El Salvador SV 503 No No No No Yes
Equatorial Guinea GQ 240 No No Yes No No
Eritrea ER 291 No No Yes No Yes
Estonia EE 372 No Yes Yes Yes Yes
Eswatini SZ 268 Yes No Yes Yes No
Ethiopia ET 251 No No Yes No No
Faroe Islands FO 298 No No Yes No Yes
Fiji FJ 679 No No Yes No Yes
Finland FI 358 Yes Yes Yes Yes Yes
France FR 33 Yes No Yes Yes Yes
French Guiana GF 594 No No Yes No Yes
French Polynesia PF 689 No No Yes No No
Gabon GA 241 No No Yes No Yes
Gambia GM 220 No No Yes No Yes
Georgia GE 995 No No Yes No Yes
Germany DE 49 Yes Yes Yes Yes Yes
Ghana GH 233 No Yes Yes Yes Yes
Gibraltar GI 350 No No Yes No No
Greece GR 30 No Yes Yes Yes No
Greenland GL 299 No No Yes No Yes
Grenada GD 1-473 No No Yes No Yes
Guadeloupe GP 590 No No Yes No Yes
Guam GU 1-671 No Yes No Yes Yes
Guatemala GT 502 No No No No Yes
Guernsey GG 44-1481 No No Yes No No
Guinea GN 224 No No Yes No Yes
Guinea-Bissau GW 245 No No Yes N/A No
Guyana GY 592 No No Yes No Yes
Haiti HT 509 No No Yes No Yes
Honduras HN 504 No Yes Yes Yes Yes
Hong Kong HK 852 No Yes Yes Yes Yes
Hungary HU 36 No Yes No Yes Yes
Iceland IS 354 No No Yes No Yes
India IN 91 Yes Yes Registration required Yes Yes
Indonesia ID 62 No No Registration required No Yes
Iraq IQ 964 No No Yes No Yes
Ireland IE 353 No Yes Registration required Yes No
Israel IL 972 No Yes Yes Yes Yes
Italy IT 39 Yes Yes Yes Yes Yes
Ivory Coast CI 225 No No Yes No Yes
Jamaica JM 1-876 No No Yes No Yes
Japan JP 81 Yes No Yes Yes Yes
Jersey JE 44-1434 No Yes Yes Yes No
Jordan JO 962 No No Registration required No Yes
Kazakhstan KZ 7 No No Registration required No Yes
Kenya KE 254 Yes Yes Registration required Yes Yes
Kosovo XK 383 No No Yes No No
Kuwait KW 965 No Yes Registration required Yes Yes
Kyrgyzstan KG 996 No No Yes No Yes
Laos LA 856 No No Yes No Yes
Latvia LV 371 No Yes Yes Yes Yes
Lebanon LB 961 No No Yes No Yes
Lesotho LS 266 Yes No Yes Yes Yes
Liberia LR 231 No Yes No No Yes
Libya LY 218 No No Yes No Yes
Liechtenstein LI 423 No No Yes No Yes
Lithuania LT 370 No Yes Yes Yes Yes
Luxembourg LU 352 No Yes Yes Yes Yes
Macau MO 853 No No Yes No Yes
Macedonia MK 389 No No Yes Yes Yes
Madagascar MG 261 No No Yes No Yes
Malawi MW 265 Yes No Yes Yes Yes
Malaysia MY 60 Yes No No Yes Yes
Maldives MV 960 No No Yes No Yes
Mali ML 223 No No Yes No Yes
Malta MT 356 No Yes Yes Yes Yes
Marshall Islands MH 692 No No No No No
Martinique MQ 596 No No Yes No No
Mauritania MR 222 No No Yes No Yes
Mauritius MU 230 No Yes Yes Yes Yes
Mayotte YT 262 No No Yes No No
Mexico MX 52 Yes No Yes Yes Yes
Micronesia FM 691 No No No No No
Moldova MD 373 No No Yes No Yes
Monaco MC 377 No No No No Yes
Mongolia MN 976 No No Yes No Yes
Montenegro ME 382 No No Yes No Yes
Montserrat MS 1-664 No No Yes No No
Morocco MA 212 Yes No Yes Yes Yes
Mozambique MZ 258 No No No No Yes
Myanmar MM 95 No Yes Yes Yes Yes
Namibia NA 264 Yes No Yes Yes Yes
Nepal NP 977 No No Yes No No
Netherlands NL 31 Yes Yes Yes Yes Yes
New Caledonia NC 687 No No Yes No Yes
New Zealand NZ 64 Yes No No Yes Yes
Nicaragua NI 505 No No No No Yes
Niger NE 227 No No Yes No Yes
Nigeria NG 234 Yes No Yes Yes Yes
Niue NU 683 No No Yes No Yes
Norfolk Island NF 672 No No Yes No No
Norway NO 47 No Yes Yes Yes Yes
Oman OM 968 No No Registration required No Yes
Pakistan PK 92 No Yes Yes No Yes
Palestine PS 970 No No Yes No Yes
Panama PA 507 Yes No Yes Yes Yes
Palau PW 680 No No Yes No No
Papua New Guinea PG 675 No No Yes No Yes
Paraguay PY 595 No No No No Yes
Peru PE 51 Yes No No Yes Yes
Philippines PH 63 No Yes Registration required No Yes
Poland PL 48 No Yes Yes Yes Yes
Portugal PT 351 Yes Yes Yes Yes Yes
Puerto Rico PR 1-787 Yes Yes No Yes Yes
Qatar QA 974 Yes No Registration required Yes Yes
Republic of the Congo CG 242 No No No No No
Réunion RE 262 No No Yes No Yes
Romania RO 40 Yes Yes Yes Yes Yes
Russia RU 7 Yes No Registration required Yes No
Rwanda RW 250 No No Yes No Yes
Saint Lucia LC 1-758 No No No No Yes
Samoa WS 685 No No Yes No No
San Marino SM 378 No No Yes No No
Saudi Arabia SA 966 No Yes Registration required No No
Senegal SN 221 No No Yes No No
Serbia RS 381 Yes No Yes Yes Yes
Seychelles SC 248 No No Yes No Yes
Sierra Leone SL 232 No No Yes No Yes
Singapore SG 65 Yes Yes Yes Yes Yes
Slovakia SK 421 No Yes Yes Yes Yes
Slovenia SI 386 No No Yes No Yes
Solomon Islands SB 677 No No Yes No Yes
Somalia SO 252 No No Yes No Yes
South Africa ZA 27 Yes Yes No Yes Yes
South Korea KR 82 No No No No Yes
South Sudan SS 211 No No Yes No No
Spain ES 34 Yes Yes Yes Yes Yes
Sri Lanka LK 94 Yes Yes Registration required Yes Yes
Suriname SR 597 No No Yes No Yes
Sweden SE 46 Yes Yes Yes Yes Yes
Switzerland CH 41 No No Yes No Yes
Taiwan TW 886 No Yes No Yes Yes
Tajikistan TJ 992 No No Yes No Yes
Tanzania TZ 255 No Yes Yes Yes No
Thailand TH 66 No Yes Registration required Yes Yes
Timor-Leste TL 670 No No Yes No Yes
Togo TG 228 No No Yes No No
Tonga TO 676 No No Yes No No
Trinidad and Tobago TT 1-868 No No Yes No Yes
Tunisia TN 216 No No Yes No Yes
Turkey TR 90 No No Registration required No Yes
Turkmenistan TM 993 No No No No Yes
Turks and Caicos Islands TC 1-649 No No Yes No Yes
Uganda UG 256 No No Yes No Yes
Ukraine UA 380 No Yes Yes Yes Yes
United Arab Emirates AE 971 Yes Yes Registration required Yes No
United Kingdom GB 44 Yes Yes Registration required Yes No
United States US 1 Yes Yes No Yes Yes
Uruguay UY 598 Yes No No Yes Yes
Uzbekistan UZ 998 No No Yes No Yes
Vanuatu VU 678 No No Yes No No
Venezuela VE 58 No No No No Yes
Vietnam VN 84 No No Registration required No Yes
Virgin Islands British VG 1-284 No No Yes No No
Virgin Islands US VI 1-340 No Yes No Yes No
Yemen YE 967 No No Yes No No
Zambia ZM 260 No No Registration required No Yes
Zimbabwe ZW 263 No No Yes No No
"""


def parse_support(value: str) -> str:
    v = value.strip()
    if v.startswith("Registration"):
        return "registration"
    if v == "Yes":
        return "yes"
    if v == "No":
        return "no"
    if v == "N/A":
        return "na"
    return "unknown"


def load_twilio_alpha() -> dict[str, str]:
    """Best-effort alpha map from eGullGolf/Twilio CSV by ISO2."""
    by_iso: dict[str, set[str]] = {}
    with urllib.request.urlopen(ALPHA_CSV_URL, timeout=30) as resp:
        text = resp.read().decode("utf-8")
    reader = csv.DictReader(text.splitlines())
    for row in reader:
        iso = (row.get("ISO3166-1-Alpha-2") or "").strip()
        support = (row.get("ALPHA SUPPORT") or "").strip().lower()
        if not iso:
            continue
        by_iso.setdefault(iso, set()).add(support)

    result: dict[str, str] = {}
    for iso, values in by_iso.items():
        if values == {"yes"}:
            result[iso] = "yes"
        elif values == {"no"}:
            result[iso] = "no"
        else:
            result[iso] = "partial"
    return result


def main() -> None:
    twilio = load_twilio_alpha()
    countries = []

    row_re = re.compile(
        r"^(?P<name>.+?)\s+(?P<iso>[A-Z]{2})\s+(?P<dial>[\d\-,\s]+?)\s+"
        r"(?P<short>Yes|No|Registration required(?:\[\d+\])?|N/A)\s+"
        r"(?P<long>Yes|No|Registration required(?:\[\d+\])?|N/A)\s+"
        r"(?P<sender>Yes|No|Registration required(?:\[\d+\])?|N/A)\s+"
        r"(?P<twoway>Yes|No|N/A)\s+"
        r"(?P<intl>Yes|No|N/A)\s*$"
    )

    for line in AWS_ROWS.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        m = row_re.match(line)
        if not m:
            print("Skip:", line)
            continue
        iso = m.group("iso")
        toll_free = "yes" if iso in {"US", "CA", "PR", "GU", "VI"} else "varies"
        countries.append(
            {
                "name": m.group("name"),
                "iso2": iso,
                "dialCode": m.group("dial").strip(),
                "channels": {
                    "alphanumeric": parse_support(m.group("sender")),
                    "shortCode": parse_support(m.group("short")),
                    "longCode": parse_support(m.group("long")),
                    "tollFree": toll_free if parse_support(m.group("long")) == "yes" else "no",
                },
                "twoWaySms": parse_support(m.group("twoway")),
                "internationalSending": parse_support(m.group("intl")),
                "twilioAlpha": twilio.get(iso),
                "sources": ["AWS End User Messaging SMS", "Twilio alpha CSV (eGullGolf)"],
            }
        )

    for out_path in OUT_PATHS:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(countries, indent=2), encoding="utf-8")
        print(f"Wrote {len(countries)} countries to {out_path}")


if __name__ == "__main__":
    main()
