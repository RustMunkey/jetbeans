import Image from "next/image"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left side - Hero image with logo overlay */}
      <div className="relative hidden lg:flex flex-col">
        <Image
          src="/images/login.jpg"
          alt="JetBeans Coffee"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        {/* Logo overlay on image */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/90 overflow-hidden">
              <Image
                src="/logos/coffee.png"
                alt="JetBeans"
                width={24}
                height={24}
              />
            </div>
            <span className="font-[family-name:var(--font-rubik-mono)] text-white text-lg tracking-wide">
              JETBEANS
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Mobile logo - only shows on small screens */}
        <div className="flex justify-center gap-2 lg:hidden">
          <div className="flex items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-lg bg-foreground overflow-hidden">
              <Image
                src="/logos/coffee-white.png"
                alt="JetBeans"
                width={20}
                height={20}
                className="dark:hidden"
              />
              <Image
                src="/logos/coffee.png"
                alt="JetBeans"
                width={20}
                height={20}
                className="hidden dark:block"
              />
            </div>
            <span className="font-[family-name:var(--font-rubik-mono)] text-sm tracking-wide">
              JETBEANS
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
