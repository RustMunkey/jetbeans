import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You need an invitation to access this admin panel.
            Contact an existing team member for access.
          </p>
        </div>
        <Button variant="outline" asChild className="w-full">
          <Link href="/login">Try another account</Link>
        </Button>
      </div>
    </div>
  )
}
