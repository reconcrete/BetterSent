import { useEffect, useState, type FC } from "react";
import { Dialog, DialogContent, DialogTitle } from "~/shared/ui";
import type { OnboardingModalProps } from "~/entities/modals/types";
import { useAnalytics } from "~/shared/lib";
import { useMarkOnboarded } from "../../api/useMarkOnboarded";
import { WelcomeStep } from "./WelcomeStep";
import { ApprovedSendersStep } from "./ApprovedSendersStep";
import { AddKindleEmailStep } from "./AddKindleEmailStep";

export const OnboardingModal: FC<OnboardingModalProps> = ({ closeModal }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { capture } = useAnalytics();
  const markOnboarded = useMarkOnboarded();

  useEffect(() => {
    capture("onboarding_started");
  }, [capture]);

  const handleComplete = () => {
    markOnboarded.mutate(undefined, {
      onSuccess: () => closeModal(),
    });
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md max-h-[85vh] overflow-y-auto p-6"
      >
        <DialogTitle className="sr-only">Onboarding</DialogTitle>

          <div className="mb-6">
            <p className="text-sm text-muted-foreground text-center">
              Step {step} of 3
            </p>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}
          {step === 2 && <ApprovedSendersStep onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <AddKindleEmailStep onComplete={handleComplete} onBack={() => setStep(2)} />}
      </DialogContent>
    </Dialog>
  );
};
