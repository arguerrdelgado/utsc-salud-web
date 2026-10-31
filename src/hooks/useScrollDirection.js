import { useState, useEffect } from 'react'

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState('up')
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const atTop = scrollY <= 15
      setIsAtTop(atTop)

      const diff = scrollY - lastScrollY

      // Umbral mínimo de 6px para evitar vibraciones al tocar
      if (Math.abs(diff) < 6) {
        ticking = false
        return
      }

      // Ignorar rebotes de iOS en los extremos (rubber-banding)
      if (scrollY < 0) {
        ticking = false
        return
      }

      setScrollDirection(diff > 0 ? 'down' : 'up')
      lastScrollY = Math.max(0, scrollY)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Al hacer scroll hacia abajo se oculta la superior y se muestra la inferior.
  // Al hacer scroll hacia arriba se muestra la superior y se oculta la inferior.
  // En la parte superior (inicio de la página) ambas están accesibles.
  const showTop = scrollDirection === 'up' || isAtTop
  const showBottom = scrollDirection === 'down' || isAtTop

  return { scrollDirection, isAtTop, showTop, showBottom }
}
