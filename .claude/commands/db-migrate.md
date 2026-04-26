Create and apply a Prisma migration for: $ARGUMENTS

Steps:
1. Update prisma/schema.prisma
2. Run: npx prisma migrate dev --name $ARGUMENTS
3. Verify migration file looks correct
4. Update seed script if new tables added
5. Check all new tables have organization_id for RLS