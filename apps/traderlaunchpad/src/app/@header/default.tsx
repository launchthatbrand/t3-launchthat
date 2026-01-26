import { Header } from '~/app/@header/_components/Header'
import React from 'react'

export default function AdminHeaderDefault() {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-md">
      <Header />
    </div>
  )
}