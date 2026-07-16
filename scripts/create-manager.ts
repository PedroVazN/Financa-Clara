import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "gestor@demo.com";
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { managerProfile: true },
  });

  if (existing) {
    console.log("Gestor já existe:", email);
  } else {
    const passwordHash = await bcrypt.hash("123456", 10);
    const user = await prisma.user.create({
      data: {
        name: "Carlos Mendes",
        email,
        passwordHash,
        role: UserRole.MANAGER,
        managerProfile: {
          create: { company: "Orientação Financeira Clara" },
        },
      },
      include: { managerProfile: true },
    });
    console.log("Gestor criado:", user.email, user.managerProfile?.id);
  }

  console.log("Total usuários:", await prisma.user.count());
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
