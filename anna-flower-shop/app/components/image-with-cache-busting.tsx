"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import type { ImageProps } from "next/image"

interface ImageWithCacheBustingProps extends Omit<ImageProps, "src"> {
  src: string
}

export function ImageWithCacheBusting({ src, ...props }: ImageWithCacheBustingProps) {
  const [cacheBustedSrc, setCacheBustedSrc] = useState(src)

  useEffect(() => {
    // Only add timestamp to blob URLs after client-side hydration
    if (src.includes("blob")) {
      setCacheBustedSrc(`${src}?t=${Date.now()}`)
    }
  }, [src])

  return <Image src={cacheBustedSrc || "/placeholder.svg"} {...props} />
}

