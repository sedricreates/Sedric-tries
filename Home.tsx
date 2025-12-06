import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Leaf, Camera, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-green-50 to-background py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Leaf className="h-4 w-4" />
              AI-Powered Crop Health
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Protect Your Crops with{" "}
              <span className="text-primary">AI Disease Detection</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Upload a photo of your plant and get instant disease diagnosis with treatment recommendations. 
              CropGuard AI helps farmers identify and treat crop diseases before they spread.
            </p>
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-center">
              {isAuthenticated ? (
                <Link href="/detect" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2">
                    <Camera className="h-5 w-5" />
                    Start Detection
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              )}
              <Link href="/about" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              How CropGuard AI Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Advanced machine learning technology makes crop disease detection simple and accurate
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="slide-in-left border-2 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Camera className="h-6 w-6" />
                </div>
                <CardTitle>1. Upload Image</CardTitle>
                <CardDescription>
                  Take a clear photo of the affected plant leaves or stems using your phone or camera
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="slide-in-right border-2 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Leaf className="h-6 w-6" />
                </div>
                <CardTitle>2. AI Analysis</CardTitle>
                <CardDescription>
                  Our advanced AI model analyzes the image and identifies diseases with high accuracy
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="slide-in-left border-2 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle>3. Get Treatment</CardTitle>
                <CardDescription>
                  Receive detailed diagnosis with treatment recommendations and prevention tips
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20 md:py-32">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="fade-in">
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Why Choose CropGuard AI?
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-foreground">Instant Results</h3>
                    <p className="text-muted-foreground">
                      Get disease diagnosis in seconds, not days. Early detection saves your crops.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-foreground">Expert Recommendations</h3>
                    <p className="text-muted-foreground">
                      Receive treatment plans based on agricultural research and best practices.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-foreground">Track Your History</h3>
                    <p className="text-muted-foreground">
                      Keep records of all detections to monitor crop health over time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="slide-in-right">
              <Card className="border-2 bg-card">
                <CardHeader>
                  <CardTitle>Ready to Protect Your Crops?</CardTitle>
                  <CardDescription>
                    Join thousands of farmers using AI to maintain healthy crops
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAuthenticated ? (
                    <Link href="/detect">
                      <Button size="lg" className="w-full gap-2">
                        <Camera className="h-5 w-5" />
                        Start Detection Now
                      </Button>
                    </Link>
                  ) : (
                    <a href={getLoginUrl()} className="block">
                      <Button size="lg" className="w-full">
                        Sign Up Free
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2 text-foreground">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">CropGuard AI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 CropGuard AI. Powered by advanced machine learning.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
0

