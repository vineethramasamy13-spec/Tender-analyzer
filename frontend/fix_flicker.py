import os
import re

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
        
        # Check if the guard is already implemented
        if "if (!mounted)" in content:
            continue
            
        # We need to insert `if (!mounted) return <div style={{ backgroundColor: '#0A0F1E', minHeight: '100vh' }} />;`
        # right before the final `return (` of the component.
        # It's tricky to regex just "return (" safely because there might be other returns.
        # But we know they all have `return (` near the end.
        
        # Actually, since all these pages have `const [mounted, setMounted] = useState(false);`,
        # and `return (`
        
        # Let's replace the first `return (` that comes after `useEffect` 
        # By splitting on `useEffect` and replacing in the second part.
        
        parts = content.split("useEffect(() => {", 1)
        if len(parts) == 2:
            second_part = parts[1]
            
            # Find the first `return (` that is indented with 2 spaces inside the component
            # Usually it's `  return (`
            # Wait, the safest way is to just replace `  return (` with `  if (!mounted) return <div style={{ backgroundColor: '#0A0F1E', minHeight: '100vh' }} />;\n\n  return (`
            # BUT there might be other `  return (` inside functions.
            
            # Let's use regex to find the `return (` that matches the outermost component
            new_second = re.sub(
                r"^(\s*)return \($",
                r"\1if (!mounted) return <div style={{ backgroundColor: '#0A0F1E', minHeight: '100vh' }} />;\n\n\1return (",
                second_part,
                count=1,
                flags=re.MULTILINE
            )
            
            if new_second != second_part:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(parts[0] + "useEffect(() => {" + new_second)
                print(f"Fixed {page}")
            else:
                print(f"Could not find 'return (' to replace in {page}")
    else:
        print(f"File not found: {page}")
