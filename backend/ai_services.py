"""
NEW FILE — place at backend/ai_services.py

Three isolated, defensive LLM-calling functions. Each one:
- Has a short, clear prompt
- Parses the response defensively (handles malformed JSON)
- Falls back safely if the call fails — NEVER crashes the main flow

Uses Anthropic's API. Add ANTHROPIC_API_KEY to your .env and Render environment variables.
Install with: pip install anthropic
Add "anthropic==0.34.0" to requirements.txt
"""

import os
import json
import re
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = None
api_key = os.getenv("ANTHROPIC_API_KEY")
if api_key:
    client = Anthropic(api_key=api_key)

VSKP_LAT_RANGE = (17.55, 17.85)
VSKP_LNG_RANGE = (83.05, 83.45)


def screen_facility_registration(name: str, address: str, area: str, phone: str,
                                   email: str, latitude: float, longitude: float,
                                   existing_facility_names: list) -> dict:
    """
    Screens a new facility registration for plausibility.
    Returns: {"status": "verified" | "pending_review", "reason": str}
    """
    # Hard geographic check first — doesn't need AI
    if not (VSKP_LAT_RANGE[0] <= latitude <= VSKP_LAT_RANGE[1] and
            VSKP_LNG_RANGE[0] <= longitude <= VSKP_LNG_RANGE[1]):
        return {
            "status": "pending_review",
            "reason": "Pinned location falls outside the expected Visakhapatnam area. Please confirm your exact location and upload proof of registration."
        }

    if not client:
        return {"status": "verified", "reason": None}

    try:
        existing_names_str = ", ".join(existing_facility_names[:50]) if existing_facility_names else "none"
        prompt = f"""You are screening a new healthcare facility registration for an Indian medicine-tracking platform in Visakhapatnam. Flag entries that look fake, like test data, or suspiciously duplicate existing names.

New registration:
Name: {name}
Address: {address}
Area: {area}
Phone: {phone}
Email: {email}

Existing facility names already registered: {existing_names_str}

Respond ONLY with valid JSON in this exact format, nothing else:
{{"status": "verified", "reason": null}}
or
{{"status": "pending_review", "reason": "one short sentence explaining why"}}

Flag as pending_review if: the name looks like test/junk data (e.g. "asdf", "test123", repeated characters), the phone number doesn't look like a valid Indian number, the email looks disposable/fake, or the name is suspiciously near-identical to an existing one."""

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text.strip()
        text = re.sub(r"^```json\s*|\s*```$", "", text.strip())
        parsed = json.loads(text)
        status = parsed.get("status", "verified")
        if status not in ["verified", "pending_review"]:
            status = "verified"
        return {"status": status, "reason": parsed.get("reason")}
    except Exception as e:
        print(f"AI screening error (defaulting to verified): {e}")
        return {"status": "verified", "reason": None}


def normalize_medicine_name(raw_name: str, known_generics: dict) -> dict:
    """
    Cleans up an OCR-extracted medicine name and suggests a generic match.
    Returns: {"cleaned_name": str, "suggested_generic": str or None}
    """
    if not client or not raw_name or len(raw_name.strip()) < 2:
        return {"cleaned_name": raw_name, "suggested_generic": None}

    try:
        generics_sample = ", ".join(list(known_generics.values())[:30])
        prompt = f"""Clean up this medicine name extracted via OCR from a pharmacy invoice, which may have typos or odd formatting.

Raw OCR text: "{raw_name}"

Known generic/salt names for reference: {generics_sample}

Respond ONLY with valid JSON, nothing else:
{{"cleaned_name": "corrected medicine name", "suggested_generic": "matching generic name or null"}}"""

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}]
        )
        text = response.content[0].text.strip()
        text = re.sub(r"^```json\s*|\s*```$", "", text.strip())
        parsed = json.loads(text)
        return {
            "cleaned_name": parsed.get("cleaned_name", raw_name),
            "suggested_generic": parsed.get("suggested_generic")
        }
    except Exception as e:
        print(f"AI name normalization error (using raw name): {e}")
        return {"cleaned_name": raw_name, "suggested_generic": None}


def generate_alert_summary(facility_name: str, critical_meds: list, warning_meds: list) -> str:
    """
    Generates a one-line plain-language summary for the daily alert message.
    Returns a plain string (not JSON) — falls back to a simple template if AI fails.
    """
    total_at_risk_value = sum((m.mrp or 0) * m.quantity for m in critical_meds)
    fallback = f"{len(critical_meds)} medicine(s) need urgent attention, approximately ₹{total_at_risk_value:,.0f} worth of stock at risk."

    if not client or not critical_meds:
        return fallback

    try:
        med_list = ", ".join([f"{m.name} (qty {m.quantity})" for m in critical_meds[:10]])
        prompt = f"""Write ONE short, plain-language sentence summarizing this pharmacy alert for {facility_name}. Be specific and natural, like a human assistant would say it.

Critical medicines (expiring within 30 days or expired): {med_list}
Approximate value at risk: ₹{total_at_risk_value:,.0f}

Respond with ONLY the one sentence, no quotes, no preamble."""

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        print(f"AI summary error (using fallback): {e}")
        return fallback
