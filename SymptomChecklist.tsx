import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SymptomChecklistProps {
  diseaseName: string;
  symptoms: string[];
  detectionId: number;
  onSubmit?: (answers: Record<string, boolean>, notes: string) => void | Promise<void>;
}

export default function SymptomChecklist({
  diseaseName,
  symptoms,
  detectionId,
  onSubmit,
}: SymptomChecklistProps) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSymptomChange = (symptom: string, checked: boolean) => {
    setAnswers({
      ...answers,
      [symptom]: checked,
    });
  };

  const handleSubmit = async () => {
    const confirmedCount = Object.values(answers).filter(Boolean).length;
    const totalCount = symptoms.length;

    if (confirmedCount === 0) {
      toast.error("Please select at least one symptom");
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(answers, notes);
      }
      setSubmitted(true);
      toast.success("Thank you! Your feedback helps improve our diagnosis accuracy.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit verification"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-900">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="font-semibold">Verification Submitted</p>
              <p className="text-sm">Your feedback has been recorded and will help improve diagnosis accuracy for other farmers.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const confirmedCount = Object.values(answers).filter(Boolean).length;
  const totalCount = symptoms.length;
  const confirmationRate = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Verify Diagnosis
            </CardTitle>
            <CardDescription>
              Help us improve accuracy by confirming if these symptoms match your plant
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white">
            {confirmedCount}/{totalCount} confirmed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Symptoms Checklist */}
        <div className="space-y-3">
          <p className="font-medium text-foreground">
            Does your plant show these symptoms of {diseaseName}?
          </p>
          <div className="space-y-2">
            {symptoms.map((symptom, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 rounded-lg border border-blue-200 bg-white p-3"
              >
                <Checkbox
                  id={`symptom-${index}`}
                  checked={answers[symptom] || false}
                  onCheckedChange={(checked) =>
                    handleSymptomChange(symptom, checked as boolean)
                  }
                  className="mt-1"
                />
                <label
                  htmlFor={`symptom-${index}`}
                  className="flex-1 cursor-pointer text-sm text-foreground"
                >
                  {symptom}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Rate */}
        {confirmedCount > 0 && (
          <Alert className="border-blue-300 bg-blue-100">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              {confirmationRate === 100
                ? "Perfect! All symptoms match. The diagnosis is likely accurate."
                : confirmationRate >= 75
                  ? "Good match! Most symptoms align with the diagnosis."
                  : confirmationRate >= 50
                    ? "Partial match. Some symptoms don't align. Review the diagnosis carefully."
                    : "Low match. The diagnosis may not be accurate. Consider uploading more images."}
            </AlertDescription>
          </Alert>
        )}

        {/* Additional Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Additional Notes (Optional)
          </label>
          <Textarea
            placeholder="Add any other observations about your plant's condition..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-24 resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Your feedback helps us improve the AI model for better future diagnoses
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || confirmedCount === 0}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit Verification
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
0

