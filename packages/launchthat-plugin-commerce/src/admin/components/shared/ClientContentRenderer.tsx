"use client";

import React, { useEffect, useState } from "react";

import { useAdminLayout } from "../../ui/AdminLayout";

// Interface for client content sections
interface ClientContentSection {
  value: string;
  component: React.ComponentType<unknown>;
  props?: Record<string, unknown>;
}

// Props for the client content renderer
interface ClientContentRendererProps {
  sections: ClientContentSection[];
  defaultSection?: string;
  className?: string;
}

// Hook to sync with tab navigation
const useTabSync = (defaultSection?: string) => {
  const { activeTab } = useAdminLayout();
  const [activeSection, setActiveSection] = useState(
    defaultSection ?? "details",
  );

  // Sync with AdminLayout tab changes
  useEffect(() => {
    if (activeTab) {
      setActiveSection(activeTab);
    }
  }, [activeTab]);

  // Handle hash-based navigation from tabs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the #
      if (hash) {
        setActiveSection(hash);
      }
    };

    // Set initial section from hash
    const initialHash = window.location.hash.slice(1);
    if (initialHash) {
      setActiveSection(initialHash);
    }

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return { activeSection, setActiveSection };
};

// Main client content renderer component
export const ClientContentRenderer: React.FC<ClientContentRendererProps> = ({
  sections,
  defaultSection,
  className = "w-full",
}) => {
  const { activeSection } = useTabSync(defaultSection);

  // Find the active section
  const activeSectionData = sections.find(
    (section) => section.value === activeSection,
  );

  if (!activeSectionData) {
    // Fallback to first section if active section not found
    const fallbackSection = sections[0];
    if (!fallbackSection) {
      return <div>No content sections available</div>;
    }

    const FallbackComponent = fallbackSection.component;
    return (
      <div className={className} id={fallbackSection.value}>
        <FallbackComponent {...(fallbackSection.props ?? {})} />
      </div>
    );
  }

  const ActiveComponent = activeSectionData.component;

  return (
    <div className={className} id={activeSectionData.value}>
      <ActiveComponent {...(activeSectionData.props ?? {})} />
    </div>
  );
};

// Helper hook for components that need to know the active section
export const useActiveSection = (defaultSection?: string) => {
  return useTabSync(defaultSection);
};

// Wrapper component that provides all sections but only renders the active one
interface AllSectionsRendererProps {
  children: React.ReactNode;
  defaultSection?: string;
  className?: string;
}

export const AllSectionsRenderer: React.FC<AllSectionsRendererProps> = ({
  children,
  defaultSection,
  className = "w-full",
}) => {
  const { activeSection } = useTabSync(defaultSection);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Check if this child should be shown
          const childProps = child.props as {
            value?: string;
            "data-section"?: string;
          };
          const childSection = childProps.value ?? childProps["data-section"];
          const isActive = childSection === activeSection;

          return (
            <div
              id={childSection ?? "unknown-section"}
              style={{ display: isActive ? "block" : "none" }}
            >
              {child}
            </div>
          );
        }
        return child;
      })}
    </div>
  );
};

// HOC to make a component section-aware
export const withSectionVisibility = <P extends object>(
  Component: React.ComponentType<P>,
  sectionValue: string,
) => {
  const SectionAwareComponent: React.FC<P> = (props) => {
    const { activeSection } = useTabSync();
    const isVisible = activeSection === sectionValue;

    if (!isVisible) return null;

    return <Component {...props} />;
  };

  SectionAwareComponent.displayName = `withSectionVisibility(${Component.displayName ?? Component.name})`;
  return SectionAwareComponent;
};

export default ClientContentRenderer;
