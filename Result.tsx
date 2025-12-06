import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import SymptomChecklist from "@/components/SymptomChecklist";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Droplets,
  Leaf,
  Loader2,
  Shield,
  Sprout,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { Streamdown } from "streamdown";

export default function Result() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/result/:id");
  const submitVerificationMutation = trpc.company.submitVerification.useMutation();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const detectionId = params?.id ? parseInt(params.id) : null;
  if (!detectionId) {
    return <div>Invalid detection ID</div>;
  }

  const { data: detection, isLoading } = trpc.detection.getById.useQuery(
    { id: detectionId },
    { enabled: !!detectionId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading diagnosis...</p>
        </div>
      </div>
    );
  }

  if (!detection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Detection Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The detection record could not be found.
            </p>
            <Link href="/detect">
              <Button className="w-full">Back to Detection</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const treatments = detection.treatments ? JSON.parse(detection.treatments) : {};
  const metadata = detection.metadata ? JSON.parse(detection.metadata) : {};
  const ensembleData = detection.ensembleAnalysis
    ? JSON.parse(detection.ensembleAnalysis)
    : null;

  // Determine UI based on confidence level
  const isHighConfidence = detection.confidenceLevel === "high";
  const isMediumConfidence = detection.confidenceLevel === "medium";
  const isLowConfidence = detection.confidenceLevel === "low" || detection.confidenceLevel === "uncertain";

  const confidence = detection.confidence ?? 0;
  const confidenceColor =
    confidence >= 80
      ? "text-green-600"
      : confidence >= 50
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8 fade-in">
          <Link href="/detect">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Detection
            </Button>
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
            Diagnosis Results
          </h1>
          <p className="text-muted-foreground">
            AI-powered analysis of your crop
          </p>
        </div>

        {/* Main Result Card */}
        <div className="space-y-6">
          {/* Disease Card */}
          {isHighConfidence && (
            <Card className="slide-in-left border-2 border-green-200 bg-gradient-to-br from-green-50 to-background">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">
                        Confirmed Diagnosis
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl md:text-3xl">
                      {detection.diseaseName}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${confidenceColor}`}>
                      {confidence}%
                    </p>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={confidence} className="h-3" />
                <p className="text-foreground">{detection.description}</p>
              </CardContent>
            </Card>
          )}

          {isMediumConfidence && (
            <Card className="slide-in-left border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-background">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Likely Diagnosis
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl md:text-3xl">
                      {detection.diseaseName}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${confidenceColor}`}>
                      {confidence}%
                    </p>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={confidence} className="h-3" />
                <p className="text-foreground">{detection.description}</p>
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    This diagnosis has moderate confidence. Consider uploading 1-2 more images from different angles to confirm.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {isLowConfidence && (
            <Card className="slide-in-left border-2 border-red-200 bg-gradient-to-br from-red-50 to-background">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                      <Badge className="bg-red-100 text-red-800">
                        Uncertain
                      </Badge>
                    </div>
                    <CardTitle className="text-xl md:text-2xl">
                      Unable to Diagnose Accurately
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    The image quality or symptoms are unclear. Please upload 2-3 clearer images from different angles for accurate diagnosis.
                  </AlertDescription>
                </Alert>

                <div className="bg-white rounded-lg p-4 border border-border space-y-3">
                  <p className="font-medium text-foreground">Possible Issues:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Image is too blurry or out of focus</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Shadows or glare blocking the leaf surface</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Too much background in the photo</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Leaf is folded or overexposed</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4 border border-border space-y-3">
                  <p className="font-medium text-foreground">How to Fix:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Take a close photo of the most affected leaf</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Add 2 more photos from different angles</span>
                    </li>
                    <li className="flex gap-2">
                      <span>•</span>
                      <span>Avoid sun glare and harsh shadows</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Treatment Sections - Only show if diagnosis is confident */}
          {!isLowConfidence && (
            <>
              {/* What You Should Do Today */}
              <Card className="slide-in-left border-l-4 border-l-primary">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-primary" />
                    What You Should Do Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Immediate Action
                      </h4>
                      <p className="text-sm text-blue-800">
                        {treatments.chemicalControl
                          ? treatments.chemicalControl.split("\n")[0]
                          : "Consult with a local agricultural expert"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                        <Leaf className="h-4 w-4" />
                        Field Management
                      </h4>
                      <p className="text-sm text-green-800">
                        Isolate affected plants and improve airflow around the area
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Causes */}
              <Card className="slide-in-left">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    What Causes This Disease
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground">
                    <Streamdown>{treatments.causes || "Information not available"}</Streamdown>
                  </div>
                </CardContent>
              </Card>

              {/* Conditions */}
              <Card className="slide-in-left">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-600" />
                    Conditions That Trigger It
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground">
                    <Streamdown>{treatments.conditions || "Information not available"}</Streamdown>
                  </div>
                </CardContent>
              </Card>

              {/* Impact */}
              <Card className="slide-in-left">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    Why It's Harmful
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground">
                    <Streamdown>{treatments.impact || "Information not available"}</Streamdown>
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Options Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Chemical Control */}
                <Card className="slide-in-left">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-base">Chemical Control</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none text-foreground">
                      <Streamdown>{treatments.chemicalControl || "Information not available"}</Streamdown>
                    </div>
                  </CardContent>
                </Card>

                {/* Cultural Treatment */}
                <Card className="slide-in-left">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="text-base">Cultural Treatment</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none text-foreground">
                      <Streamdown>{treatments.culturalTreatment || "Information not available"}</Streamdown>
                    </div>
                  </CardContent>
                </Card>

                {/* Drainage Solutions */}
                <Card className="slide-in-left">
                  <CardHeader className="bg-cyan-50">
                    <CardTitle className="text-base">Drainage Solutions</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none text-foreground">
                      <Streamdown>{treatments.drainageSolutions || "Information not available"}</Streamdown>
                    </div>
                  </CardContent>
                </Card>

                {/* Organic Protection */}
                <Card className="slide-in-left">
                  <CardHeader className="bg-amber-50">
                    <CardTitle className="text-base">Organic Protection</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none text-foreground">
                      <Streamdown>{treatments.organicProtection || "Information not available"}</Streamdown>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Symptom Verification Checklist */}
          {!isLowConfidence && (
            <SymptomChecklist
              diseaseName={detection.diseaseName || "Unknown Disease"}
              symptoms={[
                "Leaf spots or lesions visible",
                "Discoloration or yellowing",
                "Wilting or drooping leaves",
                "Powdery or fuzzy coating",
                "Stem or root damage",
                "Unusual growth patterns",
              ]}
              detectionId={detectionId}
              onSubmit={async (answers, notes) => {
                try {
                  await submitVerificationMutation.mutateAsync({
                    detectionId,
                    answers,
                    notes,
                  });
                } catch (error) {
                  throw error;
                }
              }}
            />
          )}

          {/* Ensemble Analysis Info */}
          {ensembleData && (
            <Card className="slide-in-left border-l-4 border-l-green-600">
              <CardHeader>
                <CardTitle className="text-base">Multi-Image Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {ensembleData.recommendation}
                </p>
                {ensembleData.votingResult && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Consensus: {ensembleData.votingResult.consensus ? "All images agree" : "Mixed results"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Object.entries(ensembleData.votingResult.votes)
                        .map(([disease, votes]) => `${disease}: ${votes} image(s)`)
                        .join(" • ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 fade-in">
            <Link href="/detect" className="w-full sm:flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Camera className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Analyze Another Plant</span>
                <span className="sm:hidden text-xs">Another</span>
              </Button>
            </Link>
            <Link href="/history" className="w-full sm:flex-1">
              <Button size="sm" className="w-full">
                <span className="hidden sm:inline">View Detection History</span>
                <span className="sm:hidden text-xs">History</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
0

