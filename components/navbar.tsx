'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoginDialog } from '@/components/login-dialog'
import { GitHubIcon } from '@/components/github-icon'
import { useAuth } from '@/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Navbar() {
  const { user, logout } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6 sm:gap-8">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity duration-200">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:shadow-md transition-shadow duration-200">
                  <GitHubIcon size="md" />
                </div>
                <span className="hidden sm:inline">RepoViz</span>
              </Link>
              <div className="hidden gap-4 sm:gap-6 md:flex">
                <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-200">
                  Home
                </Link>
                <Link href="/history" className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-200">
                  History
                </Link>
                <Link href="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-200">
                  About
                </Link>
              </div>
            </div>
            <div className="ml-auto">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setLoginOpen(true)}
                  className="transition-all duration-200 hover:border-primary hover:bg-primary/5"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  )
}
