"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

import type { MappingValidationTooltipProps, ValidationResult } from "./types";

/**
 * A tooltip component to display validation results with appropriate icons
 */
const MappingValidationTooltip: React.FC<MappingValidationTooltipProps> = ({
  validationResults,
  children,
}) => {
  // Count errors and warnings
  const errorCount = validationResults.filter(
    (result) => !result.isValid && result.severity === "error",
  ).length;

  const warningCount = validationResults.filter(
    (result) => !result.isValid && result.severity === "warning",
  ).length;

  // Determine status color
  const getStatusColor = () => {
    if (errorCount > 0) return "text-red-500";
    if (warningCount > 0) return "text-amber-500";
    return "text-green-500";
  };

  // Get appropriate icon based on validation status
  const getStatusIcon = () => {
    if (errorCount > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (warningCount > 0) {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  // If no validation results, return children
  if (!validationResults.length) {
    return <>{children}</>;
  }

  // Helper function to render a single validation result
  const renderValidationResult = (result: ValidationResult, index: number) => {
    const iconColor =
      result.severity === "error"
        ? "text-red-500"
        : result.severity === "warning"
          ? "text-amber-500"
          : "text-blue-500";

    const icon =
      result.severity === "error" || result.severity === "warning" ? (
        <AlertCircle className={`mr-2 inline h-3 w-3 ${iconColor}`} />
      ) : (
        <Info className="mr-2 inline h-3 w-3 text-blue-500" />
      );

    return (
      <div key={index} className="mb-1 flex items-start text-sm">
        <span className="mr-1 mt-0.5">{icon}</span>
        <span>{result.message}</span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {children}
            <div className="absolute -right-1 -top-1 flex items-center">
              {getStatusIcon()}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3" sideOffset={5}>
          <div className="space-y-2">
            <div className={`font-medium ${getStatusColor()}`}>
              {errorCount > 0
                ? `${errorCount} Error${errorCount > 1 ? "s" : ""}`
                : warningCount > 0
                  ? `${warningCount} Warning${warningCount > 1 ? "s" : ""}`
                  : "Validation Passed"}
            </div>
            <div className="space-y-1">
              {validationResults.map(renderValidationResult)}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MappingValidationTooltip;
