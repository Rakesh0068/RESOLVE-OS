"""Agent model factory.

Returns the appropriate Strands model based on environment:
- AWS production: BedrockModel using IAM credentials
- Local with AWS creds: BedrockModel from ~/.aws or env vars
- Local demo (no creds): LiteLLM model pointing at local OpenAI-compatible endpoint
  or synthetic mock that returns structured responses
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

BEDROCK_MODEL_ID = os.environ.get(
    "BEDROCK_MODEL_ID",
    "us.amazon.nova-lite-v1:0"  # fast + cheap default; override in env
)
AWS_REGION = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
DEMO_MODE = os.environ.get("DEMO_MODE", "false").lower() in ("1", "true", "yes")


def create_model(model_id: Optional[str] = None):
    """Create a Strands-compatible model instance.
    
    Priority:
    1. Explicit model_id override
    2. BedrockModel (requires AWS credentials)
    3. LiteLLM fallback if LITELLM_API_BASE is set
    4. Raises clear error with instructions
    """
    mid = model_id or BEDROCK_MODEL_ID

    # Try Bedrock first (preferred for hackathon/AWS)
    try:
        import boto3
        from strands.models import BedrockModel

        # Quick credential check without a full API call
        session = boto3.Session(region_name=AWS_REGION)
        creds = session.get_credentials()
        if creds is None:
            raise RuntimeError("No AWS credentials found")
        resolved = creds.resolve()
        if resolved is None:
            raise RuntimeError("AWS credentials could not be resolved")

        model = BedrockModel(model_id=mid, region_name=AWS_REGION)
        logger.info("Using Bedrock model: %s (region: %s)", mid, AWS_REGION)
        return model

    except Exception as bedrock_err:
        logger.warning("Bedrock not available (%s) — trying LiteLLM fallback", bedrock_err)

    # LiteLLM fallback (e.g. local Ollama or any OpenAI-compatible API)
    litellm_base = os.environ.get("LITELLM_API_BASE")
    litellm_model = os.environ.get("LITELLM_MODEL", "openai/gpt-4o-mini")
    if litellm_base:
        try:
            from strands.models.litellm import LiteLLMModel
            model = LiteLLMModel(model_id=litellm_model, base_url=litellm_base)
            logger.info("Using LiteLLM model: %s at %s", litellm_model, litellm_base)
            return model
        except Exception as litellm_err:
            logger.warning("LiteLLM fallback failed: %s", litellm_err)

    # No model available
    raise RuntimeError(
        "No LLM model available.\n"
        "For AWS: set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION, or use an IAM role.\n"
        "For local: set LITELLM_API_BASE (e.g. http://localhost:11434/v1 for Ollama) "
        "and LITELLM_MODEL (e.g. openai/mistral).\n"
        "Check your .env file or environment variables."
    )
