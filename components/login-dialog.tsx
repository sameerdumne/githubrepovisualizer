'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import { GitHubIcon } from '@/components/github-icon'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { loginWithGitHub, isLoading } = useAuth()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to RepoViz</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={() => {
              onOpenChange(false)
              loginWithGitHub()
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <span className="mr-2">
                  <GitHubIcon size="sm" />
                </span>
                Continue with GitHub
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            You will be redirected to GitHub to authorize RepoViz.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
