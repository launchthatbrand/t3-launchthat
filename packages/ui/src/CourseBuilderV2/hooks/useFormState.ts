import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";

/**
 * Represents the validation errors for a form.
 * Keys correspond to form value keys.
 * Value is an error message string or undefined if valid.
 */
type FormErrors<TValues> = Partial<Record<keyof TValues, string>>;

/**
 * Validation function signature.
 * Takes the current form values and should return an object of errors.
 */
type ValidateFn<TValues> = (values: TValues) => FormErrors<TValues>;

/**
 * Props for the useFormState hook.
 */
interface UseFormStateProps<TValues> {
  initialValues: TValues;
  validate?: ValidateFn<TValues>;
  onSubmit: (values: TValues) => Promise<void> | void;
}

/**
 * Return value of the useFormState hook.
 */
interface UseFormStateReturn<TValues> {
  values: TValues;
  errors: FormErrors<TValues>;
  isSubmitting: boolean;
  handleChange: (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handleSubmit: (event?: React.FormEvent<HTMLFormElement>) => Promise<void>;
  resetForm: () => void;
  setValues: React.Dispatch<React.SetStateAction<TValues>>;
  setErrors: React.Dispatch<React.SetStateAction<FormErrors<TValues>>>;
}

/**
 * Custom hook for managing form state, including values, validation, and submission.
 *
 * @template TValues - The shape of the form's values.
 * @param {UseFormStateProps<TValues>} props - Hook configuration.
 * @param {TValues} props.initialValues - The initial values for the form fields.
 * @param {ValidateFn<TValues>} [props.validate] - Optional function to validate form values. Should return an error object.
 * @param {(values: TValues) => Promise<void> | void} props.onSubmit - Callback function executed when the form is submitted successfully after validation.
 * @returns {UseFormStateReturn<TValues>} An object containing form state and handler functions.
 */
export const useFormState = <TValues extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormStateProps<TValues>): UseFormStateReturn<TValues> => {
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<TValues>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Handles changes in form input elements.
   * Updates the corresponding field in the form values state.
   * Supports standard input types, textareas, and selects.
   */
  const handleChange = useCallback(
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = event.target;

      // Determine the correct type for the value based on the input type
      let processedValue: string | boolean | number = value;

      // Handle checkboxes
      if (type === "checkbox" && event.target instanceof HTMLInputElement) {
        processedValue = event.target.checked;
      }
      // Handle numeric inputs if needed (can be extended for number/range)
      // else if (type === 'number' && event.target instanceof HTMLInputElement) {
      //     processedValue = value === '' ? '' : parseFloat(value); // Keep empty string or parse number
      // }

      setValues((prevValues) => ({
        ...prevValues,
        // Assert the type directly here
        [name]: processedValue as TValues[typeof name],
      }));

      // Optionally clear the error for the field being changed
      if (errors[name]) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: undefined,
        }));
      }
    },
    [errors],
  ); // Include errors in dependency array if clearing errors on change

  /**
   * Handles form submission.
   * Prevents default form submission, runs validation (if provided),
   * updates errors state, and calls the onSubmit callback if valid.
   */
  const handleSubmit = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault(); // Prevent default form submission
      }

      setIsSubmitting(true);
      setErrors({}); // Clear previous errors

      let validationErrors: FormErrors<TValues> = {};
      if (validate) {
        validationErrors = validate(values);
        setErrors(validationErrors);
      }

      // Check if there are any validation errors
      // Use Object.values to ensure all error messages are undefined or empty
      const isValid = Object.values(validationErrors).every((err) => !err);

      if (isValid) {
        try {
          await onSubmit(values);
          // Optionally reset form on successful submit, or handle externally
          // resetForm();
        } catch (submitError) {
          // Handle submission errors (e.g., display a general error message)
          console.error("Form submission error:", submitError);
          // Example: setErrors({ _submit: 'Submission failed. Please try again.' });
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setIsSubmitting(false); // Stop submitting if validation fails
      }
    },
    [validate, values, onSubmit],
  );

  /**
   * Resets the form state to its initial values and clears errors.
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    resetForm,
    setValues, // Expose setValues for more complex scenarios if needed
    setErrors, // Expose setErrors for manual error setting if needed
  };
};
