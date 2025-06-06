import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * This component serves as a wireframe for the mapping configuration interface.
 * It illustrates the structure and interaction patterns for the drag-and-drop
 * field mapping functionality that will be implemented with @dnd-kit.
 */
const MappingConfigurationWireframe: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Panel - Source Fields */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Source Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
              <h3 className="mb-2 text-sm font-medium">Object Fields</h3>
              <div className="space-y-2">
                <div className="cursor-move rounded border border-gray-200 bg-white p-2 shadow-sm hover:bg-blue-50">
                  field1 (string)
                </div>
                <div className="cursor-move rounded border border-gray-200 bg-white p-2 shadow-sm hover:bg-blue-50">
                  field2 (number)
                </div>
                <div className="cursor-move rounded border border-gray-200 bg-white p-2 shadow-sm hover:bg-blue-50">
                  field3 (boolean)
                </div>
                <div className="cursor-move rounded border border-gray-200 bg-white p-2 shadow-sm hover:bg-blue-50">
                  field4 (date)
                </div>
              </div>
            </div>

            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
              <h3 className="mb-2 text-sm font-medium">Array Fields</h3>
              <div className="space-y-2">
                <div className="cursor-move rounded border border-gray-200 bg-white p-2 shadow-sm hover:bg-blue-50">
                  items (array)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle Panel - Transformations */}
      <Card className="lg:col-span-6">
        <CardHeader>
          <CardTitle>Field Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* A mapping line */}
            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center">
                <div className="w-1/3 rounded border border-blue-200 bg-blue-50 p-2">
                  field1 (string)
                </div>
                <div className="w-1/3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500">
                      Transform with
                    </span>
                    <span className="font-medium">toUpperCase</span>
                    <span className="text-xs text-gray-500">
                      String Category
                    </span>
                  </div>
                </div>
                <div className="w-1/3 rounded border border-green-200 bg-green-50 p-2">
                  TARGET_FIELD1 (string)
                </div>
              </div>
              <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2">
                <h4 className="mb-1 text-xs font-medium">Parameters</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-xs">No parameters required</div>
                </div>
              </div>
            </div>

            {/* Another mapping line */}
            <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center">
                <div className="w-1/3 rounded border border-blue-200 bg-blue-50 p-2">
                  field2 (number)
                </div>
                <div className="w-1/3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500">
                      Transform with
                    </span>
                    <span className="font-medium">formatNumber</span>
                    <span className="text-xs text-gray-500">
                      Number Category
                    </span>
                  </div>
                </div>
                <div className="w-1/3 rounded border border-green-200 bg-green-50 p-2">
                  TARGET_FIELD2 (string)
                </div>
              </div>
              <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2">
                <h4 className="mb-1 text-xs font-medium">Parameters</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-xs">format: "$0,0.00"</div>
                </div>
              </div>
            </div>

            {/* Drop zone for new mappings */}
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
              <p className="text-gray-500">
                Drop source fields here to create new mappings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Target Fields */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Target Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
              <h3 className="mb-2 text-sm font-medium">Required Fields</h3>
              <div className="space-y-2">
                <div className="rounded border border-gray-200 bg-white p-2 shadow-sm hover:bg-green-50">
                  TARGET_FIELD1 (string)
                </div>
                <div className="rounded border border-gray-200 bg-white p-2 shadow-sm hover:bg-green-50">
                  TARGET_FIELD2 (string)
                </div>
              </div>
            </div>

            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
              <h3 className="mb-2 text-sm font-medium">Optional Fields</h3>
              <div className="space-y-2">
                <div className="rounded border border-gray-200 bg-white p-2 shadow-sm hover:bg-green-50">
                  TARGET_FIELD3 (boolean)
                </div>
                <div className="rounded border border-gray-200 bg-white p-2 shadow-sm hover:bg-green-50">
                  TARGET_FIELD4 (array)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Panel - Preview and Controls */}
      <Card className="lg:col-span-12">
        <CardHeader>
          <CardTitle>Transformation Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="mb-2 text-sm font-medium">
                Source Data (Example)
              </h3>
              <pre className="max-h-40 overflow-auto rounded-md bg-gray-100 p-4 text-xs">
                {JSON.stringify(
                  {
                    field1: "example string",
                    field2: 12345.67,
                    field3: true,
                    field4: "2023-04-15T00:00:00Z",
                    items: ["item1", "item2", "item3"],
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Transformed Result</h3>
              <pre className="max-h-40 overflow-auto rounded-md bg-gray-100 p-4 text-xs">
                {JSON.stringify(
                  {
                    TARGET_FIELD1: "EXAMPLE STRING",
                    TARGET_FIELD2: "$12,345.67",
                    TARGET_FIELD3: null,
                    TARGET_FIELD4: [],
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Function Selector Panel */}
      <Card className="lg:col-span-12">
        <CardHeader>
          <CardTitle>Transformation Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {/* Function Category Tabs */}
            <div className="col-span-2 flex flex-col gap-2 lg:col-span-1">
              <Button variant="outline" className="justify-start bg-blue-50">
                String
              </Button>
              <Button variant="outline" className="justify-start">
                Number
              </Button>
              <Button variant="outline" className="justify-start">
                Date
              </Button>
              <Button variant="outline" className="justify-start">
                Logic
              </Button>
              <Button variant="outline" className="justify-start">
                Array
              </Button>
              <Button variant="outline" className="justify-start">
                Object
              </Button>
              <Button variant="outline" className="justify-start">
                Custom
              </Button>
            </div>

            {/* Functions Grid */}
            <div className="col-span-2 grid grid-cols-1 gap-3 md:grid-cols-2 lg:col-span-5 xl:grid-cols-3">
              <div className="cursor-move rounded border border-gray-200 bg-white p-3 shadow-sm hover:bg-blue-50">
                <h4 className="font-medium">toUpperCase</h4>
                <p className="mt-1 text-xs text-gray-500">
                  Convert string to uppercase
                </p>
                <div className="mt-2 rounded bg-gray-50 p-2 text-xs">
                  <strong>Input:</strong> String
                  <br />
                  <strong>Output:</strong> String
                </div>
              </div>

              <div className="cursor-move rounded border border-gray-200 bg-white p-3 shadow-sm hover:bg-blue-50">
                <h4 className="font-medium">toLowerCase</h4>
                <p className="mt-1 text-xs text-gray-500">
                  Convert string to lowercase
                </p>
                <div className="mt-2 rounded bg-gray-50 p-2 text-xs">
                  <strong>Input:</strong> String
                  <br />
                  <strong>Output:</strong> String
                </div>
              </div>

              <div className="cursor-move rounded border border-gray-200 bg-white p-3 shadow-sm hover:bg-blue-50">
                <h4 className="font-medium">capitalize</h4>
                <p className="mt-1 text-xs text-gray-500">
                  Capitalize first letter of string
                </p>
                <div className="mt-2 rounded bg-gray-50 p-2 text-xs">
                  <strong>Input:</strong> String
                  <br />
                  <strong>Output:</strong> String
                </div>
              </div>

              <div className="cursor-move rounded border border-gray-200 bg-white p-3 shadow-sm hover:bg-blue-50">
                <h4 className="font-medium">trim</h4>
                <p className="mt-1 text-xs text-gray-500">
                  Remove whitespace from start and end
                </p>
                <div className="mt-2 rounded bg-gray-50 p-2 text-xs">
                  <strong>Input:</strong> String
                  <br />
                  <strong>Output:</strong> String
                </div>
              </div>

              <div className="cursor-move rounded border border-gray-200 bg-white p-3 shadow-sm hover:bg-blue-50">
                <h4 className="font-medium">substring</h4>
                <p className="mt-1 text-xs text-gray-500">
                  Extract part of a string
                </p>
                <div className="mt-2 rounded bg-gray-50 p-2 text-xs">
                  <strong>Input:</strong> String
                  <br />
                  <strong>Output:</strong> String
                  <br />
                  <strong>Parameters:</strong> start, end
                </div>
              </div>

              <div className="cursor-move rounded border border-gray-200 bg-white p-3 shadow-sm hover:bg-blue-50">
                <h4 className="font-medium">replace</h4>
                <p className="mt-1 text-xs text-gray-500">
                  Replace text in a string
                </p>
                <div className="mt-2 rounded bg-gray-50 p-2 text-xs">
                  <strong>Input:</strong> String
                  <br />
                  <strong>Output:</strong> String
                  <br />
                  <strong>Parameters:</strong> search, replacement
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 lg:col-span-12">
        <Button variant="outline">Cancel</Button>
        <Button variant="outline">Test Mappings</Button>
        <Button>Save Configuration</Button>
      </div>
    </div>
  );
};

export default MappingConfigurationWireframe;
