"use client";
import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Stethoscope,
  Info,
  AlertTriangle,
  ClipboardList,
  Activity,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

const ANIMAL_TYPES = [
  "Dog",
  "Cat",
  "Cow",
  "Horse",
  "Rabbit",
  "Sheep",
  "Goat",
  "Pig",
];

const SYMPTOMS_LIST = [
  { id: "appetite_loss", label: "Appetite Loss" },
  { id: "vomiting", label: "Vomiting" },
  { id: "diarrhea", label: "Diarrhea" },
  { id: "coughing", label: "Coughing" },
  { id: "labored_breathing", label: "Labored Breathing" },
  { id: "lameness", label: "Lameness (Difficulty Walking)" },
  { id: "skin_lesions", label: "Skin Lesions" },
  { id: "nasal_discharge", label: "Nasal Discharge" },
  { id: "eye_discharge", label: "Eye Discharge" },
];

export default function PredictorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    animalType: "",
    breed: "",
    age: "",
    weight: "",
    temp: "38.5",
    heartRate: "80",
    symptoms: {} as Record<string, boolean>,
    customSymptom: "",
  });

  const handleToggleSymptom = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [id]: !prev.symptoms[id],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animalType) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Prediction failed");

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Prediction Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result) {
      gsap.fromTo(
        ".result-card",
        { opacity: 0, scale: 0.9, x: 50 },
        { opacity: 1, scale: 1, x: 0, duration: 0.6, ease: "back.out(1.2)" }
      );
    }
  }, [result]);

  useEffect(() => {
    gsap.fromTo(
      ".predictor-form",
      { opacity: 0, x: -50 },
      { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }
    );
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            Disease Predictor
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFormData({
              animalType: "",
              breed: "",
              age: "",
              weight: "",
              temp: "38.5",
              heartRate: "80",
              symptoms: {},
              customSymptom: "",
            });
            setResult(null);
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Reset Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input Form */}
        <Card className="predictor-form shadow-lg border-primary/10">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Patient Assessment
            </CardTitle>
            <CardDescription>
              Provide accurate health metrics for better prediction.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Animal Type*</Label>
                  <Select
                    value={formData.animalType}
                    onValueChange={(val) =>
                      setFormData((p) => ({ ...p, animalType: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Species" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMAL_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Breed/Description</Label>
                  <Input
                    placeholder="e.g. Bulldog"
                    value={formData.breed}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, breed: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age (Years)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 5"
                    step="0.1"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, age: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 12"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, weight: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Body Temp (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.temp}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, temp: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heart Rate (BPM)</Label>
                  <Input
                    type="number"
                    value={formData.heartRate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, heartRate: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Binary Symptoms</Label>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 border rounded-lg p-4 bg-muted/30">
                  {SYMPTOMS_LIST.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <Label htmlFor={s.id} className="text-xs cursor-pointer">
                        {s.label}
                      </Label>
                      <Switch
                        id={s.id}
                        checked={formData.symptoms[s.id] || false}
                        onCheckedChange={() => handleToggleSymptom(s.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specific Clinical Observations</Label>
                <Input
                  placeholder="Describe other specific symptoms..."
                  value={formData.customSymptom}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, customSymptom: e.target.value }))
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-12 shadow-md active:scale-[0.98] transition-transform"
                disabled={loading || !formData.animalType}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-5 w-5" />
                    Perform Prediction
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results / Help */}
        <div className="space-y-6">
          {!result && !loading && (
            <Card className="border-dashed border-2 opacity-80">
              <CardContent className="pt-12 pb-12 text-center space-y-4">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Info className="h-10 w-10 text-primary/40" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Ready for Assessment</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Fill in the symptoms on the left to generate an AI-powered
                    disease prediction report based on the trained dataset.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="animate-pulse">
              <CardContent className="pt-24 pb-24 text-center">
                <Activity className="h-12 w-12 text-primary mx-auto animate-bounce mb-4" />
                <p className="text-lg font-medium">Processing Symptoms...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Querying the Neural ML model for patterns.
                </p>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="result-card border-t-4 border-t-primary shadow-xl overflow-hidden animate-in slide-in-from-right duration-500">
              <CardHeader className="bg-primary/5 pb-2">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary hover:bg-primary uppercase tracking-wider">
                    Official Report
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Generated: {new Date().toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-2xl pt-2">Diagnostic Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="bg-primary/10 rounded-xl p-5 border border-primary/20">
                  <p className="text-sm font-semibold uppercase text-primary/80">
                    Predicted Condition
                  </p>
                  <h3 className="text-3xl font-black text-primary mt-1">
                    {result.prediction || "Unknown Condition"}
                  </h3>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${result.confidence || 85}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {result.confidence || 85}% Confidence
                    </span>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                        Analysis Findings
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-400 mt-1 leading-relaxed">
                        {result.analysis}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
                    <ChevronRight className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-green-800 dark:text-green-300">
                        Recommended Actions
                      </p>
                      <ul className="text-sm text-green-700 dark:text-green-400 mt-1 space-y-1 list-disc list-inside">
                        {result.recommendations?.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground border-t pt-4 italic">
                  DISCLAIMER: This is an AI-generated assessment for educational
                  purposes based on provided datasets. It is NOT a professional
                  medical diagnosis. Please visit a vet immediately for emergencies.
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  );
}
