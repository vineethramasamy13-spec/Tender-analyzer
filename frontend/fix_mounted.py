import os

frontend_dir = r"C:\Users\Vineeth Ramasamy\.gemini\antigravity\scratch\tender-analyzer\frontend\app"
protected_pages = [
    "dashboard/page.tsx",
    "analyze/page.tsx",
    "tenders/page.tsx",
    "chat/page.tsx",
    "history/page.tsx",
    "analytics/page.tsx",
    "account/page.tsx"
]

for page in protected_pages:
    filepath = os.path.join(frontend_dir, page)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check if `mounted` state exists
        if "const [mounted, setMounted] = useState(false);" not in content:
            # We need to add it right after the component declaration
            # Look for `export default function`
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if "export default function" in line:
                    # Insert mounted state right after the function declaration
                    lines.insert(i + 1, "  const [mounted, setMounted] = useState(false);")
                    break
            content = '\n'.join(lines)
            
            # Now we need to add `setMounted(true);` inside useEffect, 
            # preferably right after checking token
            if "setMounted(true);" not in content:
                content = content.replace("        return;\n      }\n    }", "        return;\n      }\n    }\n    setMounted(true);")
                
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Added mounted state to {page}")
