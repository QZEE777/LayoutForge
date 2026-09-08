"""Isolated tests of the actual service-key function, without engine dependencies.

This verifies authorization decisions and router declarations, not HTTP integration.
"""
import ast
import hmac
from pathlib import Path
from types import SimpleNamespace

root = Path(__file__).resolve().parents[1]
tree = ast.parse((root / "kdp-preflight-engine/app/main.py").read_text())
ast.parse((root / "kdp-preflight-engine/app/config.py").read_text())
fn = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == "require_service_key")

class HTTPException(Exception):
    def __init__(self, status, detail):
        self.status = status

settings = SimpleNamespace(kdp_preflight_api_key="x" * 32)
namespace = dict(hmac=hmac, settings=settings, HTTPException=HTTPException, Request=object)
exec(compile(ast.Module(body=[fn], type_ignores=[]), "main.py", "exec"), namespace)
authorize = namespace["require_service_key"]
for key, supplied, expected in [("x"*32, "x"*32, None), ("x"*32, "", 401),
                                ("x"*32, "y"*32, 401), ("", "", 503), ("short", "short", 503)]:
    settings.kdp_preflight_api_key = key
    try:
        authorize(SimpleNamespace(headers={"x-preflight-key": supplied}))
        assert expected is None
    except HTTPException as exc:
        assert exc.status == expected
routers = [n for n in ast.walk(tree) if isinstance(n, ast.Call)
           and isinstance(n.func, ast.Attribute) and n.func.attr == "include_router"]
assert len(routers) == 5
assert all(any(k.arg == "dependencies" and "require_service_key" in ast.unparse(k.value)
               for k in n.keywords) for n in routers)
print("PASS: five service-key cases, all five routers protected, Python syntax valid")
