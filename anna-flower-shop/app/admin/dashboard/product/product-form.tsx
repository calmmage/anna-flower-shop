"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createProduct, updateProduct, uploadProductImage } from "../../../actions"
import { DirectUpload } from "./direct-upload"

interface Product {
  id: string
  name: string
  price: number
  description: string
  imagePath: string
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageUrl, setImageUrl] = useState(product?.imagePath || "")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [cacheBustedImageUrl, setCacheBustedImageUrl] = useState(imageUrl)

  const isEditing = !!product

  // Update cache busted URL when imageUrl changes or after component mounts
  useEffect(() => {
    if (imageUrl && !imageUrl.includes("placeholder")) {
      setCacheBustedImageUrl(`${imageUrl}?t=${Date.now()}`)
    } else {
      setCacheBustedImageUrl(imageUrl)
    }
  }, [imageUrl])

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      if (isEditing) {
        // Add the image URL to the form data (without cache busting parameter)
        formData.append("imagePath", imageUrl)
        await updateProduct(formData)
        setSuccess("Product updated successfully")
        router.refresh() // Force refresh after update
      } else {
        const result = await createProduct(formData)
        if (result.success) {
          router.push(`/admin/dashboard/product/${result.product.id}`)
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !product) {
      setError("No file selected or product ID missing")
      return
    }

    // Clear previous states
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    setSuccess(null)
    setDebugInfo(null)

    // Display file info for debugging
    setDebugInfo(`File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)}KB, Type: ${file.type}`)

    // Create a FormData object for the upload
    const formData = new FormData()
    formData.append("file", file)
    formData.append("productId", product.id)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 300)

      const result = await uploadProductImage(formData)

      clearInterval(interval)

      if (result.error) {
        setError(`Upload error: ${result.error}`)
        setUploadProgress(0)
        if (result.details) {
          setDebugInfo(result.details)
        }
      } else {
        setUploadProgress(100)
        setImageUrl(result.url)
        setSuccess("Image uploaded successfully")
        router.refresh() // Force refresh after upload

        // Reset the file input
        event.target.value = ""

        // Reset progress after a delay
        setTimeout(() => {
          setUploadProgress(0)
        }, 1000)
      }
    } catch (err: any) {
      setError(`Upload failed: ${err.message || "Unknown error"}`)
      setDebugInfo(`Error details: ${JSON.stringify(err)}`)
      console.error("Upload error:", err)
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <form action={handleSubmit} className="p-6 space-y-6">
        {error && <div className="bg-red-50 p-4 rounded text-red-600 text-sm">{error}</div>}

        {success && <div className="bg-green-50 p-4 rounded text-green-600 text-sm">{success}</div>}

        {debugInfo && <div className="bg-blue-50 p-4 rounded text-blue-600 text-sm font-mono">{debugInfo}</div>}

        {isEditing && <input type="hidden" name="id" value={product.id} />}

        <div>
          <label htmlFor="name" className="block text-sm font-serif text-gray-700">
            Product Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product?.name}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-serif text-gray-700">
            Price (CHF)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            required
            defaultValue={product?.price}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-serif text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            defaultValue={product?.description}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        {isEditing && (
          <div>
            <label className="block text-sm font-serif text-gray-700 mb-2">Product Image</label>

            <div className="flex items-start space-x-4">
              <div className="relative h-32 w-32 bg-gray-100 rounded">
                {imageUrl && (
                  <Image
                    src={cacheBustedImageUrl || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover rounded"
                    unoptimized={!imageUrl.includes("placeholder")}
                  />
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />

                {uploadProgress > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-gray-800 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadProgress === 100 ? "Upload complete" : `Uploading: ${uploadProgress}%`}
                    </p>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  <p>Supported formats: PNG, JPEG, WebP</p>
                  <p>Maximum size: 4MB</p>
                </div>

                <DirectUpload
                  productId={product.id}
                  onSuccess={(url) => {
                    setImageUrl(url)
                    setSuccess("Image set using alternative method")
                    router.refresh() // Force refresh after setting image
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-serif text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-serif text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  )
}

