import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background w-full">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "w-full h-screen flex items-center justify-center",
            card: "!shadow-none !border-none !bg-transparent !w-full !max-w-none !p-0",
            header: "text-center",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/80",
            main: "w-full max-w-none"
          },
          layout: {
            socialButtonsPlacement: "top",
            showOptionalFields: true
          }
        }}
      />
    </div>
  )
}

