"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Colors follow the same recipe StatusBadge uses everywhere else in the app
// (15% tint background, 30% border, foreground-safe text) so a toast reads
// as part of Procurex rather than sonner's stock rich-colors palette.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      toastOptions={{
        classNames: {
          toast: "font-sans",
          title: "font-medium",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-info" />,
        warning: <TriangleAlertIcon className="size-4 text-warning-foreground" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          "--success-bg": "color-mix(in oklch, var(--success) 15%, var(--popover))",
          "--success-border": "color-mix(in oklch, var(--success) 30%, transparent)",
          "--success-text": "var(--success)",

          "--info-bg": "color-mix(in oklch, var(--info) 15%, var(--popover))",
          "--info-border": "color-mix(in oklch, var(--info) 30%, transparent)",
          "--info-text": "var(--info)",

          "--warning-bg": "color-mix(in oklch, var(--warning) 15%, var(--popover))",
          "--warning-border": "color-mix(in oklch, var(--warning) 30%, transparent)",
          "--warning-text": "var(--warning-foreground)",

          "--error-bg": "color-mix(in oklch, var(--destructive) 12%, var(--popover))",
          "--error-border": "color-mix(in oklch, var(--destructive) 30%, transparent)",
          "--error-text": "var(--destructive)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
