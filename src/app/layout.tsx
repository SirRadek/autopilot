import './globals.css'
import type React from 'react'

export const metadata = {
  title: 'Autopilot ClientOps CMS',
  description: 'Shared CMS, lead intake and workflow queue for Radeq client projects.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  )
}
