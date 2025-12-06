import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Camera, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function History() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: detections, isLoading } = trpc.detection.getHistory.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-6xl">
        <div className="mb-8 fade-in">
          <Link href="/">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
                Detection History
              </h1>
              <p className="text-muted-foreground">
                View all your previous crop disease detections
              </p>
            </div>
            <Link href="/detect">
              <Button className="gap-2">
                <Camera className="h-4 w-4" />
                New Detection
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          </div>
        ) : !detections || detections.length === 0 ? (
          <Card className="fade-in">
            <CardHeader>
              <CardTitle>No Detections Yet</CardTitle>
              <CardDescription>
                You haven't analyzed any plants yet. Start your first detection to see results here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/detect">
                <Button className="gap-2">
                  <Camera className="h-4 w-4" />
                  Start First Detection
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {detections.map((detection, index) => {
              const isHealthy = detection.diseaseName === "Healthy" || !detection.diseaseName;
              const animationClass = index % 2 === 0 ? "slide-in-left" : "slide-in-right";
              
              return (
                <Link key={detection.id} href={`/result/${detection.id}`}>
                  <Card className={`${animationClass} cursor-pointer transition-all hover:shadow-lg`}>
                    <div className="aspect-video overflow-hidden rounded-t-lg border-b">
                      <img
                        src={detection.imageUrl}
                        alt={detection.diseaseName || "Plant"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-1 text-lg">
                          {detection.diseaseName || "Unknown"}
                        </CardTitle>
                        {isHealthy ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                        )}
                      </div>
                      <CardDescription>
                        {new Date(detection.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {detection.confidence && ` • ${detection.confidence}% confidence`}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
0

