dev:
	arch -arm64 uv run uvicorn api.index:app --reload --host 0.0.0.0 --port 8000

render:
	uv run uvicorn api.index:app --host 0.0.0.0 --port ${PORT}
