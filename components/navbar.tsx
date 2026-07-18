"use client"

import Link from "next/link"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GitHubIcon } from "@/components/github-icon"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <nav className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-16 w-full mx-auto max-w-[1440px]">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity duration-200">
            <GitHubIcon size="md" />
            <span className="hidden sm:inline font-semibold tracking-tight">RepoViz</span>
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/" className="text-[14px] font-medium tracking-[0.05em] uppercase text-muted-foreground hover:text-primary transition-colors">
              Repositories
            </Link>
            <Link href="/history" className="text-[14px] font-medium tracking-[0.05em] uppercase text-muted-foreground hover:text-primary transition-colors">
              History
            </Link>
            <Link href="/about" className="text-[14px] font-medium tracking-[0.05em] uppercase text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={user.login} />
                    <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                      {user.name[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">@{user.login}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/login" className="cursor-pointer">
                    My repositories
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              asChild
              className="transition-all duration-200 hover:border-primary hover:bg-primary/5"
            >
              <Link href="/login">
                Login
              </Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
