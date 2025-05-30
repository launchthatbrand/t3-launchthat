import type { GraphQLInfo, SanitizedConfig } from "@convexcms/core";
import type { OperationArgs } from "graphql-http";
import * as GraphQL from "graphql";

import {
  createComplexityRule,
  fieldExtensionsEstimator,
  simpleEstimator,
} from "./packages/graphql-query-complexity/index.js";
import { accessResolver } from "./resolvers/auth/access.js";
import { buildFallbackLocaleInputType } from "./schema/buildFallbackLocaleInputType.js";
import { buildLocaleInputType } from "./schema/buildLocaleInputType.js";
import { buildPoliciesType } from "./schema/buildPoliciesType.js";
import { initCollections } from "./schema/initCollections.js";
import { initGlobals } from "./schema/initGlobals.js";
import { wrapCustomFields } from "./utilities/wrapCustomResolver.js";

export function configToSchema(config: SanitizedConfig): {
  schema: GraphQL.GraphQLSchema;
  validationRules: (args: OperationArgs<any>) => GraphQL.ValidationRule[];
} {
  const collections = config.collections.reduce((acc, collection) => {
    acc[collection.slug] = {
      config: collection,
    };

    return acc;
  }, {});

  const globals = {
    config: config.globals,
  };

  const graphqlResult: GraphQLInfo = {
    collections,
    globals,
    Mutation: {
      name: "Mutation",
      fields: {},
    },
    Query: {
      name: "Query",
      fields: {},
    },
    types: {
      arrayTypes: {},
      blockInputTypes: {},
      blockTypes: {},
      groupTypes: {},
      tabTypes: {},
    },
  };

  // TODO: CONVEX_REFACTOR_PHASE_3 - Comment out i18n/localization schema types
  // if (config.localization) {
  //   graphqlResult.types['localeInputType'] = buildLocaleInputType(
  //     config.localization,
  //   )
  //   graphqlResult.types['fallbackLocaleInputType'] =
  //     buildFallbackLocaleInputType(config.localization)
  // }

  initCollections({ config, graphqlResult });
  initGlobals({ config, graphqlResult });

  // TODO: CONVEX_REFACTOR_PHASE_3 - Comment out Auth access query
  // graphqlResult.Query.fields['Access'] = {
  //   type: buildPoliciesType(config),
  //   resolve: accessResolver(config),
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Comment out custom queries (might relate to custom endpoints/hooks)
  // if (typeof config.graphQL.queries === 'function') {
  //   const customQueries = config.graphQL.queries(GraphQL, {
  //     ...graphqlResult,
  //     config,
  //   })
  //   graphqlResult.Query = {
  //     ...graphqlResult.Query,
  //     fields: {
  //       ...graphqlResult.Query.fields,
  //       ...wrapCustomFields((customQueries || {}) as never),
  //     },
  //   }
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Comment out custom mutations (might relate to custom endpoints/hooks)
  // if (typeof config.graphQL.mutations === 'function') {
  //   const customMutations = config.graphQL.mutations(GraphQL, {
  //     ...graphqlResult,
  //     config,
  //   })
  //   graphqlResult.Mutation = {
  //     ...graphqlResult.Mutation,
  //     fields: {
  //       ...graphqlResult.Mutation.fields,
  //       ...wrapCustomFields((customMutations || {}) as never),
  //     },
  //   }
  // }

  const query = new GraphQL.GraphQLObjectType(graphqlResult.Query);
  const mutation = new GraphQL.GraphQLObjectType(graphqlResult.Mutation);

  const schema = new GraphQL.GraphQLSchema({
    mutation,
    query,
  });

  const validationRules = (args): GraphQL.ValidationRule[] => [
    createComplexityRule({
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 }), // Fallback if complexity not set
      ],
      maximumComplexity: config.graphQL.maxComplexity,
      variables: args.variableValues,
      // onComplete: (complexity) => { console.log('Query Complexity:', complexity); },
    }),
    ...(typeof config?.graphQL?.validationRules === "function"
      ? config.graphQL.validationRules(args)
      : []),
  ];

  return {
    schema,
    validationRules,
  };
}

export const emptyGraphqlExport = {};
