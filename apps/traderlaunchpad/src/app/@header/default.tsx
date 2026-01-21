import { Header } from '~/components/landing/Header'
import React from 'react'

export default function AdminHeaderDefault() {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
      <Header />
    </div>
  )
}