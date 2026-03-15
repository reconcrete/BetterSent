import type { FC } from "react";
import { Button } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";

type WelcomeStepProps = {
  onNext: () => void;
};

export const WelcomeStep: FC<WelcomeStepProps> = ({ onNext }) => {
  const { capture } = useAnalytics();

  const handleClick = () => {
    capture("onboarding_step_completed", { step: 1 });
    onNext();
  };

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-black">Welcome to Bettersent</h2>
        <p className="text-neutral-500">
          Bettersent lets you send articles, documents, and text straight to your Kindle device via email.
          We just need a couple of things set up first.
        </p>
      </div>
      <Button
        onClick={handleClick}
        className="w-full bg-black text-white hover:bg-neutral-800"
      >
        Get Started
      </Button>
    </div>
  );
};
