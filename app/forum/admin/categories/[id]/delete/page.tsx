import { notFound } from "next/navigation"
import { db } from "@/db/drizzle"
import { category } from "@/db/schema"
import { eq } from "drizzle-orm"
import { DeleteCategoryForm } from "@/components/CategoryDeleteForm"

export default async function DeleteCategoryPage({
  params,
}: { params: { id: string } }) {
  const { id } = params;

  // Fetch the category
  const categoryData = await db.select().from(category).where(eq(category.id, id)).limit(1)

  if (!categoryData.length) {
    notFound()
  }

  return <DeleteCategoryForm category={categoryData[0]} />
}
