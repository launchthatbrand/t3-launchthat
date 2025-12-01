import "@testing-library/jest-dom";

import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { PaymentForm } from "launchthat-plugin-commerce/components";

// Define more specific types for mocks
interface MockClientResponse {
  messages: { resultCode: string /* other fields if needed */ };
  opaqueData: { dataDescriptor: string; dataValue: string };
}
interface MockAuthorizeNetProps {
  onSuccess: (response: MockClientResponse) => void;
  onError: (errors: string[]) => void;
  children?: React.ReactNode;
}

let mockOnSuccess: ((response: MockClientResponse) => void) | null = null;
let mockOnError: ((errors: string[]) => void) | null = null;

jest.mock("react-authorize-net", () => ({
  FormContainer: jest.fn((props: MockAuthorizeNetProps) => {
    mockOnSuccess = props.onSuccess;
    mockOnError = props.onError;
    return <div>Mock FormContainer {props.children}</div>;
  }),
  FormComponent: jest.fn(() => <div>Mock FormComponent</div>),
}));

global.fetch = jest.fn();

// Use unknown for jsonData or define a specific type if structure is known
const mockFetchResponse = (status: number, jsonData: unknown, ok = true) => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: ok,
    status: status,
    statusText: ok ? "OK" : "Error",
    json: jest.fn().mockResolvedValueOnce(jsonData),
  });
};

// Mock environment variable
const MOCK_CONVEX_URL = "https://mock-deployment.convex.site";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports, no-restricted-properties -- Mocking env for test
process.env.NEXT_PUBLIC_CONVEX_URL = MOCK_CONVEX_URL;

beforeEach(() => {
  mockOnSuccess = null;
  mockOnError = null;
  (fetch as jest.Mock).mockClear();
});

describe("PaymentForm", () => {
  const apiLoginId = "test-login-id";
  const clientKey = "test-client-key";

  it("renders the component and Authorize.Net mock", () => {
    render(<PaymentForm apiLoginId={apiLoginId} clientKey={clientKey} />);
    expect(screen.getByText(/Mock FormContainer/)).toBeInTheDocument();
    expect(screen.getByText(/Mock FormComponent/)).toBeInTheDocument();
  });

  it("handles successful payment flow", async () => {
    render(<PaymentForm apiLoginId={apiLoginId} clientKey={clientKey} />);
    if (!mockOnSuccess)
      throw new Error("onSuccess handler not captured by mock");

    const mockBackendSuccessResponse = {
      success: true,
      transactionId: "mock-tx-123",
    };
    mockFetchResponse(200, mockBackendSuccessResponse);

    const mockClientResponse: MockClientResponse = {
      messages: { resultCode: "Ok" },
      opaqueData: {
        dataDescriptor: "mock-descriptor",
        dataValue: "mock-value",
      },
    };

    // eslint-disable-next-line @typescript-eslint/require-await -- Act requires async for potential downstream effects
    await act(async () => {
      if (mockOnSuccess) mockOnSuccess(mockClientResponse);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_CONVEX_URL}/createAuthNetTransaction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            opaqueDataDescriptor: "mock-descriptor",
            opaqueDataValue: "mock-value",
          }),
        },
      );
    });
    expect(screen.getByText("Payment Received")).toBeInTheDocument();
    expect(screen.queryByText("Payment Failed")).not.toBeInTheDocument();
    expect(screen.queryByText(/Mock FormContainer/)).not.toBeInTheDocument();
  });

  it("handles backend error response", async () => {
    render(<PaymentForm apiLoginId={apiLoginId} clientKey={clientKey} />);
    if (!mockOnSuccess)
      throw new Error("onSuccess handler not captured by mock");

    const mockBackendErrorResponse = {
      success: false,
      error: "Backend simulation error",
    };
    mockFetchResponse(500, mockBackendErrorResponse, false);

    const mockClientResponse: MockClientResponse = {
      messages: { resultCode: "Ok" },
      opaqueData: { dataDescriptor: "desc", dataValue: "val" },
    };

    // eslint-disable-next-line @typescript-eslint/require-await -- Act requires async for potential downstream effects
    await act(async () => {
      if (mockOnSuccess) mockOnSuccess(mockClientResponse);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("Payment Failed")).toBeInTheDocument();
    expect(screen.getByText("Backend simulation error")).toBeInTheDocument();
    expect(screen.queryByText("Payment Received")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Try Again/i }),
    ).toBeInTheDocument();
  });

  it("handles Authorize.Net client-side error", () => {
    render(<PaymentForm apiLoginId={apiLoginId} clientKey={clientKey} />);
    if (!mockOnError) throw new Error("onError handler not captured by mock");

    const mockClientErrors = ["Invalid card number", "Expired date"];

    act(() => {
      if (mockOnError) mockOnError(mockClientErrors);
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Payment Failed")).toBeInTheDocument();
    expect(
      screen.getByText(/Invalid card number, Expired date/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Try Again/i }),
    ).toBeInTheDocument();
  });

  // Add more tests for edge cases, different payment methods (if implemented), etc.
});
