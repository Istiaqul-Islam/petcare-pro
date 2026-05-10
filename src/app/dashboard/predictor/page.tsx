"use client";

export const runtime = "edge";
import React, { useState, useEffect } from "react";
import gsap from "gsap";
import {
  Stethoscope,
  Info,
  AlertTriangle,
  ClipboardList,
  Activity,
  ChevronRight,
  RefreshCw,
  Dog,
  HeartPulse,
  Thermometer,
  Calendar,
  Weight,
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
import { Separator } from "@/components/ui/separator";

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

const GENDERS = ["Male", "Female"];

const BINARY_SYMPTOMS = [
  { id: "diarrhea", label: "Diarrhea" },
  { id: "coughing", label: "Coughing" },
  { id: "labored_breathing", label: "Labored Breathing" },
  { id: "lameness", label: "Lameness (Difficulty Walking)" },
  { id: "skin_lesions", label: "Skin Lesions" },
  { id: "nasal_discharge", label: "Nasal Discharge" },
  { id: "eye_discharge", label: "Eye Discharge" },
];

const CLINICAL_SYMPTOMS = [
  "Appetite Loss", "Coughing", "Decreased Milk Yield", "Dehydration", 
  "Diarrhea", "Eye Discharge", "Fever", "Labored Breathing", 
  "Lameness", "Lethargy", "Loss of Appetite", "Nasal Discharge", 
  "No", "Reduced Appetite", "Reduced Milk Production", "Reduced Mobility", 
  "Reduced Wool Growth", "Reduced Wool Production", "Skin Lesions", 
  "Sneezing", "Swelling", "Swollen Joints", "Swollen Legs", 
  "Vomiting", "Weight Loss"
];

export default function PredictorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    animalType: "",
    breed: "",
    age: "",
    gender: "Male",
    weight: "",
    duration: "",
    temp: "38.5",
    heartRate: "80",
    symptom1: "No",
    symptom2: "No",
    symptom3: "No",
    symptom4: "No",
    binarySymptoms: {
      diarrhea: false,
      coughing: false,
      labored_breathing: false,
      lameness: false,
      skin_lesions: false,
      nasal_discharge: false,
      eye_discharge: false,
    },
  });

  const handleToggleBinary = (id: keyof typeof formData.binarySymptoms) => {
    setFormData((prev) => ({
      ...prev,
      binarySymptoms: {
        ...prev.binarySymptoms,
        [id]: !prev.binarySymptoms[id],
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
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [result]);

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            AI Disease Predictor
          </h1>
          <p className="text-muted-foreground mt-1">
            Neural Diagnostic Engine powered by Scikit-Learn
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setFormData({
              animalType: "",
              breed: "",
              age: "",
              gender: "Male",
              weight: "",
              duration: "",
              temp: "38.5",
              heartRate: "80",
              symptom1: "No",
              symptom2: "No",
              symptom3: "No",
              symptom4: "No",
              binarySymptoms: {
                diarrhea: false,
                coughing: false,
                labored_breathing: false,
                lameness: false,
                skin_lesions: false,
                nasal_discharge: false,
                eye_discharge: false,
              },
            });
            setResult(null);
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Reset Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form */}
        <Card className="lg:col-span-7 shadow-xl border-primary/10 overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Comprehensive Assessment
            </CardTitle>
            <CardDescription>
              Fill all fields for 99%+ diagnostic precision.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Patient Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <Dog className="h-4 w-4" />
                  Patient Info
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Species*</Label>
                    <Select
                      value={formData.animalType}
                      onValueChange={(val) => setFormData((p) => ({ ...p, animalType: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Species" />
                      </SelectTrigger>
                      <SelectContent>
                        {ANIMAL_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Breed</Label>
                    <Input
                      placeholder="e.g. Bulldog"
                      value={formData.breed}
                      onChange={(e) => setFormData((p) => ({ ...p, breed: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(val) => setFormData((p) => ({ ...p, gender: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Age (Years)</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      step="0.1"
                      value={formData.age}
                      onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 2: Vitals */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <HeartPulse className="h-4 w-4" />
                  Clinical Vitals
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Weight className="h-3 w-3" /> Weight (kg)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData((p) => ({ ...p, weight: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3" /> Temp (°C)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.temp}
                      onChange={(e) => setFormData((p) => ({ ...p, temp: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <HeartPulse className="h-3 w-3" /> Heart Rate
                    </Label>
                    <Input
                      type="number"
                      value={formData.heartRate}
                      onChange={(e) => setFormData((p) => ({ ...p, heartRate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 3: History & Symptoms */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <Calendar className="h-4 w-4" />
                  Symptoms & Duration
                </div>
                
                <div className="space-y-2">
                  <Label>Duration of Illness (e.g. "3 days")</Label>
                  <Input
                    placeholder="e.g. 5 days"
                    value={formData.duration}
                    onChange={(e) => setFormData((p) => ({ ...p, duration: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <Label>Primary Symptom {i}</Label>
                      <Select
                        value={(formData as any)[`symptom${i}`]}
                        onValueChange={(val) => setFormData((p) => ({ ...p, [`symptom${i}`]: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Symptom" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLINICAL_SYMPTOMS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Additional Clinical Indicators</Label>
                  <div className="grid grid-cols-2 gap-3 border rounded-xl p-4 bg-muted/20">
                    {BINARY_SYMPTOMS.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-background border shadow-sm">
                        <Label htmlFor={s.id} className="text-[11px] font-medium leading-none cursor-pointer">
                          {s.label}
                        </Label>
                        <Switch
                          id={s.id}
                          checked={(formData.binarySymptoms as any)[s.id]}
                          onCheckedChange={() => handleToggleBinary(s.id as any)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-lg h-14 shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all"
                disabled={loading || !formData.animalType}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Neural Analysis in Progress...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-5 w-5" />
                    Generate Diagnostic Report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results / Info Column */}
        <div className="lg:col-span-5 space-y-6">
          {!result && !loading && (
            <Card className="border-dashed border-2 bg-muted/10">
              <CardContent className="py-20 text-center space-y-4">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="h-10 w-10 text-primary/40" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Awaiting Data</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                    Enter the clinical metrics to activate the ML diagnostic engine.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="overflow-hidden">
              <div className="h-1 w-full bg-primary/20">
                <div className="h-full bg-primary animate-progress-loop w-1/3"></div>
              </div>
              <CardContent className="py-24 text-center">
                <Activity className="h-12 w-12 text-primary mx-auto animate-pulse mb-6" />
                <p className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Synthesizing Patterns...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Running inference through 200+ decision nodes.
                </p>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="result-card border-none shadow-2xl overflow-hidden rounded-2xl">
              <div className="bg-primary h-2" />
              <CardHeader className="bg-primary/5 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px]">
                    ML Engine Output
                  </Badge>
                  <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date().toLocaleDateString()}
                  </span >
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">Diagnostic Analysis</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 bg-gradient-to-b from-primary/5 to-background">
                <div className="bg-background border rounded-2xl p-6 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity className="h-24 w-24 text-primary" />
                  </div>
                  <p className="text-[10px] font-bold uppercase text-primary/60 tracking-widest">
                    Suspected Condition
                  </p>
                  <h3 className="text-3xl font-black text-primary mt-2 leading-none">
                    {result.prediction}
                  </h3>
                  <div className="mt-8 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted-foreground uppercase">Confidence Level</span>
                      <span className="text-primary">{result.confidence}%</span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden border">
                      <div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-1000"
                        style={{ width: `${result.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                    <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-orange-600 uppercase tracking-wide">Analysis</p>
                      <p className="text-sm text-foreground/80 leading-relaxed italic">
                        "{result.analysis}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                    <ChevronRight className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-green-600 uppercase tracking-wide">Clinical Directions</p>
                      <ul className="text-sm text-foreground/80 space-y-2">
                        {result.recommendations?.map((rec: string, i: number) => (
                          <li key={i} className="flex gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground border-t pt-4 text-center leading-relaxed">
                  ⚠️ **DISCLAIMER**: This assessment is generated by an experimental ML model 
                  for research purposes. It is NOT a substitute for professional veterinary diagnosis.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
