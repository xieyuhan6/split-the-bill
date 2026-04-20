from __future__ import annotations

import ssl
from decimal import Decimal
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException, Query, status

from app.core.config import get_settings

router = APIRouter()


@router.get("/rates/latest", summary="Get realtime exchange rates")
async def latest_rates(
    target_currency: str = Query(..., min_length=3, max_length=3),
    symbols: str = Query("", description="Comma-separated currency codes"),
) -> dict:
    settings = get_settings()
    api_key = settings.exchangerates_api_key.strip()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ExchangeRates API key is not configured on the server.",
        )

    target_currency = target_currency.upper()
    requested_symbols = [symbol.strip().upper() for symbol in symbols.split(",") if symbol.strip()]
    currencies = sorted(set([target_currency, *requested_symbols]))

    query = {
        "access_key": api_key,
        "symbols": ",".join(symbol for symbol in currencies if symbol != "EUR"),
    }
    url = f"https://api.exchangeratesapi.io/v1/latest?{urlencode(query)}"
    ssl_context = ssl._create_unverified_context()

    try:
        with urlopen(Request(url, headers={"User-Agent": "SplitBill/1.0"}), timeout=15, context=ssl_context) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:  # pragma: no cover - network failure path
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to load realtime exchange rates.") from exc

    if not payload.get("success", False):
        error_info = payload.get("error", {}).get("info") if isinstance(payload.get("error"), dict) else None
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_info or "ExchangeRates API returned an error.",
        )

    rates = payload.get("rates", {}) or {}
    if target_currency != "EUR" and target_currency not in rates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Realtime rates do not include {target_currency}.")

    target_rate = Decimal("1") if target_currency == "EUR" else Decimal(str(rates[target_currency]))
    normalized: dict[str, str] = {}

    for currency in currencies:
        if currency == target_currency:
            normalized[currency] = "1"
            continue
        if currency == "EUR":
            normalized[currency] = str(target_rate)
            continue

        source_rate = rates.get(currency)
        if source_rate is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Realtime rates do not include {currency}.")

        value = (Decimal(str(target_rate)) / Decimal(str(source_rate))) if target_currency != "EUR" else (Decimal("1") / Decimal(str(source_rate)))
        normalized[currency] = str(value)

    return {
        "target_currency": target_currency,
        "base": payload.get("base", "EUR"),
        "date": payload.get("date"),
        "timestamp": payload.get("timestamp"),
        "rates": normalized,
    }