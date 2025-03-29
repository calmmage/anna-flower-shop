"use server"

import { put, del, list } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { cache } from "react"

// Initial product data with our new images
const initialProducts = [
  {
    id: "1",
    name: "Alice in Wonderland Set",
    price: 60,
    description: "A whimsical mix of purple roses, daisies and mushrooms with a Cheshire Cat card and knitted rabbit.",
    imagePath: "/images/shop_alice.png",
  },
  {
    id: "2",
    name: "Pride and Prejudice Set",
    price: 70,
    description: "Elegant peonies, lilies and lavender with a Regency watercolor card and tiny knitted book.",
    imagePath: "/images/shop_pride_and_prejudice.png",
  },
  {
    id: "3",
    name: "Little Prince Set",
    price: 50,
    description: "A single rose with daisies and baby's breath, a Little Prince card, and a knitted figure.",
    imagePath: "/images/shop_little_prince.png",
  },
  {
    id: "4",
    name: "Great Gatsby Set",
    price: 80,
    description: "Luxurious white orchids and golden roses with art deco dancing couple card and gentleman figure.",
    imagePath: "/images/shop_great_gatsby.png",
  },
]

// In-memory store that persists during the lifetime of the server
let products = [...initialProducts]

// Simple admin authentication
export async function login(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  // In a real app, you would use a secure authentication method
  // This is just a simple example
  if (username === "admin" && password === "password") {
    cookies().set("admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    })
    redirect("/admin/dashboard")
  }

  return { error: "Invalid credentials" }
}

export async function logout() {
  cookies().delete("admin-auth")
  redirect("/admin")
}

export async function isAuthenticated() {
  return cookies().has("admin-auth")
}

// Product CRUD operations with caching
export const getProducts = cache(async () => {
  return products
})

export async function getProduct(id: string) {
  return products.find((p) => p.id === id)
}

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string
  const price = Number.parseInt(formData.get("price") as string)
  const description = formData.get("description") as string

  const newProduct = {
    id: Date.now().toString(),
    name,
    price,
    description,
    imagePath: "/placeholder.svg",
  }

  products = [...products, newProduct]

  revalidatePath("/admin/dashboard")
  revalidatePath("/")
  return { success: true, product: newProduct }
}

export async function updateProduct(formData: FormData) {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const price = Number.parseInt(formData.get("price") as string)
  const description = formData.get("description") as string
  const imagePath = formData.get("imagePath") as string

  products = products.map((p) => (p.id === id ? { ...p, name, price, description, imagePath } : p))

  revalidatePath("/admin/dashboard")
  revalidatePath("/")
  return { success: true }
}

export async function deleteProduct(id: string) {
  // Find the product to get its image path
  const product = products.find((p) => p.id === id)

  // Delete the image from Blob storage if it's not a placeholder
  if (
    product &&
    product.imagePath &&
    !product.imagePath.includes("placeholder") &&
    !product.imagePath.includes("/images/")
  ) {
    try {
      await del(product.imagePath)
    } catch (error) {
      console.error("Failed to delete image:", error)
    }
  }

  // Remove the product
  products = products.filter((p) => p.id !== id)

  revalidatePath("/admin/dashboard")
  revalidatePath("/")
  return { success: true }
}

// Image upload with Vercel Blob
export async function uploadProductImage(formData: FormData) {
  const file = formData.get("file") as File
  const productId = formData.get("productId") as string

  if (!file || file.size === 0) {
    return { error: "No file selected" }
  }

  // Validate file size (4MB limit)
  if (file.size > 4 * 1024 * 1024) {
    return { error: "File size exceeds 4MB limit" }
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!validTypes.includes(file.type)) {
    return {
      error: "Invalid file type",
      details: `File type ${file.type} is not supported. Please use JPEG, PNG, or WebP.`,
    }
  }

  try {
    console.log(`Starting upload: ${file.name}, size: ${file.size}, type: ${file.type}`)

    // Create a unique filename to avoid collisions
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Upload to Vercel Blob
    const blob = await put(`products/${productId}/${filename}`, file, {
      access: "public",
    })

    console.log(`Upload successful: ${blob.url}`)

    // Update the product with the new image URL
    products = products.map((p) => (p.id === productId ? { ...p, imagePath: blob.url } : p))

    // Force revalidation of both pages
    revalidatePath("/admin/dashboard")
    revalidatePath("/")

    return { success: true, url: blob.url }
  } catch (error: any) {
    console.error("Upload failed:", error)

    // Extract more detailed error information
    let errorDetails = "Unknown error"
    if (error.message) {
      errorDetails = error.message
    }

    if (error.response) {
      try {
        const responseText = await error.response.text()
        errorDetails = `API Error: ${responseText}`
      } catch (e) {
        errorDetails = `API Error: ${error.response.status}`
      }
    }

    return {
      error: "Upload failed",
      details: errorDetails,
    }
  }
}

// Get all images from Blob storage
export async function getImages() {
  try {
    const { blobs } = await list()
    return blobs
  } catch (error) {
    console.error("Failed to list images:", error)
    return []
  }
}

