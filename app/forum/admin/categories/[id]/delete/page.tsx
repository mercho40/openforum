import { notFound } from "next/navigation"
// import { db } from "@/db/drizzle"
// import { category } from "@/db/schema"
// import { eq } from "drizzle-orm"
import { DeleteCategoryForm } from "@/components/forum/admin/CategoryDeleteForm"
import { getCategoryById } from "@/actions/category"

export default async function DeleteCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  // Fetch the category
  // const categoryData = await db.select().from(category).where(eq(category.id, id)).limit(1)
  const { categoryData, success, error } = await getCategoryById(id)
  if (!success) {
    throw new Error(error || "Failed to fetch categories")
  }

  if (!categoryData) {
    notFound()
  }

  return <DeleteCategoryForm category={categoryData[0]} />
}
