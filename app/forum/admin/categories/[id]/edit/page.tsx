import { notFound } from "next/navigation"
import { db } from "@/db/drizzle"
import { category } from "@/db/schema"
import { eq } from "drizzle-orm"
import { EditCategoryForm } from "@/components/CategoryEditForm"

interface EditCategoryPageProps {
  params: {
    id: string
  }
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = params

  // Fetch the category
  const categoryData = await db.select().from(category).where(eq(category.id, id)).limit(1)

  if (!categoryData.length) {
    notFound()
  }

  return <EditCategoryForm category={categoryData[0]} />
}
