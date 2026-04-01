import math
from typing import Optional

# Map display country names to the country_indeed parameter JobSpy expects
COUNTRY_TO_INDEED: dict[str, str] = {
    "Canada": "Canada",
    "United States": "USA",
    "United Kingdom": "UK",
    "Australia": "Australia",
    "Germany": "Germany",
    "France": "France",
    "Netherlands": "Netherlands",
    "Singapore": "Singapore",
    "India": "India",
    "New Zealand": "New Zealand",
    "Ireland": "Ireland",
    "Belgium": "Belgium",
    "Switzerland": "Switzerland",
    "Sweden": "Sweden",
    "Spain": "Spain",
    "Italy": "Italy",
    "Brazil": "Brazil",
    "Mexico": "Mexico",
    "Japan": "Japan",
    "South Korea": "South Korea",
    "Hong Kong": "Hong Kong",
    "UAE": "United Arab Emirates",
    "Saudi Arabia": "Saudi Arabia",
    "South Africa": "South Africa",
}

CURRENCY_SYMBOLS: dict[str, str] = {
    "USD": "$",
    "CAD": "CA$",
    "GBP": "£",
    "EUR": "€",
    "AUD": "AU$",
    "SGD": "S$",
    "INR": "₹",
    "NZD": "NZ$",
    "JPY": "¥",
    "CHF": "CHF ",
}


def _safe_str(val, default: str = "") -> str:
    if val is None:
        return default
    if isinstance(val, float) and math.isnan(val):
        return default
    s = str(val).strip()
    return default if s.lower() == "nan" else s


def _safe_bool(val, default: bool = False) -> bool:
    if val is None:
        return default
    if isinstance(val, float) and math.isnan(val):
        return default
    return bool(val)


def _safe_amount(val) -> Optional[float]:
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def scrape_jobs(search_term: str, location: str, country: str) -> list[dict]:
    from jobspy import scrape_jobs as jobspy_scrape

    country_indeed = COUNTRY_TO_INDEED.get(country, "USA")

    site_names = ["indeed", "linkedin", "glassdoor"]
    if country in ("Canada", "United States"):
        site_names.append("zip_recruiter")

    try:
        df = jobspy_scrape(
            site_name=site_names,
            search_term=search_term,
            location=location,
            results_wanted=5,
            hours_old=168,
            country_indeed=country_indeed,
            linkedin_fetch_description=True,
            description_format="markdown",
            verbose=0,
        )
    except Exception as exc:
        raise RuntimeError(f"Job scraping failed: {exc}") from exc

    if df is None or df.empty:
        return []

    jobs: list[dict] = []
    for _, row in df.iterrows():
        job_url = _safe_str(row.get("job_url"))
        if not job_url:
            continue

        currency = _safe_str(row.get("currency"))
        interval = _safe_str(row.get("interval"))
        symbol = CURRENCY_SYMBOLS.get(currency, currency)

        min_amt = _safe_amount(row.get("min_amount"))
        max_amt = _safe_amount(row.get("max_amount"))

        salary: Optional[str] = None
        if min_amt is not None and max_amt is not None:
            salary = f"{symbol}{int(min_amt):,} – {symbol}{int(max_amt):,} / {interval}"
        elif min_amt is not None:
            salary = f"{symbol}{int(min_amt):,}+ / {interval}"

        jobs.append(
            {
                "id": job_url,
                "title": _safe_str(row.get("title")),
                "company": _safe_str(row.get("company")),
                "city": _safe_str(row.get("city")),
                "state": _safe_str(row.get("state")),
                "country": _safe_str(row.get("country")),
                "is_remote": _safe_bool(row.get("is_remote")),
                "job_type": _safe_str(row.get("job_type")),
                "salary": salary,
                "description": _safe_str(row.get("description")),
                "job_url": job_url,
                "site": _safe_str(row.get("site")),
                "date_posted": _safe_str(row.get("date_posted")),
            }
        )

    return jobs
