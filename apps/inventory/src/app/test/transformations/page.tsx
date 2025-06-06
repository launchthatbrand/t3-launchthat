import MappingConfigurationWireframe from "@/components/integrations/transformations/MappingConfigurationWireframe";

export default function TransformationsTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">
        Data Mapping Configuration UI Wireframe
      </h1>
      <p className="mb-6 text-gray-600">
        This page displays a wireframe for the data mapping and transformation
        interface. The wireframe illustrates how @dnd-kit will be integrated for
        drag-and-drop functionality.
      </p>
      <MappingConfigurationWireframe />
    </div>
  );
}
