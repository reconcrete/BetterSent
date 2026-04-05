import { useEffect, useState, type FC } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useSession, useAnalytics } from "~/shared/lib";
import { Logo } from "~/shared/ui";
import { ThemeToggle } from "~/features/toggleTheme";

import { useMarkOnboarded } from "../../hooks";
import { WelcomeStep } from "./WelcomeStep";
import { ApprovedSendersStep } from "./ApprovedSendersStep";
import { AddKindleEmailStep } from "./AddKindleEmailStep";

const TOTAL_STEPS = 3;

export const Onboarding: FC = () => {
  const { data: session, isPending: sessionPending } = useSession();
  const { capture } = useAnalytics();
  const navigate = useNavigate();
  const markOnboarded = useMarkOnboarded();
  const [step, setStepState] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem("bettersent_onboarding_step");
    return saved === "2" ? 2 : saved === "3" ? 3 : 1;
  });

  const setStep = (next: 1 | 2 | 3) => {
    localStorage.setItem("bettersent_onboarding_step", String(next));
    setStepState(next);
  };

  useEffect(() => {
    capture("onboarding_started");
  }, [capture]);

  const handleStepComplete = (completedStep: number) => {
    capture("onboarding_step_completed", { step: completedStep });
  };

  const handleNext = (fromStep: 1 | 2) => {
    handleStepComplete(fromStep);
    setStep((fromStep + 1) as 2 | 3);
  };

  const handleComplete = () => {
    handleStepComplete(3);
    markOnboarded.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("bettersent_onboarding_step");
        navigate("/", { replace: true });
      },
    });
  };

  if (sessionPending) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/sign-in" replace />;
  }

  const stepLabels = ["Step 1 of 3 \u00b7 Takes about 2 minutes", "Step 2 of 3", "Step 3 of 3 \u00b7 Almost there!"];

  return (
    <div className="relative min-h-dvh bg-background flex flex-col">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center pt-12 sm:pt-16 px-4 pb-8">
        <Logo className="text-[2rem] mb-8 sm:mb-10" />

        {/* Progress bar */}
        <div className="flex gap-2 w-[300px] max-w-full mb-8 sm:mb-10">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < step ? "bg-primary" : "bg-black/[0.06] dark:bg-white/[0.08]"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="w-full max-w-[494px]">
          <div className="bg-card border border-border rounded-[20px] p-6 sm:p-[30px]">
            {step === 1 && <WelcomeStep onNext={() => handleNext(1)} />}
            {step === 2 && <ApprovedSendersStep onNext={() => handleNext(2)} onBack={() => setStep(1)} />}
            {step === 3 && (
              <AddKindleEmailStep
                onComplete={handleComplete}
                onBack={() => setStep(2)}
                isPending={markOnboarded.isPending}
              />
            )}
          </div>

          {/* Step label */}
          <p className="text-[12px] text-muted-foreground text-center mt-4">{stepLabels[step - 1]}</p>
        </div>
      </div>
    </div>
  );
};
