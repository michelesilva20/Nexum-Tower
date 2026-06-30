import { prisma } from "../src/index";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "nexum-demo" },
    update: {},
    create: {
      name: "Nexum Demo Logistics",
      slug: "nexum-demo",
    },
  });

  console.log("Seed completed:", tenant);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
