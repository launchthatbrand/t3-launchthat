declare module "@docuseal/signature-maker-react" {
  import type { ComponentType } from "react";

  export type SignatureMakerChangeEvent = {
    base64: string | null;
  };

  export type SignatureMakerProps = {
    withUpload?: boolean;
    withSubmit?: boolean;
    downloadOnSave?: boolean;
    onChange?: (event: SignatureMakerChangeEvent) => void;
  };

  export const SignatureMaker: ComponentType<SignatureMakerProps>;
}
