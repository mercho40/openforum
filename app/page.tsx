import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExternalLink, MessageSquare, Users, Globe, Shield, Code } from "lucide-react"

// Enable static generation for landing page
export const revalidate = 3600 // Revalidate every hour
export const dynamic = 'force-static'

// Generate static metadata
export async function generateMetadata() {
  return {
    title: "OpenForum - Modern Open Source Forum Platform",
    description: "Join the conversation on OpenForum, a modern, open-source forum platform built for communities. Connect, share ideas, and engage with others.",
    keywords: ["forum", "community", "discussion", "open source", "Next.js"],
    openGraph: {
      title: "OpenForum - Modern Open Source Forum Platform",
      description: "Join the conversation on OpenForum, a modern, open-source forum platform built for communities.",
      type: "website",
    },
  }
}

export default function LandingPage() {
  const year = new Date().getFullYear()

  return (
    <main className="w-full h-full">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
        Skip to content
      </a>

      {/* Header */}
      <header
        className={`w-full py-4 px-4 sm:px-6 border-b transition-all duration-300 sticky top-0 z-10 border-transparent bg-transparent`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-bounce-subtle" aria-hidden="true" />
            <h1 className="text-xl sm:text-2xl font-bold">OpenForum</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4">
              <Button
                asChild
                size="sm"
                className="rounded-full"
              >
                <Link href="/forum">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="main-content"
        className="w-full py-12 sm:py-16 md:py-24 lg:py-32 relative overflow-hidden gradient-mesh animate-gradient-shift"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-6 animate-fade-in-up">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-xs sm:text-sm font-medium text-primary mb-2">
              Open Source
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl">
              Create your own community with OpenForum
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl">
              An open source forum platform that lets anyone build and customize their own discussion community in
              minutes.
            </p>
            <div className="flex flex-col xs:flex-row gap-4 mt-4 sm:mt-6 w-full xs:w-auto">
              <Button asChild size="lg" className="rounded-full w-full xs:w-auto animate-bounce-subtle">
                <Link href="/forum">
                  View Forum
                  <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full w-full xs:w-auto">
                <Link
                  href="https://github.com/mercho40/openforum"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View OpenForum on GitHub"
                >
                  GitHub
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                  >
                    <path
                      fill="currentColor"
                      d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
                    />
                  </svg>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div
          className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          aria-hidden="true"
        ></div>
        <div
          className="absolute -top-24 -right-24 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          aria-hidden="true"
        ></div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 sm:py-16 md:py-24 bg-muted/30 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Why Choose OpenForum?</h2>
            <p className="text-muted-foreground mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base">
              Built with modern technologies and designed for customization, performance, and ease of use.
            </p>
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 stagger-children opacity-100`}
          >
            {/* Feature 1 */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg p-4 sm:p-6 flex flex-col items-center text-center h-full animate-fade-in-up">
              <div
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 animate-float"
                aria-hidden="true"
              >
                <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Create Your Community</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Launch your own forum in minutes with customizable categories, themes, and moderation tools.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg p-4 sm:p-6 flex flex-col items-center text-center h-full animate-fade-in-up">
              <div
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 animate-float"
                aria-hidden="true"
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Engage Your Audience</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Foster meaningful discussions with rich text formatting, reactions, and notification systems.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg p-4 sm:p-6 flex flex-col items-center text-center h-full animate-fade-in-up">
              <div
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 animate-float"
                aria-hidden="true"
              >
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Secure & Reliable</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Built with security in mind, featuring user authentication, moderation tools, and spam protection.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg p-4 sm:p-6 flex flex-col items-center text-center h-full animate-fade-in-up">
              <div
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 animate-float"
                aria-hidden="true"
              >
                <Code className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Open Source</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Fully open source and free to use, modify, and extend to fit your specific needs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg p-4 sm:p-6 flex flex-col items-center text-center h-full animate-fade-in-up">
              <div
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 animate-float"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 sm:h-6 sm:w-6 text-primary"
                  aria-hidden="true"
                >
                  <path d="M12 2H2v10h10V2z"></path>
                  <path d="M12 12h10v10H12V12z"></path>
                  <path d="M22 2h-5v5h5V2z"></path>
                  <path d="M7 17H2v5h5v-5z"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Customizable</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Tailor the look and feel with themes, custom CSS, and extensible components.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg p-4 sm:p-6 flex flex-col items-center text-center h-full animate-fade-in-up">
              <div
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 animate-float"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 sm:h-6 sm:w-6 text-primary"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Privacy-Focused</h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                Host your own instance and maintain full control over your community&apos;s data.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div
          className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent opacity-50"
          aria-hidden="true"
        ></div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 sm:py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-card/30 backdrop-blur-sm border border-border/10 rounded-lg p-6 sm:p-8 md:p-12 relative overflow-hidden">
            {/* Background gradient */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10"
              aria-hidden="true"
            ></div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3 sm:mb-4">
                  Ready to start your community?
                </h2>
                <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
                  Join the growing number of communities powered by OpenForum. It&apos;s free, open source, and ready for you
                  to customize.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button asChild size="lg" className="rounded-full w-full sm:w-auto">
                  <Link href="/forum">Try Forum</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full w-full sm:w-auto">
                  <Link
                    href="https://github.com/mercho40/openforum"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View OpenForum on GitHub"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="1em"
                      height="1em"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                    >
                      <path
                        fill="currentColor"
                        d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
                      />
                    </svg>
                    View on GitHub
                  </Link>
                </Button>
              </div>
            </div>

            {/* Decorative elements */}
            <div
              className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl"
              aria-hidden="true"
            ></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-border/10 mt-auto">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" aria-hidden="true" />
              <span className="font-bold text-sm sm:text-base">OpenForum</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
              &copy; {year} OpenForum. Open source under MIT license.
            </div>
            <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="https://github.com/mercho40/openforum"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
                aria-label="OpenForum GitHub repository"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                >
                  <path
                    fill="currentColor"
                    d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"
                  />
                </svg>
              </Link>
              <Link
                href="/docs"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2 py-1"
              >
                Documentation
              </Link>
              <Link
                href="/privacy"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2 py-1"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2 py-1"
              >
                Terms
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  )
}
