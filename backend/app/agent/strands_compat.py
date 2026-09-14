"""Strands SDK import shim.

Imports the real strands.tool decorator.
All agent tools use `from backend.app.agent.strands_compat import tool`
so this one file controls whether we run with real Strands or a fallback.

Production (AWS): strands-agents is installed and Bedrock credentials are set.
Local demo:       strands-agents is installed; uses a mock LLM model when no
                  AWS credentials are present (set DEMO_MODE=true).
"""
try:
    from strands import tool  # real Strands Agents SDK
    STRANDS_AVAILABLE = True
except ImportError:
    import functools, inspect

    def tool(func=None, *, name: str = None):
        """Fallback decorator when strands-agents is not installed."""
        def decorator(fn):
            @functools.wraps(fn)
            def wrapper(*args, **kwargs):
                return fn(*args, **kwargs)
            wrapper._is_tool = True
            wrapper._tool_name = name or fn.__name__
            wrapper._tool_description = inspect.getdoc(fn) or ""
            return wrapper
        return decorator(func) if func is not None else decorator

    STRANDS_AVAILABLE = False
    import warnings
    warnings.warn("strands-agents not installed — using fallback tool decorator. Install with: pip install strands-agents")

__all__ = ["tool", "STRANDS_AVAILABLE"]
