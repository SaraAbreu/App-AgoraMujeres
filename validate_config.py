#!/usr/bin/env python3
"""
Configuration Validator for Ágora Mujeres Backend
Validates that all environment variables are correctly set and integrated
"""

import os
import sys
from pathlib import Path

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
END = '\033[0m'

def check_env_variable(name, required=True, hint=""):
    """Check if environment variable is set and valid"""
    value = os.environ.get(name)
    
    if not value:
        if required:
            print(f"{RED}✗ MISSING:{END} {name}")
            if hint:
                print(f"  {YELLOW}Hint:{END} {hint}")
            return False
        else:
            print(f"{YELLOW}⚠ OPTIONAL:{END} {name} (not set)")
            return True
    
    # Check if it looks like a placeholder or test value
    if "your_" in value or "_here" in value or value == "test":
        print(f"{RED}✗ INVALID:{END} {name} = '{value[:20]}...' (looks like placeholder)")
        if hint:
            print(f"  {YELLOW}Hint:{END} {hint}")
        return False
    
    # Show masked value for security
    masked = value[:4] + "*" * (len(value) - 8) + value[-4:]
    print(f"{GREEN}✓ VALID:{END} {name} = {masked}")
    return True

def main():
    print(f"\n{BLUE}{'='*60}{END}")
    print(f"{BLUE}  ÁGORA MUJERES - ENVIRONMENT CONFIGURATION VALIDATOR{END}")
    print(f"{BLUE}{'='*60}{END}\n")
    
    # Load .env file
    env_file = Path(__file__).parent / "backend" / ".env"
    if env_file.exists():
        print(f"{BLUE}Loading .env from:{END} {env_file}\n")
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()
    else:
        print(f"{RED}✗ ERROR:{END} .env file not found at {env_file}\n")
        return False
    
    checks_passed = 0
    checks_total = 0
    
    print(f"{BLUE}CHECKING REQUIRED VARIABLES:{END}\n")
    
    # Check required variables
    variables_to_check = [
        ("OPENAI_API_KEY", True, 
         "Get from https://platform.openai.com/account/api-keys\nShould start with 'sk-proj-'"),
        
        ("STRIPE_SECRET_KEY", True,
         "Get from https://dashboard.stripe.com/apikeys\nShould start with 'sk_live_' or 'sk_test_'"),
        
        ("MONGO_URL", True,
         "Local: mongodb://localhost:27017\nCloud: mongodb+srv://user:pass@cluster.mongodb.net/"),
        
        ("DB_NAME", True,
         "Database name, e.g., 'agora_mujeres'"),
        
        ("HF_TOKEN", False,
         "Optional. Get from https://huggingface.co/settings/tokens\nFor fallback LLM when OpenAI unavailable"),
        
        ("LOG_LEVEL", False,
         "Optional. DEBUG, INFO, WARNING, or ERROR (default: INFO)"),
    ]
    
    for var_name, required, hint in variables_to_check:
        checks_total += 1
        if check_env_variable(var_name, required, hint):
            checks_passed += 1
        print()
    
    # Test connectivity and API keys
    print(f"{BLUE}TESTING API INTEGRATIONS:{END}\n")
    
    # Test OpenAI
    try:
        from openai import OpenAI
        openai_key = os.environ.get("OPENAI_API_KEY")
        if openai_key and not "your_" in openai_key:
            client = OpenAI(api_key=openai_key)
            # Try to list models (minimal request to validate key)
            models = client.models.list()
            print(f"{GREEN}✓ OpenAI API:{END} Connection successful")
            print(f"  Available models: {len(list(models))}")
            checks_passed += 1
        else:
            print(f"{RED}✗ OpenAI API:{END} Invalid or missing API key")
    except ImportError:
        print(f"{YELLOW}⚠ OpenAI:{END} Library not installed (install via: pip install openai)")
    except Exception as e:
        print(f"{RED}✗ OpenAI API:{END} {str(e)}")
    print()
    checks_total += 1
    
    # Test Stripe
    try:
        import stripe
        stripe_key = os.environ.get("STRIPE_SECRET_KEY")
        if stripe_key and not "your_" in stripe_key:
            stripe.api_key = stripe_key
            account = stripe.Account.retrieve()
            print(f"{GREEN}✓ Stripe API:{END} Connection successful")
            print(f"  Account: {account.id}")
            print(f"  Account type: {account.type}")
            checks_passed += 1
        else:
            print(f"{RED}✗ Stripe API:{END} Invalid or missing API key")
    except ImportError:
        print(f"{YELLOW}⚠ Stripe:{END} Library not installed (install via: pip install stripe)")
    except Exception as e:
        print(f"{RED}✗ Stripe API:{END} {str(e)}")
    print()
    checks_total += 1
    
    # Test MongoDB
    try:
        from pymongo import MongoClient
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")
        if mongo_url:
            client = MongoClient(mongo_url, serverSelectionTimeoutMS=2000)
            client.admin.command('ping')
            db = client[db_name]
            print(f"{GREEN}✓ MongoDB:{END} Connection successful")
            print(f"  Database: {db_name}")
            print(f"  Collections: {len(db.list_collection_names())}")
            checks_passed += 1
        else:
            print(f"{YELLOW}⚠ MongoDB:{END} URL not set")
    except ImportError:
        print(f"{YELLOW}⚠ MongoDB:{END} Library not installed (install via: pip install pymongo)")
    except Exception as e:
        print(f"{RED}⚠ MongoDB:{END} {str(e)}")
        print(f"    (This is OK for development with mongomock)")
    print()
    checks_total += 1
    
    # Summary
    print(f"{BLUE}{'='*60}{END}")
    print(f"SUMMARY: {checks_passed}/{checks_total} checks passed\n")
    
    if checks_passed == checks_total:
        print(f"{GREEN}✓ ALL CHECKS PASSED{END}")
        print(f"  Your Ágora backend is ready to use!\n")
        return True
    else:
        print(f"{YELLOW}⚠ SOME CHECKS FAILED{END}")
        print(f"  Please fix the issues above before running the server.\n")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
