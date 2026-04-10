import os
import re

def insert_cancel_button_re(filepath, target_regex, insert_code, role_log):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(target_regex, content, re.MULTILINE | re.DOTALL)
    if match:
        print(f"Found match in {filepath}")
        original_text = match.group(0)
        
        # Determine indentation from the last line of the match (the </Link>)
        last_line = original_text.splitlines()[-1]
        indent = last_line[:len(last_line) - len(last_line.lstrip())]
        
        indented_code = "\\n".join([indent + line.strip() for line in insert_code.splitlines()])
        # Manual replacement to avoid regex group issues
        new_text = original_text + "\n" + insert_code.replace("INIT_INDENT", indent)
        
        new_content = content.replace(original_text, new_text)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    else:
        print(f"Regex NOT found in {filepath} for {role_log}")
        return False

# --- Customer ---
cust_regex = r'<Link\s+href={`/dashboard/customer/lease/\$\{lease\.id\}`}>.*?</Link>'
cust_code = """INIT_INDENT{lease.status === 'ACTIVE' && (
INIT_INDENT    <Button
INIT_INDENT        variant="outline"
INIT_INDENT        size="sm"
INIT_INDENT        className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
INIT_INDENT        onClick={() => requestLeaseCancellation(lease.id, 'customer')}
INIT_INDENT        disabled={lease.customerCancelled}
INIT_INDENT    >
INIT_INDENT        <X className="h-3.5 w-3.5 mr-1" />
INIT_INDENT        {lease.customerCancelled ? 'Requested' : 'Cancel Lease'}
INIT_INDENT    </Button>
INIT_INDENT)}"""

# --- Owner ---
owner_regex = r'<Link\s+href={`/dashboard/owner/lease/\$\{lease\.id\}`}>.*?</Link>'
owner_code = """INIT_INDENT{lease.status === 'ACTIVE' && (
INIT_INDENT    <Button
INIT_INDENT        variant="outline"
INIT_INDENT        size="sm"
INIT_INDENT        className={cn(
INIT_INDENT            "h-9 px-4 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 transition-all duration-300 shadow-sm",
INIT_INDENT            lease.ownerCancelled && "bg-amber-50 text-amber-600 border-amber-200 cursor-not-allowed"
INIT_INDENT        )}
INIT_INDENT        onClick={() => requestLeaseCancellation(lease.id, 'owner')}
INIT_INDENT        disabled={lease.ownerCancelled}
INIT_INDENT    >
INIT_INDENT        <X className="h-4 w-4 mr-2" />
INIT_INDENT        {lease.ownerCancelled ? 'Requested' : 'Cancel Lease'}
INIT_INDENT    </Button>
INIT_INDENT)}"""

insert_cancel_button_re(r"c:\Users\Fretak\Desktop\HomeCar\client\src\app\dashboard\customer\page.tsx", cust_regex, cust_code, "customer")
insert_cancel_button_re(r"c:\Users\Fretak\Desktop\HomeCar\client\src\app\dashboard\owner\page.tsx", owner_regex, owner_code, "owner")
