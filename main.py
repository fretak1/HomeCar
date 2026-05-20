import sys
import os
import importlib.util

# Add the 'ai-service' directory to Python's system path so that
# all internal relative imports (like 'from app.api import ...') resolve correctly.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-service'))

# Dynamically load the 'main.py' file from the 'ai-service' folder to avoid name clashes
spec = importlib.util.spec_from_file_location(
    "ai_service_main", 
    os.path.join(os.path.dirname(__file__), 'ai-service', 'main.py')
)
ai_service_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ai_service_main)

# Expose the FastAPI app object at the root level for Uvicorn
app = ai_service_main.app
