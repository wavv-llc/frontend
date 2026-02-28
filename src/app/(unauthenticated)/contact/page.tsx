'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { signupRequestApi } from '@/lib/api';
import { RetroWaterAnimation } from '@/components/landing/RetroWaterAnimation';
import { AppBar } from '@/components/AppBar';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';

const NAV_ITEMS = [
    { name: 'Features', href: '/#features' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Why Wavv', href: '/#why-wavv' },
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        firmName: '',
        firmSize: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await signupRequestApi.createRequest({
                name: formData.name,
                email: formData.email,
                organization: formData.firmName,
                message: formData.message || undefined,
            });

            setSubmitted(true);

            setTimeout(() => {
                setSubmitted(false);
                setFormData({
                    name: '',
                    email: '',
                    firmName: '',
                    firmSize: '',
                    message: '',
                });
            }, 3000);
        } catch (err) {
            console.error('Error submitting request:', err);
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to submit request. Please try again.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen text-steel-950 overflow-x-hidden bg-white">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <RetroWaterAnimation intensity="medium" />
            </div>

            <AppBar navItems={NAV_ITEMS} />

            <section className="relative pt-20 pb-16 min-h-screen flex items-center justify-center z-10">
                <div className="max-w-6xl mx-auto px-6 w-full">
                    <div className="rounded-2xl p-6 md:p-10 scale-[0.85] bg-white/95 backdrop-blur-sm">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* Left Column */}
                            <div>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mb-8 -ml-2 text-muted-foreground hover:text-foreground"
                                        asChild
                                    >
                                        <Link href="/">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Back to home
                                        </Link>
                                    </Button>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                >
                                    <Badge
                                        variant="secondary"
                                        className="mb-4 text-xs font-medium"
                                    >
                                        Request Access
                                    </Badge>
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-6 text-steel-950">
                                        Let's talk about <br />
                                        <span className="italic text-steel-600">
                                            your firm.
                                        </span>
                                    </h1>
                                    <p className="text-lg max-w-md leading-relaxed text-steel-600">
                                        Ready to transform how your team works?
                                        Fill out the form and we'll be in touch
                                        within 24 hours to schedule a
                                        personalized demo.
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.25 }}
                                    className="mt-10 space-y-4"
                                >
                                    <Separator />
                                    {[
                                        'Personalized demo within 24h',
                                        'No commitment required',
                                        'Enterprise-grade security',
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center gap-3 text-sm text-steel-600"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-steel-800 shrink-0" />
                                            {item}
                                        </div>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Right Column - Form */}
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Card className="border-steel-200 shadow-2xl">
                                    <CardHeader>
                                        <CardTitle className="font-serif text-xl text-steel-950">
                                            Get in touch
                                        </CardTitle>
                                        <CardDescription>
                                            We typically respond within one
                                            business day.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {submitted ? (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                className="py-12 text-center space-y-4"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-steel-100 flex items-center justify-center mx-auto">
                                                    <Send className="w-8 h-8 text-steel-800" />
                                                </div>
                                                <h3 className="text-2xl font-serif font-bold text-steel-950">
                                                    Thank you!
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    We'll be in touch soon.
                                                </p>
                                            </motion.div>
                                        ) : (
                                            <form
                                                onSubmit={handleSubmit}
                                                className="space-y-5"
                                            >
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    <Field
                                                        label="Name"
                                                        htmlFor="name"
                                                        required
                                                    >
                                                        <Input
                                                            id="name"
                                                            type="text"
                                                            required
                                                            value={
                                                                formData.name
                                                            }
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    name: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            }
                                                            placeholder="Your full name"
                                                            className="h-11"
                                                        />
                                                    </Field>
                                                    <Field
                                                        label="Email"
                                                        htmlFor="email"
                                                        required
                                                    >
                                                        <Input
                                                            id="email"
                                                            type="email"
                                                            required
                                                            value={
                                                                formData.email
                                                            }
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    email: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            }
                                                            placeholder="you@company.com"
                                                            className="h-11"
                                                        />
                                                    </Field>
                                                </div>

                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    <Field
                                                        label="Firm name"
                                                        htmlFor="firmName"
                                                        required
                                                    >
                                                        <Input
                                                            id="firmName"
                                                            type="text"
                                                            required
                                                            value={
                                                                formData.firmName
                                                            }
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    firmName:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="Your firm name"
                                                            className="h-11"
                                                        />
                                                    </Field>
                                                    <Field
                                                        label="Firm size"
                                                        htmlFor="firmSize"
                                                    >
                                                        <NativeSelect
                                                            id="firmSize"
                                                            value={
                                                                formData.firmSize
                                                            }
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    firmSize:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            placeholder="Select size"
                                                            className="h-11"
                                                        >
                                                            <option value="1-10">
                                                                1–10
                                                                professionals
                                                            </option>
                                                            <option value="10-50">
                                                                10–50
                                                                professionals
                                                            </option>
                                                            <option value="50-200">
                                                                50–200
                                                                professionals
                                                            </option>
                                                            <option value="200+">
                                                                200+
                                                                professionals
                                                            </option>
                                                        </NativeSelect>
                                                    </Field>
                                                </div>

                                                <Field
                                                    label="Message"
                                                    htmlFor="message"
                                                >
                                                    <Textarea
                                                        id="message"
                                                        rows={4}
                                                        value={formData.message}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                message:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        placeholder="Tell us about your needs..."
                                                        className="resize-none"
                                                    />
                                                </Field>

                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    className="w-full h-12 text-base font-medium"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <span className="flex items-center gap-2">
                                                            <Spinner
                                                                size="sm"
                                                                className="text-current"
                                                            />
                                                            Submitting...
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">
                                                            Submit Request
                                                            <Send className="w-4 h-4" />
                                                        </span>
                                                    )}
                                                </Button>
                                            </form>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
}
