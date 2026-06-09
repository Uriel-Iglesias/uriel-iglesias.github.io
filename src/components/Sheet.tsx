import { useEffect, useRef, useState } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Etiqueta accesible del sheet. */
  ariaLabel?: string
}

/**
 * Bottom sheet reutilizable estilo iOS.
 * - Overlay oscuro (tap para cerrar). SIN backdrop-filter en el sheet (causa lag en iPhone).
 * - Animación: translateY 100% → 0 en 0.28s, acelerada por GPU.
 * - Bloquea el scroll del fondo y respeta el safe-area inferior.
 */
export default function Sheet({ open, onClose, children, ariaLabel }: SheetProps) {
  const [render, setRender] = useState(open)
  const [shown, setShown] = useState(false)
  const raf = useRef<number>()

  // Montaje/desmontaje con animación de salida.
  useEffect(() => {
    if (open) {
      setRender(true)
      // Dos rAF para garantizar el primer paint en estado "cerrado" antes de animar.
      raf.current = requestAnimationFrame(() => {
        raf.current = requestAnimationFrame(() => setShown(true))
      })
      return () => {
        if (raf.current) cancelAnimationFrame(raf.current)
      }
    }
    setShown(false)
    const t = setTimeout(() => setRender(false), 300)
    return () => clearTimeout(t)
  }, [open])

  // Bloquea el scroll del body mientras el sheet está montado.
  // En iOS Safari `overflow:hidden` NO basta: hay que fijar el body con position:fixed
  // y restaurar el scroll exacto al cerrar.
  useEffect(() => {
    if (!render) return
    const body = document.body
    const scrollY = window.scrollY
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo(0, scrollY)
    }
  }, [render])

  // Cerrar con Escape (teclado / escritorio).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!render) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 transition-opacity ease-out"
        style={{ transitionDuration: '0.28s', opacity: shown ? 1 : 0, touchAction: 'none' }}
      />

      {/* Sheet */}
      <div
        className="gpu no-select absolute inset-x-0 bottom-0 flex max-h-[92vh] max-h-[92dvh] flex-col rounded-t-22 bg-card shadow-sheet"
        style={{
          transform: shown ? 'translate3d(0,0,0)' : 'translate3d(0,100%,0)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Asa */}
        <div className="flex shrink-0 justify-center pb-1 pt-2.5">
          <div className="h-1.5 w-9 rounded-full bg-sep" />
        </div>

        {/* Contenido con scroll iOS y padding seguro inferior */}
        <div className="ios-scroll flex-1 px-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
