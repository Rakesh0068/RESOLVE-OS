"""Strands Compatibility Layer.

Provides a @tool decorator that mimics the Strands Agents SDK interface.
Replace this with the real SDK when deploying to AWS with Bedrock.
"""
import functools
import inspect


def tool(func=None, *, name: str = None):
    """Decorator that marks a function as an agent tool.
    
    Mimics the Strands Agents SDK @tool decorator interface.
    In production, replace with: from strands import tool
    """
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            return fn(*args, **kwargs)

        # Attach metadata like the real Strands tool decorator
        wrapper._is_tool = True
        wrapper._tool_name = name or fn.__name__
        wrapper._tool_description = inspect.getdoc(fn) or ""

        return wrapper

    if func is not None:
        # @tool used without parentheses
        return decorator(func)
    else:
        # @tool() used with parentheses
        return decorator
