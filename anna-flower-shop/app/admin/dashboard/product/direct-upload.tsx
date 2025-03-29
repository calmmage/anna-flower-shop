"use client"

import type React from "react"

import { useState } from "react"

interface DirectUploadProps {
  productId: string
  onSuccess: (url: string) => void
}

export function DirectUpload({ productId, onSuccess }: DirectUploadProps) {
  const [error, setError] = useState<string | null>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Simple validation
    if (file.size > 4 * 1024 * 1024) {
      setError("File size exceeds 4MB limit")
      return
    }

    // Create a local object URL as a fallback
    const objectUrl = URL.createObjectURL(file)
    onSuccess(objectUrl)
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700">Alternative Upload Method</h3>
      <p className="text-xs text-gray-500 mb-2">
        If you're having trouble with the main upload, try this simpler method:
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
      />

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      <p className="mt-1 text-xs text-gray-500">
        Note: This method uses browser storage and images will not persist after page refresh.
      </p>
    </div>
  )
}

