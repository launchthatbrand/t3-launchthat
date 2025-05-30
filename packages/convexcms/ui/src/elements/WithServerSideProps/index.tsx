import type { WithServerSidePropsComponent } from "@convexcms/core";
import React from "react";
import { isReactServerComponentOrFunction } from "@convexcms/core/shared";

export const WithServerSideProps: WithServerSidePropsComponent = ({
  Component,
  serverOnlyProps,
  ...rest
}) => {
  if (Component) {
    const WithServerSideProps: React.FC = (passedProps) => {
      const propsWithServerOnlyProps = {
        ...passedProps,
        ...(isReactServerComponentOrFunction(Component)
          ? (serverOnlyProps ?? {})
          : {}),
      };

      return <Component {...propsWithServerOnlyProps} />;
    };

    return WithServerSideProps(rest);
  }

  return null;
};
