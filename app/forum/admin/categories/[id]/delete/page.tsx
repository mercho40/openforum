import { notFound } from "next/navigation"
import { db } from "@/db/drizzle"
import { category } from "@/db/schema"
import { eq } from "drizzle-orm"
import { DeleteCategoryForm } from "@/components/CategoryDeleteForm"

interface DeleteCategoryPageProps {
  params: {
    id: string
  }
}

export default async function DeleteCategoryPage({ params }: DeleteCategoryPageProps) {
  const { id } = params

  // Fetch the category
  const categoryData = await db.select().from(category).where(eq(category.id, id)).limit(1)

  if (!categoryData.length) {
    notFound()
  }

  return <DeleteCategoryForm category={categoryData[0]} />
}
