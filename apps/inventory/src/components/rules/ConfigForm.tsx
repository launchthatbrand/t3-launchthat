import { useState } from "react";
import Form from "@rjsf/core";
import { IChangeEvent, RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { JSONSchema7 } from "json-schema";

interface ConfigFormProps {
  schema: JSONSchema7;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  title?: string;
  description?: string;
  showSubmitButton?: boolean;
}

export function ConfigForm({
  schema,
  value,
  onChange,
  title,
  description,
  showSubmitButton = false,
}: ConfigFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(value);

  const handleChange = (
    e: IChangeEvent<Record<string, unknown>, RJSFSchema>,
  ) => {
    if (e.formData) {
      setFormData(e.formData);
      onChange(e.formData);
    }
  };

  const uiSchema = {
    "ui:submitButtonOptions": {
      norender: !showSubmitButton,
    },
  };

  return (
    <div className="config-form">
      {title && <h3 className="mb-2 text-lg font-medium">{title}</h3>}
      {description && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}

      <Form
        schema={schema}
        formData={formData}
        validator={validator}
        onChange={handleChange}
        uiSchema={uiSchema}
        liveValidate
        disabled={false}
        showErrorList={false}
      />
    </div>
  );
}
