'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { APP_CONFIG } from '@/lib/constants'
import type { NavbarProps } from '@/types'
import { User, LogOut, Home, ArrowRightLeft, Shield } from 'lucide-react'

export function Navbar({ user, onLogout }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleProfileClick = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={APP_CONFIG.routes.home} className="flex items-center space-x-2">
            <div className="text-xl font-bold text-teal-400">
              {APP_CONFIG.name}
            </div>
          </Link>

          {/* Navigation Links & User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Navigation Links for Logged In Users */}
                <Link
                  href={APP_CONFIG.routes.home}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                
                <Link
                  href={APP_CONFIG.routes.swapRequests}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Swap Requests</span>
                </Link>

                {/* Admin Panel Link for Admin Users */}
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-orange-300 hover:text-orange-100 hover:bg-orange-700 rounded-md transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    {user.profilePhoto ? (
                      <Image
                        src={user.profilePhoto}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-medium hidden sm:block">{user.name}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href={APP_CONFIG.routes.profile}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                      {onLogout && (
                        <button
                          onClick={() => {
                            onLogout()
                            setIsDropdownOpen(false)
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Login Button for Non-Authenticated Users */
              <Link href={APP_CONFIG.routes.login}>
                <Button variant="primary" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </nav>
  )
}
