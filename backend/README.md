# SplitBill Backend

FastAPI backend for a multi-currency bill splitting application.

## Quick Start

1. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Start development server:

```bash
uvicorn app.main:app --reload
```

5. Run database migrations:

```bash
python -m alembic upgrade head
```

The API will be available at:
- http://127.0.0.1:8000
- Swagger docs: http://127.0.0.1:8000/docs

## Current Endpoints

- `GET /` root status
- `GET /api/v1/health` health check
- `POST /api/v1/groups` create group
- `GET /api/v1/groups` list groups
- `GET /api/v1/groups/{group_id}` get group
- `POST /api/v1/groups/{group_id}/members` create member
- `GET /api/v1/groups/{group_id}/members` list members
- `POST /api/v1/groups/{group_id}/expenses` create expense
- `GET /api/v1/groups/{group_id}/expenses` list expenses
- `GET /api/v1/groups/{group_id}/settlement` settlement summary + transfer suggestions

Notes:
- Settlement currently returns a unified result in group `base_currency`.
- Non-base currency expenses require `fx_rate` to be set when creating expense.

## Next Build Steps

- Add exchange rate service (live vs fixed rates)
- Add settlement mode options (unified currency vs mixed display)
- Add authentication and authorization
