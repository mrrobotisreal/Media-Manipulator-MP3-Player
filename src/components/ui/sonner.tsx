import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  // Detect dark mode from document class
  const isDark = document.documentElement.classList.contains('dark')

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      toastOptions={{
        style: {
          borderRadius: '8px',
          border: '1px solid',
        },
        classNames: {
          success: 'success-toast',
          error: 'error-toast',
        },
      }}
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          // Success toast styles (green)
          "--success-bg": isDark ? "#0f3b23" : "#f0fdf4",
          "--success-text": isDark ? "#4ade80" : "#16a34a",
          "--success-border": isDark ? "#16a34a" : "#bbf7d0",
          // Error toast styles (red)
          "--error-bg": isDark ? "#3f1318" : "#fef2f2",
          "--error-text": isDark ? "#f87171" : "#dc2626",
          "--error-border": isDark ? "#dc2626" : "#fecaca",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
