"use client"

import { useEffect, useRef, useState } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  accelerationX: number
  accelerationY: number
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)
  const [clickPosition, setClickPosition] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })

  const boidSettings = {
    separationDistance: 25,
    alignmentStrength: 0.05,
    cohesionStrength: 0.05,
    separationStrength: 0.1,
    maxSpeed: 2,
  }

  // Get the current particle color based on theme
  const getParticleColor = () => {
    // Check if we're in dark mode
    const isDarkMode = document.documentElement.classList.contains("dark")
    return isDarkMode ? "#ffffff" : "#333333"
  }

  useEffect(() => {
    const initParticles = () => {
      const particles: Particle[] = []
      const canvas = canvasRef.current
      if (!canvas) return []

      const particleCount = Math.min(Math.floor(window.innerWidth * 0.15), 1000)

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.5 + 0.1,
          accelerationX: 0,
          accelerationY: 0,
        })
      }

      return particles
    }

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
        particlesRef.current = initParticles()
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    // Set up a mutation observer to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          // Force redraw of particles when theme changes
          if (canvasRef.current && canvasRef.current.getContext) {
            const ctx = canvasRef.current.getContext("2d")
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            }
          }
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameRef.current)
      observer.disconnect()
    }
  }, [])

  const applyBoidBehavior = (particle: Particle, particles: Particle[]) => {
    let alignmentX = 0
    let alignmentY = 0
    let cohesionX = 0
    let cohesionY = 0
    let separationX = 0
    let separationY = 0
    let neighborCount = 0

    for (const otherParticle of particles) {
      if (otherParticle === particle) continue

      const distance = Math.sqrt((particle.x - otherParticle.x) ** 2 + (particle.y - otherParticle.y) ** 2)

      if (distance < boidSettings.separationDistance) {
        neighborCount++
        alignmentX += otherParticle.speedX
        alignmentY += otherParticle.speedY
        cohesionX += otherParticle.x
        cohesionY += otherParticle.y

        separationX -= (otherParticle.x - particle.x) / distance
        separationY -= (otherParticle.y - particle.y) / distance
      }
    }

    if (neighborCount > 0) {
      alignmentX /= neighborCount
      alignmentY /= neighborCount
      cohesionX /= neighborCount
      cohesionY /= neighborCount
      cohesionX = cohesionX - particle.x
      cohesionY = cohesionY - particle.y

      alignmentX = (alignmentX - particle.speedX) * boidSettings.alignmentStrength
      alignmentY = (alignmentY - particle.speedY) * boidSettings.alignmentStrength

      cohesionX *= boidSettings.cohesionStrength
      cohesionY *= boidSettings.cohesionStrength

      separationX *= boidSettings.separationStrength
      separationY *= boidSettings.separationStrength

      particle.accelerationX += alignmentX + cohesionX + separationX
      particle.accelerationY += alignmentY + cohesionY + separationY
    }
  }

  const limitSpeed = (particle: Particle, maxSpeed: number) => {
    const speed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY)
    if (speed > maxSpeed) {
      particle.speedX = (particle.speedX / speed) * maxSpeed
      particle.speedY = (particle.speedY / speed) * maxSpeed
    }
  }

  const spawnParticles = (x: number, y: number, count: number) => {
    const newParticles: Particle[] = []

    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 20, // Slight random offset
        y: y + (Math.random() - 0.5) * 20,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5, // Initial speed
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        accelerationX: 0,
        accelerationY: 0,
      })
    }
    particlesRef.current = [...particlesRef.current, ...newParticles]
  }

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Get current particle color based on theme
      const particleColor = getParticleColor()

      particlesRef.current.forEach((particle, index) => {
        particle.accelerationX = 0
        particle.accelerationY = 0

        applyBoidBehavior(particle, particlesRef.current)

        particle.speedX += particle.accelerationX
        particle.speedY += particle.accelerationY

        limitSpeed(particle, boidSettings.maxSpeed)

        particle.x += particle.speedX
        particle.y += particle.speedY

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1
        }

        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1
        }

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)

        // Convert opacity to hex for the color
        const opacityHex = Math.round(particle.opacity * 255)
          .toString(16)
          .padStart(2, "0")
        ctx.fillStyle = `${particleColor}${opacityHex}`
        ctx.fill()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [mousePosition, isHovering, clickPosition])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      if (isHovering) {
        spawnParticles(e.clientX, e.clientY, 1)
      }
    }

    const handleMouseEnter = () => {
      setIsHovering(true)
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    const handleClick = (e: MouseEvent) => {
      setClickPosition({ x: e.clientX, y: e.clientY })
      spawnParticles(e.clientX, e.clientY, 25)
    }

    // Listen for theme changes to update particles
    const handleThemeChange = () => {
      // Force a redraw
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseenter", handleMouseEnter)
    window.addEventListener("mouseleave", handleMouseLeave)
    window.addEventListener("click", handleClick)
    window.addEventListener("storage", handleThemeChange)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseenter", handleMouseEnter)
      window.removeEventListener("mouseleave", handleMouseLeave)
      window.removeEventListener("click", handleClick)
      window.removeEventListener("storage", handleThemeChange)
    }
  }, [isHovering])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" style={{ pointerEvents: "auto" }} />
}

