import { useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
import { Id } from "src/lib/types";

import { toast } from "@acme/ui/toast";

interface EvidenceFile {
  file: File;
  description: string;
  category:
    | "communication"
    | "transaction"
    | "shipping"
    | "documentation"
    | "audit_log";
}

export function useChargebackEvidence(chargebackId: Id<"chargebacks">) {
  const [isUploading, setIsUploading] = useState(false);

  const createEvidence = useMutation(
    api.ecommerce.chargebacks.evidence.createEvidence,
  );
  const generateUploadUrl = useMutation(
    api.ecommerce.chargebacks.evidence.generateUploadUrl,
  );

  const attachPDFEvidence = async (
    pdfBlob: Blob,
    filename: string,
    description: string = "User audit log evidence",
  ) => {
    setIsUploading(true);

    try {
      // Convert blob to File for upload
      const pdfFile = new File([pdfBlob], filename, {
        type: "application/pdf",
      });

      // Store the file using evidence API
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: pdfFile,
      });

      if (!response.ok) {
        throw new Error("Failed to upload PDF");
      }

      const { storageId } = await response.json();

      // Add evidence record to chargeback
      await createEvidence({
        chargebackId,
        documentType: "other", // audit_log not in union, using "other"
        title: filename,
        description,
        fileStorageId: storageId,
        importance: "high",
        tags: ["audit_log", "user_activity"],
      });

      toast.success("PDF evidence attached to chargeback successfully!");
    } catch (error) {
      console.error("Error attaching PDF evidence:", error);
      toast.error("Failed to attach PDF evidence. Please try again.");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    attachPDFEvidence,
    isUploading,
  };
}
