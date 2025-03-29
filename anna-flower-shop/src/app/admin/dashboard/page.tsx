import { getProducts, logout } from "../../actions"
import Link from "next/link"
import { ProductList } from "./product-list"

// Add dynamic segment to force revalidation
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminDashboard() {
  const products = await getProducts()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative z-10">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-serif text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-serif"
            >
              View Shop
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white font-serif text-sm rounded hover:bg-gray-700 dark:hover:bg-gray-600"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-serif text-gray-800 dark:text-gray-100">Products</h2>
          <Link
            href="/admin/dashboard/product/new"
            className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white font-serif text-sm rounded hover:bg-gray-700 dark:hover:bg-gray-600"
          >
            Add New Product
          </Link>
        </div>

        <ProductList products={products} />
      </main>
    </div>
  )
}

