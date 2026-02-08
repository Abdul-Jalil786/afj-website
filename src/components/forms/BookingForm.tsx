"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const bookingSchema = z.object({
  // Step 1: Service Selection
  serviceType: z.string().min(1, "Please select a service"),
  // Step 2: Journey Details
  pickupAddress: z.string().min(5, "Please enter a valid pickup address"),
  dropoffAddress: z.string().min(5, "Please enter a valid drop-off address"),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  returnRequired: z.string(),
  returnDate: z.string().optional(),
  returnTime: z.string().optional(),
  // Step 3: Passenger Details
  passengers: z.string().min(1, "Please enter number of passengers"),
  wheelchairUsers: z.string().optional(),
  specialRequirements: z.string().optional(),
  // Step 4: Contact Details
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  additionalNotes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const services = [
  { value: "private-hire", label: "Private Hire" },
  { value: "airport-transfer", label: "Airport Transfer" },
  { value: "corporate", label: "Corporate Transport" },
  { value: "event", label: "Event Transport" },
  { value: "school", label: "School Transport Enquiry" },
  { value: "patient", label: "Patient Transport Enquiry" },
  { value: "other", label: "Other" },
];

const steps = [
  { number: 1, title: "Service", description: "Select your service" },
  { number: 2, title: "Journey", description: "Journey details" },
  { number: 3, title: "Passengers", description: "Passenger information" },
  { number: 4, title: "Contact", description: "Your details" },
];

export function BookingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      returnRequired: "no",
    },
  });

  const watchReturnRequired = watch("returnRequired");

  const validateStep = async (step: number): Promise<boolean> => {
    let fields: (keyof BookingFormData)[] = [];

    switch (step) {
      case 1:
        fields = ["serviceType"];
        break;
      case 2:
        fields = ["pickupAddress", "dropoffAddress", "date", "time"];
        break;
      case 3:
        fields = ["passengers"];
        break;
      case 4:
        fields = ["name", "email", "phone"];
        break;
    }

    const result = await trigger(fields);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to submit booking");

      setIsSuccess(true);
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12" role="status" aria-live="polite">
        <div className="w-20 h-20 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green" />
        </div>
        <h3 className="text-2xl font-bold text-navy mb-4">
          Booking Request Submitted!
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for your booking request. Our team will review your details
          and contact you within 2 hours during business hours to confirm
          availability and pricing.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step.number}
              className={cn(
                "flex flex-col items-center flex-1",
                step.number !== steps.length && "relative"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  currentStep >= step.number
                    ? "bg-green text-white"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {step.number}
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
              {step.number !== steps.length && (
                <div
                  className={cn(
                    "absolute top-5 left-[55%] w-[90%] h-0.5 -z-10",
                    currentStep > step.number ? "bg-green" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>
                Select Service Type <span className="text-destructive">*</span>
              </Label>
              <Select onValueChange={(value) => setValue("serviceType", value)}>
                <SelectTrigger
                  className={errors.serviceType ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceType && (
                <p className="text-sm text-destructive">
                  {errors.serviceType.message}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Journey Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>
                Pickup Address <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Enter full pickup address"
                {...register("pickupAddress")}
                className={errors.pickupAddress ? "border-destructive" : ""}
              />
              {errors.pickupAddress && (
                <p className="text-sm text-destructive">
                  {errors.pickupAddress.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Drop-off Address <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Enter full drop-off address"
                {...register("dropoffAddress")}
                className={errors.dropoffAddress ? "border-destructive" : ""}
              />
              {errors.dropoffAddress && (
                <p className="text-sm text-destructive">
                  {errors.dropoffAddress.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  {...register("date")}
                  className={errors.date ? "border-destructive" : ""}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="time"
                  {...register("time")}
                  className={errors.time ? "border-destructive" : ""}
                />
                {errors.time && (
                  <p className="text-sm text-destructive">{errors.time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Return Journey Required?</Label>
              <Select
                onValueChange={(value) => setValue("returnRequired", value)}
                defaultValue="no"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {watchReturnRequired === "yes" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <Input type="date" {...register("returnDate")} />
                </div>
                <div className="space-y-2">
                  <Label>Return Time</Label>
                  <Input type="time" {...register("returnTime")} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Passenger Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Number of Passengers <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  {...register("passengers")}
                  className={errors.passengers ? "border-destructive" : ""}
                />
                {errors.passengers && (
                  <p className="text-sm text-destructive">
                    {errors.passengers.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Wheelchair Users</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...register("wheelchairUsers")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Requirements</Label>
              <Textarea
                placeholder="Please list any special requirements (mobility aids, child seats, luggage, etc.)"
                rows={4}
                {...register("specialRequirements")}
              />
            </div>
          </div>
        )}

        {/* Step 4: Contact Details */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="John Smith"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  placeholder="0121 123 4567"
                  {...register("phone")}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                placeholder="Any other information we should know"
                rows={3}
                {...register("additionalNotes")}
              />
            </div>
          </div>
        )}

        <div role="alert" aria-live="polite">
          {error && (
            <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Booking Request"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
