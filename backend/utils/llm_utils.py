from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
from loguru import logger
import google.generativeai as genai

# Define specific exceptions to retry on. Since we import them dynamically to avoid load errors,
# we can capture common API errors.
try:
    from groq import RateLimitError, APIConnectionError, APIStatusError
    GROQ_EXCEPTIONS = (RateLimitError, APIConnectionError, APIStatusError)
except ImportError:
    GROQ_EXCEPTIONS = (Exception,)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(GROQ_EXCEPTIONS),
    reraise=True
)
async def call_groq_retry(client, model: str, prompt: str, temperature: float = 0.3, max_tokens: int = 1000) -> str:
    """Invoke Groq completion with tenacity retries."""
    # Run in executor since groq client might blocks if not async-typed
    # Wait, if client has `.chat.completions.create` it is synchronous.
    # If we want async we use client.chat.completions.create.
    logger.info(f"Calling Groq model {model} (retry enabled)")
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True
)
async def call_gemini_retry(model, prompt: str) -> str:
    """Invoke Gemini content generation with tenacity retries."""
    logger.info(f"Calling Gemini model {model.model_name if hasattr(model, 'model_name') else model} (retry enabled)")
    response = await model.generate_content_async(prompt)
    return response.text
