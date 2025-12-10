'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { signupRequestApi } from '@/lib/api'
import { AppBar } from '@/components/AppBar'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    firmName: '',
    firmSize: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      await signupRequestApi.createRequest({
        name: formData.name,
        email: formData.email,
        organization: formData.firmName,
        message: formData.message || undefined,
      })
      
      setSubmitted(true)
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false)
        setFormData({ name: '', email: '', firmName: '', firmSize: '', message: '' })
      }, 3000)
    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary-foreground" style={{ backgroundColor: 'hsl(42, 50%, 88%)', minHeight: '100vh' }}>
      {/* HEADER / NAV - Using AppBar component */}
      <AppBar navItems={[]} showContactButton={false} showLoginLink={false} />

      {/* Contact Form Section */}
      <section className="relative w-full h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 w-full py-6">



          <Card className="bg-background border-border shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-xl">Contact us</CardTitle>
              <CardDescription className="font-sans text-xs">
                We'll respond within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {submitted ? (
                <div className="py-4 text-center">
                  <p className="font-sans text-base font-medium text-[#1e293b]">
                    Thank you for your interest! We'll be in touch soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-2 rounded-md bg-destructive/10 text-destructive text-xs font-sans border border-destructive/20">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="font-sans font-medium text-foreground text-sm">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="font-sans border-border focus:border-[#1e293b] focus:ring-[#1e293b] h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="font-sans font-medium text-foreground text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@yourcompany.com"
                      className="font-sans border-border focus:border-[#1e293b] focus:ring-[#1e293b] h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="firmName" className="font-sans font-medium text-foreground text-sm">Firm name</Label>
                    <Input
                      id="firmName"
                      type="text"
                      required
                      value={formData.firmName}
                      onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                      placeholder="Your firm or organization name"
                      className="font-sans border-border focus:border-[#1e293b] focus:ring-[#1e293b] h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="firmSize" className="font-sans font-medium text-foreground text-sm">Firm size</Label>
                    <Input
                      id="firmSize"
                      type="text"
                      value={formData.firmSize}
                      onChange={(e) => setFormData({ ...formData, firmSize: e.target.value })}
                      placeholder="e.g., 10-50 professionals"
                      className="font-sans border-border focus:border-[#1e293b] focus:ring-[#1e293b] h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="font-sans font-medium text-foreground text-sm">Message</Label>
                    <Textarea
                      id="message"
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your needs..."
                      className="font-sans border-border focus:border-[#1e293b] focus:ring-[#1e293b] text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="w-full font-sans bg-[#3b4a5f] text-white hover:bg-[#3b4a5f]/90 shadow-sm hover:shadow-md transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit request'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

