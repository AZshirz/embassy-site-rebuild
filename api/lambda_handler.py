"""
AWS Lambda entry point.

The same FastAPI application in main.py runs unchanged; Mangum translates between Lambda's
event/context model and ASGI. Nothing in main.py knows it is running on Lambda, so the app
still runs identically under `uvicorn` locally and in a container.

Lambda configuration lives in aws/cloudformation/stack.yml:
  Handler: lambda_handler.handler
  Runtime: python3.13
  URL:     a Lambda Function URL (no API Gateway, which is only free for 12 months)
"""
from mangum import Mangum

from main import app

# lifespan="off": FastAPI startup/shutdown events don't map onto Lambda's execution model,
# and this app has none - its caches are plain module-level objects that warm on first use.
handler = Mangum(app, lifespan="off")
