import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Camera, CheckCircle2, Loader2, Upload, X, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Detect() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const [images, setImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDetectionId, setCurrentDetectionId] = useState<number | null>(null);
  const [analysisStage, setAnalysisStage] = useState<"upload" | "analyzing" | "result">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.detection.analyze.useMutation();
  const addImageMutation = trpc.detection.addVerificationImage.useMutation();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImages([...images, base64]);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage("analyzing");

    try {
      // Analyze first image
      const result = await analyzeMutation.mutateAsync({
        imageBase64: images[0],
      });

      setCurrentDetectionId(result.detectionId);

      // If confidence is high, go directly to results
      if (result.confidenceLevel === "high") {
        setTimeout(() => {
          navigate(`/result/${result.detectionId}`);
        }, 1500);
        return;
      }

      // If we have more images, analyze them for ensemble
      if (images.length > 1) {
        for (let i = 1; i < images.length; i++) {
          await addImageMutation.mutateAsync({
            detectionId: result.detectionId,
            imageBase64: images[i],
          });
        }
      }

      // Navigate to result after analysis
      setTimeout(() => {
        navigate(`/result/${result.detectionId}`);
      }, 1500);
    } catch (error) {
      setAnalysisStage("upload");
      toast.error(
        error instanceof Error ? error.message : "Failed to analyze image"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 fade-in">
          <Link href="/">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
            Scan Your Crop
          </h1>
          <p className="text-muted-foreground">
            Upload clear photos of affected leaves from different angles for accurate diagnosis
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Upload Section */}
          {analysisStage === "upload" && (
            <Card className="slide-in-left border-2 border-dashed border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Upload Plant Images
                </CardTitle>
                <CardDescription>
                  Start with one image, then add more for better accuracy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Area */}
                <div
                  className="cursor-pointer rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition hover:border-primary/50 hover:bg-primary/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="mb-1 font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      {images.length} image{images.length !== 1 ? "s" : ""} selected
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {images.map((image, index) => (
                        <div key={index} className="relative overflow-hidden rounded-lg border border-border">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="h-32 w-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute right-1 top-1 rounded-full bg-destructive/80 p-1 text-white hover:bg-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-2 py-1 text-xs text-white">
                            Image {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                <Alert className="border-primary/30 bg-primary/5">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm text-foreground">
                    <strong>For best results:</strong> Take close-up photos of affected leaves with good lighting. Include multiple angles if possible.
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="w-full sm:flex-1"
                  >
                    <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Add More Images</span>
                    <span className="sm:hidden text-xs">Add</span>
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={images.length === 0 || isAnalyzing}
                    size="sm"
                    className="w-full sm:flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="hidden sm:inline">Analyzing...</span>
                        <span className="sm:hidden text-xs">...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Analyze</span>
                        <span className="sm:hidden text-xs">Check</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analyzing State */}
          {analysisStage === "analyzing" && (
            <Card className="slide-in-right border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Analyzing Your Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      AI Analysis in Progress
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {images.length > 1 ? `${images.length} images` : "1 image"}
                    </span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {images.length > 1
                      ? "Comparing multiple images for better accuracy..."
                      : "Examining plant symptoms..."}
                  </p>
                </div>

                <Alert className="border-primary/30 bg-primary/5">
                  <AlertDescription className="text-sm text-foreground">
                    This usually takes 10-30 seconds. Please wait...
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Information Cards */}
          <div className="grid gap-4 md:grid-cols-2 fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Why Multiple Images?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Multiple photos from different angles help our AI confirm the diagnosis with higher accuracy and reduce the chance of misidentification.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Image Quality Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="list-inside list-disc space-y-1">
                  <li>Close-up of affected leaf</li>
                  <li>Good natural lighting</li>
                  <li>Avoid shadows and glare</li>
                  <li>Clear focus on symptoms</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* History Link */}
          <div className="text-center fade-in">
            <Link href="/history">
              <Button variant="outline">View Detection History</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
0

