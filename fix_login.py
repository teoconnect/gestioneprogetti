with open("src/app/api/auth/login/route.ts", "r") as f:
    content = f.read()

import re
content = re.sub(r"const existingUser = await prisma\.user\.findUnique\(\{\s+where: \{ username: confUser \},\s+\}\);", """const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: confUser },
            { email: i === 0 ? "admin@example.com" : `user${i}@example.com` }
          ]
        },
      });""", content)

with open("src/app/api/auth/login/route.ts", "w") as f:
    f.write(content)
