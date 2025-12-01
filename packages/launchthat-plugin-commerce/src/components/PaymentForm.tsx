"use client";

// Remove commented-out Convex imports
// import { api } from "convex/_generated/api";
// import { useMutation } from "convex/react";
// Import the necessary components from react-authorize-net
import React, { useState } from "react";
import { FormComponent, FormContainer } from "react-authorize-net";

// Assuming a Button component exists in the shared UI package or define one locally
// import { Button } from '@acme/ui/button'; // Example import

/**
 * Props for the PaymentForm component.
 */
interface PaymentFormProps {
  /** Authorize.Net API Login ID. */
  apiLoginId: string;
  /** Authorize.Net Public Client Key. */
  clientKey: string;
}

/**
 * Structure of the response received from the Authorize.Net Accept.js client library
 * after successful tokenization.
 */
interface AuthorizeNetClientResponse {
  messages: { resultCode: string /* ... */ };
  opaqueData: { dataDescriptor: string; dataValue: string };
}

/**
 * Structure of the successful response expected from the backend
 * /createAuthNetTransaction endpoint.
 */
interface BackendSuccessResponse {
  success: true;
  transactionId: string | null;
}

/**
 * Structure of the error response expected from the backend
 * /createAuthNetTransaction endpoint.
 */
interface BackendErrorResponse {
  success: false;
  error: string;
}

/** Represents the possible response structures from the backend endpoint. */
type BackendResponse = BackendSuccessResponse | BackendErrorResponse;

/**
 * Renders a payment form using Authorize.Net Accept.js for tokenization
 * and interacts with the Convex backend HTTP endpoint to process the transaction.
 *
 * @param {PaymentFormProps} props - Component props.
 * @returns {React.ReactElement} The rendered payment form component.
 */
const PaymentForm: React.FC<PaymentFormProps> = ({ apiLoginId, clientKey }) => {
  /** State for tracking loading during backend communication. */
  const [loading, setLoading] = useState<boolean>(false);
  /** State for storing error messages (client-side or backend). */
  const [error, setError] = useState<string | null>(null);
  /** State for tracking successful backend transaction processing. */
  const [success, setSuccess] = useState<boolean>(false);
  /** State for the currently selected payment method (UI only). */
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card");

  // Remove commented-out useMutation hook
  // const createTransaction = useMutation< ... >(...);

  /**
   * Handles the successful tokenization response from the Authorize.Net client library.
   * Sends the opaque data to the backend Convex HTTP endpoint for processing.
   *
   * @param {AuthorizeNetClientResponse} response - The success response from Accept.js.
   */
  const onSuccessHandler = async (response: AuthorizeNetClientResponse) => {
    setError(null);
    setLoading(true);

    // --- Placeholder Data (Replace with actual data from your app) ---
    // TODO: Replace with actual transaction amount in cents (e.g., from cart total)
    const placeholderAmount = 100; // Example: $1.00 in cents
    // TODO: Replace with actual line items from the cart/order
    const placeholderLineItems = [
      {
        productId: "placeholder_prod_1",
        productName: "Placeholder Item",
        quantity: 1,
        unitPrice: placeholderAmount,
        totalPrice: placeholderAmount,
      },
    ];
    // --- End Placeholder Data ---

    try {
      const convexHttpUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
      const endpointUrl = `${convexHttpUrl}/createAuthNetTransaction`;

      // Construct the correct payload structure
      const payload = {
        opaqueData: {
          dataDescriptor: response.opaqueData.dataDescriptor,
          dataValue: response.opaqueData.dataValue,
        },
        amount: placeholderAmount, // Use placeholder (replace later)
        paymentMethod: paymentMethod, // Use selected payment method from state
        lineItems: placeholderLineItems, // Use placeholder (replace later)
      };

      const backendResponse = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // Send the correctly structured payload
      });

      const resultJson = (await backendResponse.json()) as BackendResponse;

      if (backendResponse.ok && resultJson.success === true) {
        setSuccess(true);
      } else {
        let errorMessage = `Backend Error: ${backendResponse.statusText}`;
        if (resultJson.success === false && resultJson.error) {
          errorMessage = resultJson.error;
        } else if (!backendResponse.ok) {
          errorMessage = `Backend returned status ${backendResponse.status}: ${backendResponse.statusText}`;
        } else {
          errorMessage =
            "Backend processing failed or returned unexpected data.";
        }
        setError(errorMessage);
        setSuccess(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown network error occurred.",
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles errors reported by the Authorize.Net client library
   * (e.g., invalid card details during tokenization).
   *
   * @param {string[]} errors - An array of error messages from Accept.js.
   */
  const onErrorHandler = (errors: string[]) => {
    setLoading(false);
    setSuccess(false);
    let errorMessage = "An unknown client-side payment error occurred.";
    if (Array.isArray(errors) && errors.length > 0) {
      errorMessage = errors.join(", ");
    }
    setError(errorMessage);
  };

  /**
   * Resets the form's success/error/loading state to allow the user to try again.
   */
  const handleRetry = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  // Add a wrapper for potential loading state and the form itself
  return (
    <div className="space-y-6">
      {/* Payment Method Selection (Placeholder structure) */}
      {/* Replace with actual RadioGroup component from @acme/ui if available */}
      <div className="space-y-3">
        {/* Credit Card Option */}
        <div
          className={`rounded-md border p-4 ${paymentMethod === "credit-card" ? "border-primary ring-primary ring-1" : "border-input"}`}
        >
          <label
            htmlFor="credit-card"
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="credit-card"
                name="paymentMethod"
                value="credit-card"
                checked={paymentMethod === "credit-card"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-radio text-primary focus:ring-primary h-4 w-4"
              />
              {/* <CreditCard className="h-5 w-5" /> Optional Icon */}
              <span className="font-medium">Credit Card</span>
            </div>
            {/* Placeholder Card Icons */}
            <div className="flex space-x-1">
              <img
                src="https://placehold.co/30x20/ EBF0F5/666?text=VISA"
                alt="Visa"
                className="h-5"
              />
              <img
                src="https://placehold.co/30x20/ EBF0F5/666?text=MC"
                alt="Mastercard"
                className="h-5"
              />
              <img
                src="https://placehold.co/30x20/ EBF0F5/666?text=AMEX"
                alt="Amex"
                className="h-5"
              />
              <img
                src="https://placehold.co/30x20/ EBF0F5/666?text=DISC"
                alt="Discover"
                className="h-5"
              />
            </div>
          </label>
          {/* Authorize.Net Form - Conditionally shown */}
          {paymentMethod === "credit-card" && (
            <div className="mt-4 space-y-4 border-t pt-4">
              <p className="text-muted-foreground text-sm">
                Pay securely using your credit card.
              </p>
              {/* Show loading indicator when either client-side or backend is loading */}
              {loading && (
                <div className="text-muted-foreground flex items-center justify-center space-x-2">
                  <div className="border-primary h-5 w-5 animate-spin rounded-full border-b-2"></div>
                  {/* Update loading text slightly */}
                  <span>Processing payment...</span>
                </div>
              )}
              {/* Determine if the form should be hidden (based on loading OR final success/error) */}
              {(() => {
                const hideForm = loading || success || error;
                return (
                  <div className={hideForm ? "hidden" : ""}>
                    <FormContainer
                      environment="sandbox"
                      // Cast onError handler and disable warning
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onError={onErrorHandler as (errors: any) => void}
                      onSuccess={onSuccessHandler}
                      amount={0.01}
                      // Cast component and disable warning
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
                      component={FormComponent as any}
                      clientKey={clientKey}
                      apiLoginId={apiLoginId}
                    />
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Sezzle Option (Placeholder) */}
        <div
          className={`rounded-md border p-4 ${paymentMethod === "sezzle" ? "border-primary ring-primary ring-1" : "border-input"}`}
        >
          <label
            htmlFor="sezzle"
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="sezzle"
                name="paymentMethod"
                value="sezzle"
                checked={paymentMethod === "sezzle"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-radio text-primary focus:ring-primary h-4 w-4"
              />
              <span className="font-medium">Sezzle</span>
            </div>
            <img
              src="https://placehold.co/60x20/EBF0F5/666?text=Sezzle"
              alt="Sezzle"
              className="h-5"
            />
          </label>
          {paymentMethod === "sezzle" && (
            <p className="text-muted-foreground mt-2 text-sm">
              Redirects to Sezzle for payment.
            </p>
          )}
        </div>

        {/* Bitcoin/Crypto Option (Placeholder) */}
        <div
          className={`rounded-md border p-4 ${paymentMethod === "crypto" ? "border-primary ring-primary ring-1" : "border-input"}`}
        >
          <label
            htmlFor="crypto"
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="crypto"
                name="paymentMethod"
                value="crypto"
                checked={paymentMethod === "crypto"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-radio text-primary focus:ring-primary h-4 w-4"
              />
              {/* <Bitcoin className="h-5 w-5" /> Optional Icon */}
              <span className="font-medium">
                Bitcoin and other cryptocurrencies
              </span>
            </div>
            {/* Placeholder Crypto Icons */}
            <div className="flex space-x-1">
              <img
                src="https://placehold.co/20x20/EBF0F5/666?text=E"
                alt="ETH"
                className="h-5 rounded-full"
              />
              <img
                src="https://placehold.co/20x20/EBF0F5/666?text=B"
                alt="BTC"
                className="h-5 rounded-full"
              />
              <img
                src="https://placehold.co/20x20/EBF0F5/666?text=L"
                alt="LTC"
                className="h-5 rounded-full"
              />
            </div>
          </label>
          {paymentMethod === "crypto" && (
            <p className="text-muted-foreground mt-2 text-sm">
              Proceed with crypto payment provider.
            </p>
          )}
        </div>
      </div>

      {/* Securely Save Account Checkbox (Placeholder) */}
      {paymentMethod === "credit-card" && !loading && !success && !error && (
        <div className="flex items-center space-x-2">
          {/* Replace with actual Checkbox component */}
          <input
            type="checkbox"
            id="save-account"
            className="form-checkbox text-primary focus:ring-primary h-4 w-4 rounded"
          />
          <label
            htmlFor="save-account"
            className="text-muted-foreground text-sm font-medium"
          >
            Securely Save to Account
          </label>
        </div>
      )}

      {/* Feedback Messages (now reflect backend status) */}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-center">
          <h2 className="text-lg font-semibold text-green-700">
            Payment Received
          </h2>
          <p className="text-sm text-green-600">
            Thank you! Your transaction was successful.
          </p>
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-center">
          <h2 className="text-lg font-semibold text-red-700">Payment Failed</h2>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={handleRetry}
            disabled={loading} // Disable retry while loading
            className="mt-3 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Placeholder for the main submit button if not handled by FormContainer */}
      {/* <button className="w-full rounded-md bg-green-600 py-3 text-white font-semibold hover:bg-green-700">PLACE ORDER NOW</button> */}
    </div>
  );
};

export default PaymentForm;
