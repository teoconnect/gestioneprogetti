with open("src/app/api/projects/[id]/baselines/route.ts", "r") as f:
    content = f.read()

content = content.replace("import { getCurrentUser } from '@/lib/auth';", "import { verifyAuth } from '@/lib/auth';\nimport { cookies } from 'next/headers';")

def replace_get_user():
    return """
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await verifyAuth(token);
    """

import re
content = re.sub(r"    const user = await getCurrentUser\(\);", replace_get_user().strip(), content)

with open("src/app/api/projects/[id]/baselines/route.ts", "w") as f:
    f.write(content)
