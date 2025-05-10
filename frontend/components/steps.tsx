"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { type PropsWithChildren } from "react";

interface StepProps {
  title: string;
  description?: string;
  active?: boolean;
  completed?: boolean;
  index: number;
}

export function Step({
  title,
  description,
  active = false,
  completed = false,
  index,
}: StepProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full">
          {completed ? (
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          ) : (
            <Circle
              className={`h-8 w-8 ${
                active ? "text-orange-500" : "text-gray-400"
              }`}
            />
          )}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-medium ${
              active
                ? "text-orange-500"
                : completed
                ? "text-white"
                : "text-gray-500"
            }`}
          >
            {completed ? "" : index + 1}
          </div>
        </div>
        {/* Line connector */}
      </div>
      <div className="flex flex-col">
        <h3
          className={`font-medium ${
            active || completed ? "text-black" : "text-gray-500"
          }`}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`text-sm ${
              active || completed ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

interface StepsProps {
  currentStep: number;
  steps: {
    title: string;
    description?: string;
  }[];
}

export function Steps({ currentStep, steps }: StepsProps) {
  return (
    <div className="flex flex-col gap-8">
      {steps.map((step, index) => (
        <Step
          key={index}
          title={step.title}
          description={step.description}
          active={currentStep === index}
          completed={currentStep > index}
          index={index}
        />
      ))}
    </div>
  );
}

export function StepContent({
  step,
  currentStep,
  children,
}: PropsWithChildren<{ step: number; currentStep: number }>) {
  if (step !== currentStep) return null;
  return <div className="mt-4">{children}</div>;
}
