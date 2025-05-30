// @ts-strict-ignore
// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out GraphQL types
// import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql'
// import type { Request as graphQLRequest, OperationArgs } from 'graphql-http'
import { spawn } from "child_process";
import * as crypto from "crypto";
import { fileURLToPath } from "node:url";
import * as path from "path";
import type { Logger } from "pino";
import type { NonNever } from "ts-essentials";
// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out i18n types
// import type { SupportedLanguages } from '@convexcms/translations'

import { Cron } from "croner";
import * as ws from "ws";

import type { ImportMap } from "./bin/generateImportMap/index.js";
// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth types
// import type { AuthArgs } from './auth/operations/auth.js'
// import type { Result as ForgotPasswordResult } from './auth/operations/forgotPassword.js'
// import type { Options as ForgotPasswordOptions } from './auth/operations/local/forgotPassword.js'
// import type { Options as LoginOptions } from './auth/operations/local/login.js'
// import type { Options as ResetPasswordOptions } from './auth/operations/local/resetPassword.js'
// import type { Options as UnlockOptions } from './auth/operations/local/unlock.js'
// import type { Options as VerifyEmailOptions } from './auth/operations/local/verifyEmail.js'
// import type { Result as LoginResult } from './auth/operations/login.js'
// import type { Result as ResetPasswordResult } from './auth/operations/resetPassword.js'
// import type { AuthStrategy, User } from './auth/types.js'
import type {
  BulkOperationResult,
  Collection,
  CollectionConfig,
  DataFromCollectionSlug,
  SelectFromCollectionSlug,
  TypeWithID,
} from "./collections/config/types.js";
import type { Options as CountOptions } from "./collections/operations/local/count.js";
import type { Options as CreateOptions } from "./collections/operations/local/create.js";
import type {
  ByIDOptions as DeleteByIDOptions,
  ManyOptions as DeleteManyOptions,
  Options as DeleteOptions,
} from "./collections/operations/local/delete.js";
import type { Options as DuplicateOptions } from "./collections/operations/local/duplicate.js";
import type { Options as FindOptions } from "./collections/operations/local/find.js";
import type { Options as FindByIDOptions } from "./collections/operations/local/findByID.js";
import type { Options as FindVersionByIDOptions } from "./collections/operations/local/findVersionByID.js";
import type { Options as FindVersionsOptions } from "./collections/operations/local/findVersions.js";
import type { Options as RestoreVersionOptions } from "./collections/operations/local/restoreVersion.js";
import type {
  ByIDOptions as UpdateByIDOptions,
  ManyOptions as UpdateManyOptions,
  Options as UpdateOptions,
} from "./collections/operations/local/update.js";
import type { ClientConfig } from "./config/client.js";
import type { InitOptions, SanitizedConfig } from "./config/types.js";
import type { BaseDatabaseAdapter, PaginatedDocs } from "./database/types.js";
import type { FlattenedBlock } from "./fields/config/types.js";
// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Email types
// import type { InitializedEmailAdapter } from './email/types.js'
import type {
  DataFromGlobalSlug,
  Globals,
  SelectFromGlobalSlug,
} from "./globals/config/types.js";
// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning types
// import type { CountGlobalVersionsOptions } from './globals/operations/local/countGlobalVersions.js'
import type { Options as FindGlobalOptions } from "./globals/operations/local/findOne.js";
// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning types
// import type { Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID.js'
// import type { Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions.js'
// import type { Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion.js'
import type { Options as UpdateGlobalOptions } from "./globals/operations/local/update.js";
import type {
  ApplyDisableErrors,
  JsonObject,
  PayloadRequest,
  SelectType,
  TransformCollectionWithSelect,
  TransformGlobalWithSelect,
} from "./types/index.js";
import type { TraverseFieldsCallback } from "./utilities/traverseFields.js";
import { generateImportMap } from "./bin/generateImportMap/index.js";
import { checkPayloadDependencies } from "./checkPayloadDependencies.js";
import localOperations from "./collections/operations/local/index.js";
import { fieldAffectsData } from "./fields/config/types.js";
import localGlobalOperations from "./globals/operations/local/index.js";
import { getJobsLocalAPI } from "./queues/localAPI.js";
import { isNextBuild } from "./utilities/isNextBuild.js";
import { getLogger } from "./utilities/logger.js";
import { serverInit as serverInitTelemetry } from "./utilities/telemetry/events/serverInit.js";
import { traverseFields } from "./utilities/traverseFields.js";

export type { FieldState } from "./admin/forms/Form.js";

export type * from "./admin/types.js";

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning types
// import type { TypeWithVersion } from './versions/types.js'

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth crypto and strategies
// import { decrypt, encrypt } from './auth/crypto.js'
// import { APIKeyAuthentication } from './auth/strategies/apiKey.js'
// import { JWTAuthentication } from './auth/strategies/jwt.js'

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Email adapter
// import { consoleEmailAdapter } from './email/consoleEmailAdapter.js'

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth exports
// export { default as executeAccess } from './auth/executeAccess.js'
// export { executeAuthStrategies } from './auth/executeAuthStrategies.js'

export interface GeneratedTypes {
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth untyped section
  // authUntyped: {
  //   [slug: string]: {
  //     forgotPassword: {
  //       email: string
  //     }
  //     login: {
  //       email: string
  //       password: string
  //     }
  //     registerFirstUser: {
  //       email: string
  //       password: string
  //     }
  //     unlock: {
  //       email: string
  //     }
  //   }
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Blocks untyped section (Complex Fields)
  // blocksUntyped: {
  //   [slug: string]: JsonObject
  // }
  collectionsJoinsUntyped: {
    [slug: string]: {
      [schemaPath: string]: CollectionSlug;
    };
  };
  collectionsSelectUntyped: {
    [slug: string]: SelectType;
  };

  collectionsUntyped: {
    [slug: string]: JsonObject & TypeWithID;
  };
  dbUntyped: {
    defaultIDType: number | string;
  };
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out GlobalsSelect untyped (potentially complex)
  // globalsSelectUntyped: {
  //   [slug: string]: SelectType
  // }

  globalsUntyped: {
    [slug: string]: JsonObject;
  };
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Jobs untyped (Queues/Hooks)
  // jobsUntyped: {
  //   tasks: {
  //     [slug: string]: {
  //       input?: JsonObject
  //       output?: JsonObject
  //     }
  //   }
  //   workflows: {
  //     [slug: string]: {
  //       input: JsonObject
  //     }
  //   }
  // }
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Locale untyped (i18n)
  // localeUntyped: null | string
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out User untyped (Auth)
  // userUntyped: User
}

// Helper type to resolve the correct type using conditional types
type ResolveCollectionType<T> = "collections" extends keyof T
  ? T["collections"]
  : // @ts-expect-error
    T["collectionsUntyped"];

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out BlockType resolver (Complex Fields)
// type ResolveBlockType<T> = 'blocks' extends keyof T
//   ? T['blocks']
//   : // @ts-expect-error
//     T['blocksUntyped']

type ResolveCollectionSelectType<T> = "collectionsSelect" extends keyof T
  ? T["collectionsSelect"]
  : // @ts-expect-error
    T["collectionsSelectUntyped"];

type ResolveCollectionJoinsType<T> = "collectionsJoins" extends keyof T
  ? T["collectionsJoins"]
  : // @ts-expect-error
    T["collectionsJoinsUntyped"];

type ResolveGlobalType<T> = "globals" extends keyof T
  ? T["globals"]
  : // @ts-expect-error
    T["globalsUntyped"];

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out GlobalSelectType resolver (potentially complex)
// type ResolveGlobalSelectType<T> = 'globalsSelect' extends keyof T
//   ? T['globalsSelect']
//   : // @ts-expect-error
//     T['globalsSelectUntyped']

// Applying helper types to GeneratedTypes
export type TypedCollection = ResolveCollectionType<GeneratedTypes>;

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out TypedBlock (Complex Fields)
// export type TypedBlock = ResolveBlockType<GeneratedTypes>

export type TypedUploadCollection = NonNever<{
  [K in keyof TypedCollection]:
    | "filename"
    | "filesize"
    | "mimeType"
    | "url" extends keyof TypedCollection[K]
    ? TypedCollection[K]
    : never;
}>;

export type TypedCollectionSelect = ResolveCollectionSelectType<GeneratedTypes>;

export type TypedCollectionJoins = ResolveCollectionJoinsType<GeneratedTypes>;

export type TypedGlobal = ResolveGlobalType<GeneratedTypes>;

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out TypedGlobalSelect
// export type TypedGlobalSelect = ResolveGlobalSelectType<GeneratedTypes>

// Extract string keys from the type
export type StringKeyOf<T> = Extract<keyof T, string>;

// Define the types for slugs using the appropriate collections and globals
export type CollectionSlug = StringKeyOf<TypedCollection>;

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out BlockSlug (Complex Fields)
// export type BlockSlug = StringKeyOf<TypedBlock>

export type UploadCollectionSlug = StringKeyOf<TypedUploadCollection>;

type ResolveDbType<T> = "db" extends keyof T
  ? T["db"]
  : // @ts-expect-error
    T["dbUntyped"];

export type DefaultDocumentIDType =
  ResolveDbType<GeneratedTypes>["defaultIDType"];
export type GlobalSlug = StringKeyOf<TypedGlobal>;

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Locale and User type resolvers (i18n, Auth)
// type ResolveLocaleType<T> = 'locale' extends keyof T ? T['locale'] : T['localeUntyped']
// type ResolveUserType<T> = 'user' extends keyof T ? T['user'] : T['userUntyped']

// export type TypedLocale = ResolveLocaleType<GeneratedTypes>
// export type TypedUser = ResolveUserType<GeneratedTypes>

// TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth and Job operations types (Auth, Queues/Hooks)
// type ResolveAuthOperationsType<T> = 'auth' extends keyof T ? T['auth'] : T['authUntyped']
// export type TypedAuthOperations = ResolveAuthOperationsType<GeneratedTypes>

// type ResolveJobOperationsType<T> = 'jobs' extends keyof T ? T['jobs'] : T['jobsUntyped']
// export type TypedJobs = ResolveJobOperationsType<GeneratedTypes>

// Minimal stubs for potentially used types
export type TypedLocale = string | null;
export type TypedUser = Record<string, any>; // Simple object for now
export type BlockSlug = string; // Simple string
export type TypedBlock = Record<string, any>; // Simple object
export type TypedGlobalSelect = Record<string, any>; // Simple object

// Stub for PayloadRequest if not found in imports - REMOVED as it's imported from ./types/index.js
// export type PayloadRequest = {
//   [key: string]: any // Use a generic object for now
//   user?: TypedUser | null
//   payload?: any // Payload instance
//   locale?: string | null
//   fallbackLocale?: string | null
//   context?: RequestContext
// } & Request // Assuming global Request type is available or needs polyfill

// TODO: CONVEX_REFACTOR_PHASE_3 - Define minimal stubs for Auth/Job operation types if needed by other parts
// export type TypedAuthOperations = any;
// export type TypedJobs = any;

// NOTE: import.meta.url requires "module": "node16" or "nodenext" in tsconfig.json
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

let checkedDependencies = false;

/**
 * @description Payload
 */
export class BasePayload {
  [key: string]: any; // TODO: remove this once type is well defined. Currently needed for custom endpoints.

  #backgroundTaskPromiseMap = new Map<string, Promise<any>>();
  #initCalled: boolean = false; // Declare private field
  #express: any | undefined; // Declare private field, type might need refinement

  apiURL: string = ""; // Add instance property
  adminURL: string = ""; // Add instance property

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth method stub
  // auth = async (options: AuthArgs) => {
  //   return localOperations.auth(this, options)
  // }
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth strategies property
  // authStrategies: AuthStrategy[]
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Blocks property (Complex Fields)
  // blocks: Record<BlockSlug, FlattenedBlock> = {}

  /**
   * A record where keys are collection slugs and values are collection configs
   */
  collections: Record<CollectionSlug, Collection> = {};

  /**
   * The sanitized Payload config
   */
  config: SanitizedConfig;

  /**
   * @description Performs count operation directly on the database adapter. Bypasses all hooks. Only admins can perform this operation.
   * @param options
   * @returns {count}
   */
  count = async <T extends CollectionSlug>(
    options: CountOptions<T>,
  ): Promise<{ totalDocs: number }> => {
    return localOperations.count(this, options);
  };

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning method
  // countGlobalVersions = async <T extends GlobalSlug>(
  //   options: CountGlobalVersionsOptions<T>,
  // ): Promise<{ totalDocs: number }> => {
  //   return localGlobalOperations.countVersions(this, options)
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning method
  // countVersions = async <T extends CollectionSlug>(
  //   options: CountOptions<T>,
  // ): Promise<{ totalDocs: number }> => {
  //   return localOperations.countVersions(this, options)
  // }

  /**
   * @description Performs create operation
   * @param options
   */
  async create<TSlug extends CollectionSlug>(
    options: {
      collection: TSlug;
      data: Record<string, any>; // Simplified data type
      depth?: number;
      disableVerificationEmail?: boolean;
      draft?: boolean;
      file?: any; // IncomingUploadType
      filePath?: string;
      locale?: string; // Locale
      overrideAccess?: boolean;
      req?: Partial<PayloadRequest>;
      showHiddenFields?: boolean;
      user?: any; // User
      // TODO: CONVEX_REFACTOR_PHASE_3 - Add back SelectType if needed
      // select?: TSelect
    }, // & CreateUpdateOptions,
  ): Promise<DataFromCollectionSlug<TSlug>> {
    // ): Promise<TransformCollectionWithSelect<TSlug, TSelect>> {
    console.warn(
      "Payload Core `create` method is a stub in ConvexCMS. Use Convex functions.",
      options,
    );
    // TODO: CONVEX_REFACTOR_PHASE_3 - Replace with actual Convex logic or keep as stub
    return {} as DataFromCollectionSlug<TSlug>;
  }
  db: DatabaseAdapter;
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth crypto methods
  // decrypt = decrypt
  /**
   * @description Duplicates a document and returns the new document
   * @param options
   * @returns Newly created document
   */
  async duplicate<TSlug extends CollectionSlug>(
    options: {
      collection: TSlug;
      data?: Partial<Record<string, any>>; // Simplified data type
      depth?: number;
      draft?: boolean;
      id: number | string;
      locale?: string; // Locale
      overrideAccess?: boolean;
      req?: Partial<PayloadRequest>;
      showHiddenFields?: boolean;
      user?: any; // User
      // TODO: CONVEX_REFACTOR_PHASE_3 - Add back SelectType if needed
      // select?: TSelect
    }, // & CreateUpdateOptions,
  ): Promise<DataFromCollectionSlug<TSlug>> {
    // ): Promise<TransformCollectionWithSelect<TSlug, TSelect>> {
    console.warn(
      "Payload Core `duplicate` method is a stub in ConvexCMS. Use Convex functions.",
      options,
    );
    // TODO: CONVEX_REFACTOR_PHASE_3 - Replace with actual Convex logic or keep as stub
    return {} as DataFromCollectionSlug<TSlug>;
  }
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Email property
  // email: InitializedEmailAdapter
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth crypto methods
  // encrypt = encrypt
  /**
   * @description GraphQL extensions
   */
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out GraphQL extensions
  // extensions: (args: {
  //   args: OperationArgs<any>
  //   req: graphQLRequest<unknown, unknown>
  //   result: ExecutionResult
  // }) => Promise<any>

  /**
   * @description Find documents with criteria
   * @param options
   * @returns {Promise<docs>}
   */
  find = async <
    TSlug extends CollectionSlug,
    TSelect extends SelectFromCollectionSlug<TSlug>,
  >(
    options: FindOptions<TSlug, TSelect>,
  ): Promise<PaginatedDocs<TransformCollectionWithSelect<TSlug, TSelect>>> => {
    return localOperations.find(this, options);
  };
  /**
   * Find document by ID
   * @param options
   * @returns {Promise<doc>}
   */
  findByID = async <
    TSlug extends CollectionSlug,
    TDisableErrors extends boolean,
    TSelect extends SelectFromCollectionSlug<TSlug>,
  >(
    options: FindByIDOptions<TSlug, TDisableErrors, TSelect>,
  ): Promise<
    ApplyDisableErrors<
      TransformCollectionWithSelect<TSlug, TSelect>,
      TDisableErrors
    >
  > => {
    return localOperations.findByID(this, options);
  };
  /**
   * @description Find global configuration by slug
   * @param options
   * @returns {Promise<global>}
   */
  findGlobal = async <TSlug extends GlobalSlug>(
    options: FindGlobalOptions<TSlug, any>,
  ): Promise<any /* TransformGlobalWithSelect<TSlug, TSelect> */> => {
    return localGlobalOperations.findOne(this, options);
  };

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning method
  // findGlobalVersionByID = async <TSlug extends GlobalSlug>(
  //   options: FindGlobalVersionByIDOptions<TSlug>,
  // ): Promise<TypeWithVersion<DataFromGlobalSlug<TSlug>>> => {
  //   return localGlobalOperations.findVersionByID(this, options)
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning method
  // findGlobalVersions = async <TSlug extends GlobalSlug>(
  //   options: FindGlobalVersionsOptions<TSlug>,
  // ): Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<TSlug>>>> => {
  //   return localGlobalOperations.findVersions(this, options)
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning method
  // findVersionByID = async <TSlug extends CollectionSlug>(
  //   options: FindVersionByIDOptions<TSlug>,
  // ): Promise<TypeWithVersion<DataFromCollectionSlug<TSlug>>> => {
  //   return localOperations.findVersionByID(this, options)
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning method
  // findVersions = async <TSlug extends CollectionSlug>(
  //   options: FindVersionsOptions<TSlug>,
  // ): Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<TSlug>>>> => {
  //   return localOperations.findVersions(this, options)
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth method
  // forgotPassword = async <TSlug extends CollectionSlug>(
  //   options: ForgotPasswordOptions<TSlug>,
  // ): Promise<ForgotPasswordResult> => {
  //   return localOperations.forgotPassword(this, options)
  // }

  getAdminURL = (): string => this.adminURL;
  getAPIURL = (): string => this.apiURL;
  /**
   * A record where keys are global slugs and values are global configs
   */
  globals: Globals;
  importMap: ImportMap;
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Jobs property (Queues/Hooks)
  // jobs = getJobsLocalAPI(this)
  logger: Logger;
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth method
  // login = async <TSlug extends CollectionSlug>(
  //   options: LoginOptions<TSlug>,
  // ): Promise<{ user: DataFromCollectionSlug<TSlug> } & LoginResult> => {
  //   return localOperations.login(this, options)
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth method
  // resetPassword = async <TSlug extends CollectionSlug>(
  //   options: ResetPasswordOptions<TSlug>,
  // ): Promise<ResetPasswordResult> => {
  //   return localOperations.resetPassword(this, options)
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning method
  // restoreGlobalVersion = async <TSlug extends GlobalSlug>(
  //   options: RestoreGlobalVersionOptions<TSlug>,
  // ): Promise<DataFromGlobalSlug<TSlug>> => {
  //   return localGlobalOperations.restoreVersion(this, options)
  // }

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning method
  // restoreVersion = async <TSlug extends CollectionSlug>(
  //   options: RestoreVersionOptions<TSlug>,
  // ): Promise<DataFromCollectionSlug<TSlug>> => {
  //   return localOperations.restoreVersion(this, options)
  // }
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out GraphQL schema property
  // schema: GraphQLSchema
  secret: string;
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Email method
  // sendEmail: InitializedEmailAdapter['sendEmail']

  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out complex field types property
  // types: {
  //   arrayTypes: any
  //   blockInputTypes: any
  //   blockTypes: any
  //   fallbackLocaleInputType?: any
  //   groupTypes: any
  //   localeInputType?: any
  //   tabTypes: any
  // }
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth method
  // unlock = async <TSlug extends CollectionSlug>(
  //   options: UnlockOptions<TSlug>,
  // ): Promise<boolean> => {
  //   return localOperations.unlock(this, options)
  // }

  /**
   * @description Update a global configuration
   * @param options
   * @returns Returns the updated global configuration
   */
  updateGlobal = async <TSlug extends GlobalSlug>(
    options: UpdateGlobalOptions<TSlug, any>,
  ): Promise<any /* TransformGlobalWithSelect<TSlug, TSelect> */> => {
    return localGlobalOperations.update(this, options);
  };
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out GraphQL validation rules
  // validationRules: (args: OperationArgs<any>) => ValidationRule[]
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Auth method
  // verifyEmail = async <TSlug extends CollectionSlug>(
  //   options: VerifyEmailOptions<TSlug>,
  // ): Promise<boolean> => {
  //   return localOperations.verifyEmail(this, options)
  // }
  // TODO: CONVEX_REFACTOR_PHASE_3 - Commented out Versioning property
  // versions: {
  //   [slug: string]: any // TODO: Type this
  // } = {}

  /**
   * @description Run a payload command programmatically
   */
  async bin({
    args,
    cwd,
    log,
  }: {
    args: string[];
    cwd?: string;
    log?: boolean;
  }): Promise<{ code: number }> {
    return new Promise((resolve, reject) => {
      const spawned = spawn(
        "node",
        [path.resolve(dirname, "../bin.js"), ...args],
        {
          cwd,
          stdio: log || log === undefined ? "inherit" : "ignore",
        },
      );

      spawned.on("exit", (code) => {
        resolve({ code });
      });

      spawned.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   * @description delete one or more documents
   * @param options
   * @returns Updated document(s)
   */
  async delete<TSlug extends CollectionSlug>(
    options: {
      collection: TSlug;
      depth?: number;
      id: number | string;
      locale?: string; // Locale
      overrideAccess?: boolean;
      req?: Partial<PayloadRequest>;
      showHiddenFields?: boolean;
      user?: any; // User
      where?: any; // Where
    }, // & DeleteOptions<TSlug>,
  ): Promise<DataFromCollectionSlug<TSlug>> {
    console.warn(
      "Payload Core `delete` method is a stub in ConvexCMS. Use Convex functions.",
      options,
    );
    // TODO: CONVEX_REFACTOR_PHASE_3 - Replace with actual Convex logic or keep as stub
    return {} as DataFromCollectionSlug<TSlug>;
  }

  /**
   * @description Initializes Payload
   * @param options
   */
  async init(options: InitOptions): Promise<Payload> {
    this.#initCalled = true;
    this.logger.info("Starting Payload...");
    // this.#express = options.express // options.express likely removed from InitOptions

    // TODO: CONVEX_REFACTOR_PHASE_3 - Simplify config handling
    // this.config = await findConfig() // Use simplified config if available
    // this.config = await options.config // Assume config passed in for now
    // if (!this.config) {
    // 	throw new MissingConfigError()
    // }
    this.config = options.config as SanitizedConfig; // Assume sanitized config is passed directly

    // --- Simplified Init Logic ---
    // const webpackCompiler = await getWebpackConfig({ config: this.config })
    // this.bundler = getBundler({ config: this.config, webpackCompiler })

    // --- Database (Removed, handled by Convex) ---
    // this.db = await this.initializeDatabase(options)

    // --- API URL Setup ---
    // Use fallbacks as config properties might be missing now
    const apiRoute = (this.config as any)?.routes?.api || "/api";
    const adminRoute = (this.config as any)?.routes?.admin || "/admin";
    const serverURL = (this.config as any)?.serverURL || "";
    this.apiURL = `${serverURL}${apiRoute}`;
    this.adminURL = `${serverURL}${adminRoute}`;

    // --- Collections & Globals Setup (Simplified/Stubbed) ---
    this.collections = {}; // Initialize as empty object
    (this.config as any)?.collections?.forEach(
      (collection: CollectionConfig) => {
        // Minimal setup, actual logic in Convex
        this.collections[collection.slug] = {
          config: collection,
          // Add stubs for other properties if needed by downstream code
        } as any; // Cast to any for now
      },
    );

    this.globals = {
      config: (this.config as any)?.globals || [],
      // Add stubs for other properties if needed
    } as any; // Cast to any for now

    // --- Comment out Payload specific initializations ---
    // TODO: CONVEX_REFACTOR_PHASE_3 - Replace/reintegrate with Convex logic
    // this.initializeEmail(options)
    // this.initGraphQL()
    // this.initEndpoints()
    // this.initAuthStrategies()
    // this.initQueryPresets()
    // this.initAdmin()
    // this.initI18n()

    // --- Custom Init ---
    if (typeof options.onInit === "function") {
      await options.onInit(this as unknown as Payload); // Cast might be needed depending on Payload type definition
    }
    if (typeof (this.config as any)?.onInit === "function") {
      await (this.config as any).onInit(this as unknown as Payload);
    }

    this.logger.info("Payload Initialized Successfully.");
    return this as unknown as Payload; // Return 'this' casted to Payload
  }

  update<
    TSlug extends CollectionSlug,
    TSelect extends SelectFromCollectionSlug<TSlug>,
  >(
    options: UpdateManyOptions<TSlug, TSelect>,
  ): Promise<BulkOperationResult<TSlug, TSelect>>;

  /**
   * @description Update one or more documents
   * @param options
   * @returns Updated document(s)
   */
  update<
    TSlug extends CollectionSlug,
    TSelect extends SelectFromCollectionSlug<TSlug>,
  >(
    options: UpdateByIDOptions<TSlug, TSelect>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>>;

  update<
    TSlug extends CollectionSlug,
    TSelect extends SelectFromCollectionSlug<TSlug>,
  >(
    options: UpdateOptions<TSlug, TSelect>,
  ): Promise<
    | BulkOperationResult<TSlug, TSelect>
    | TransformCollectionWithSelect<TSlug, TSelect>
  > {
    const { update } = localOperations;
    return update<TSlug, TSelect>(this, options);
  }
}

const initialized = new BasePayload();

export default initialized;

let cached: {
  payload: null | Payload;
  promise: null | Promise<Payload>;
  reload: boolean | Promise<void>;
  ws: null | WebSocket;
} = global._payload;

if (!cached) {
  cached = global._payload = {
    payload: null,
    promise: null,
    reload: false,
    ws: null,
  };
}

/**
 * @description Initializes Payload
 * @param options
 */
export const getPayload = async (
  options: Pick<InitOptions, "config" | "importMap">,
): Promise<Payload> => {
  if (!options?.config) {
    throw new Error(
      "Error: the payload config is required for getPayload to work.",
    );
  }

  if (cached.payload) {
    if (cached.reload === true) {
      let resolve: () => void;

      // getPayload is called multiple times, in parallel. However, we only want to run `await reload` once. By immediately setting cached.reload to a promise,
      // we can ensure that all subsequent calls will wait for the first reload to finish. So if we set it here, the 2nd call of getPayload
      // will reach `if (cached.reload instanceof Promise) {` which then waits for the first reload to finish.
      cached.reload = new Promise((res) => (resolve = res));
      const config = await options.config;
      // TODO: CONVEX_REFACTOR_PHASE_3 - Comment out call to reload function
      // await reload(config, cached.payload, !options.importMap)

      resolve();
    }

    if (cached.reload instanceof Promise) {
      await cached.reload;
    }
    if (options?.importMap) {
      cached.payload.importMap = options.importMap;
    }
    return cached.payload;
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (!cached.promise) {
    // no need to await options.config here, as it's already awaited in the BasePayload.init
    cached.promise = new BasePayload().init(options);
  }

  try {
    cached.payload = await cached.promise;

    if (
      !cached.ws &&
      process.env.NODE_ENV !== "production" &&
      process.env.NODE_ENV !== "test" &&
      process.env.DISABLE_PAYLOAD_HMR !== "true"
    ) {
      try {
        const port = process.env.PORT || "3000";

        const path = "/_next/webpack-hmr";
        // The __NEXT_ASSET_PREFIX env variable is set for both assetPrefix and basePath (tested in Next.js 15.1.6)
        const prefix = process.env.__NEXT_ASSET_PREFIX ?? "";

        cached.ws = new WebSocket(
          process.env.PAYLOAD_HMR_URL_OVERRIDE ??
            `ws://localhost:${port}${prefix}${path}`,
        );

        cached.ws.onmessage = (event) => {
          if (typeof event.data === "string") {
            const data = JSON.parse(event.data);

            if ("action" in data && data.action === "serverComponentChanges") {
              cached.reload = true;
            }
          }
        };

        cached.ws.onerror = (_) => {
          // swallow any websocket connection error
        };
      } catch (_) {
        // swallow e
      }
    }
  } catch (e) {
    cached.promise = null;
    // add identifier to error object, so that our error logger in routeError.ts does not attempt to re-initialize getPayload
    e.payloadInitError = true;
    throw e;
  }

  if (options?.importMap) {
    cached.payload.importMap = options.importMap;
  }

  return cached.payload;
};

type Payload = BasePayload;

interface RequestContext {
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DatabaseAdapter extends BaseDatabaseAdapter {}
export type { Payload, RequestContext };
export { extractAccessFromPermission } from "./auth/extractAccessFromPermission.js";
export { getAccessResults } from "./auth/getAccessResults.js";
export { getFieldsToSign } from "./auth/getFieldsToSign.js";
export * from "./auth/index.js";
export { accessOperation } from "./auth/operations/access.js";
export { forgotPasswordOperation } from "./auth/operations/forgotPassword.js";
export { initOperation } from "./auth/operations/init.js";
export { loginOperation } from "./auth/operations/login.js";
export { logoutOperation } from "./auth/operations/logout.js";
export type { MeOperationResult } from "./auth/operations/me.js";
export { meOperation } from "./auth/operations/me.js";
export { refreshOperation } from "./auth/operations/refresh.js";
export { registerFirstUserOperation } from "./auth/operations/registerFirstUser.js";
export { resetPasswordOperation } from "./auth/operations/resetPassword.js";
export { unlockOperation } from "./auth/operations/unlock.js";
export { verifyEmailOperation } from "./auth/operations/verifyEmail.js";
export { JWTAuthentication } from "./auth/strategies/jwt.js";
export type {
  AuthStrategyFunction,
  AuthStrategyFunctionArgs,
  AuthStrategyResult,
  CollectionPermission,
  DocumentPermissions,
  FieldPermissions,
  GlobalPermission,
  IncomingAuthType,
  Permission,
  Permissions,
  SanitizedCollectionPermission,
  SanitizedDocumentPermissions,
  SanitizedFieldPermissions,
  SanitizedGlobalPermission,
  SanitizedPermissions,
  User,
  VerifyConfig,
} from "./auth/types.js";
export { generateImportMap } from "./bin/generateImportMap/index.js";

export type { ImportMap } from "./bin/generateImportMap/index.js";
export { genImportMapIterateFields } from "./bin/generateImportMap/iterateFields.js";
export {
  type ClientCollectionConfig,
  createClientCollectionConfig,
  createClientCollectionConfigs,
  type ServerOnlyCollectionAdminProperties,
  type ServerOnlyCollectionProperties,
  type ServerOnlyUploadProperties,
} from "./collections/config/client.js";

export type {
  AfterChangeHook as CollectionAfterChangeHook,
  AfterDeleteHook as CollectionAfterDeleteHook,
  AfterErrorHook as CollectionAfterErrorHook,
  AfterForgotPasswordHook as CollectionAfterForgotPasswordHook,
  AfterLoginHook as CollectionAfterLoginHook,
  AfterLogoutHook as CollectionAfterLogoutHook,
  AfterMeHook as CollectionAfterMeHook,
  AfterOperationHook as CollectionAfterOperationHook,
  AfterReadHook as CollectionAfterReadHook,
  AfterRefreshHook as CollectionAfterRefreshHook,
  AuthCollection,
  AuthOperationsFromCollectionSlug,
  BaseListFilter,
  BeforeChangeHook as CollectionBeforeChangeHook,
  BeforeDeleteHook as CollectionBeforeDeleteHook,
  BeforeLoginHook as CollectionBeforeLoginHook,
  BeforeOperationHook as CollectionBeforeOperationHook,
  BeforeReadHook as CollectionBeforeReadHook,
  BeforeValidateHook as CollectionBeforeValidateHook,
  BulkOperationResult,
  Collection,
  CollectionAdminOptions,
  CollectionConfig,
  DataFromCollectionSlug,
  HookOperationType,
  MeHook as CollectionMeHook,
  RefreshHook as CollectionRefreshHook,
  RequiredDataFromCollection,
  RequiredDataFromCollectionSlug,
  SanitizedCollectionConfig,
  SanitizedJoins,
  TypeWithID,
  TypeWithTimestamps,
} from "./collections/config/types.js";

export type { CompoundIndex } from "./collections/config/types.js";

export type { SanitizedCompoundIndex } from "./collections/config/types.js";
export {
  createDataloaderCacheKey,
  getDataLoader,
} from "./collections/dataloader.js";
export { countOperation } from "./collections/operations/count.js";
export { createOperation } from "./collections/operations/create.js";
export { deleteOperation } from "./collections/operations/delete.js";
export { deleteByIDOperation } from "./collections/operations/deleteByID.js";
export { docAccessOperation } from "./collections/operations/docAccess.js";
export { duplicateOperation } from "./collections/operations/duplicate.js";
export { findOperation } from "./collections/operations/find.js";
export { findByIDOperation } from "./collections/operations/findByID.js";
export { findVersionByIDOperation } from "./collections/operations/findVersionByID.js";
export { findVersionsOperation } from "./collections/operations/findVersions.js";
export { restoreVersionOperation } from "./collections/operations/restoreVersion.js";
export { updateOperation } from "./collections/operations/update.js";
export { updateByIDOperation } from "./collections/operations/updateByID.js";
export { buildConfig } from "./config/build.js";

export {
  type ClientConfig,
  createClientConfig,
  serverOnlyAdminConfigProperties,
  serverOnlyConfigProperties,
  type UnsanitizedClientConfig,
} from "./config/client.js";

export { defaults } from "./config/defaults.js";
export { type OrderableEndpointBody } from "./config/orderable/index.js";
export { sanitizeConfig } from "./config/sanitize.js";
export type * from "./config/types.js";
export { combineQueries } from "./database/combineQueries.js";
export { createDatabaseAdapter } from "./database/createDatabaseAdapter.js";
export { defaultBeginTransaction } from "./database/defaultBeginTransaction.js";
export { flattenWhereToOperators } from "./database/flattenWhereToOperators.js";
export { getLocalizedPaths } from "./database/getLocalizedPaths.js";
export { createMigration } from "./database/migrations/createMigration.js";
export { getMigrations } from "./database/migrations/getMigrations.js";
export { getPredefinedMigration } from "./database/migrations/getPredefinedMigration.js";
export { migrate } from "./database/migrations/migrate.js";
export { migrateDown } from "./database/migrations/migrateDown.js";
export { migrateRefresh } from "./database/migrations/migrateRefresh.js";
export { migrateReset } from "./database/migrations/migrateReset.js";
export { migrateStatus } from "./database/migrations/migrateStatus.js";
export { migrationsCollection } from "./database/migrations/migrationsCollection.js";
export { migrationTemplate } from "./database/migrations/migrationTemplate.js";
export { readMigrationFiles } from "./database/migrations/readMigrationFiles.js";
export { writeMigrationIndex } from "./database/migrations/writeMigrationIndex.js";
export type * from "./database/queryValidation/types.js";
export type {
  EntityPolicies,
  PathToQuery,
} from "./database/queryValidation/types.js";
export { validateQueryPaths } from "./database/queryValidation/validateQueryPaths.js";
export { validateSearchParam } from "./database/queryValidation/validateSearchParams.js";
export type {
  BaseDatabaseAdapter,
  BeginTransaction,
  CommitTransaction,
  Connect,
  Count,
  CountArgs,
  CountGlobalVersionArgs,
  CountGlobalVersions,
  CountVersions,
  Create,
  CreateArgs,
  CreateGlobal,
  CreateGlobalArgs,
  CreateGlobalVersion,
  CreateGlobalVersionArgs,
  CreateMigration,
  CreateVersion,
  CreateVersionArgs,
  DatabaseAdapterResult as DatabaseAdapterObj,
  DBIdentifierName,
  DeleteMany,
  DeleteManyArgs,
  DeleteOne,
  DeleteOneArgs,
  DeleteVersions,
  DeleteVersionsArgs,
  Destroy,
  Find,
  FindArgs,
  FindGlobal,
  FindGlobalArgs,
  FindGlobalVersions,
  FindGlobalVersionsArgs,
  FindOne,
  FindOneArgs,
  FindVersions,
  FindVersionsArgs,
  GenerateSchema,
  Init,
  Migration,
  MigrationData,
  MigrationTemplateArgs,
  PaginatedDocs,
  QueryDrafts,
  QueryDraftsArgs,
  RollbackTransaction,
  Transaction,
  UpdateGlobal,
  UpdateGlobalArgs,
  UpdateGlobalVersion,
  UpdateGlobalVersionArgs,
  UpdateJobs,
  UpdateJobsArgs,
  UpdateMany,
  UpdateManyArgs,
  UpdateOne,
  UpdateOneArgs,
  UpdateVersion,
  UpdateVersionArgs,
  Upsert,
  UpsertArgs,
} from "./database/types.js";
export type {
  EmailAdapter as PayloadEmailAdapter,
  SendEmailOptions,
} from "./email/types.js";
export {
  APIError,
  APIErrorName,
  AuthenticationError,
  DuplicateCollection,
  DuplicateFieldName,
  DuplicateGlobal,
  ErrorDeletingFile,
  FileRetrievalError,
  FileUploadError,
  Forbidden,
  InvalidConfiguration,
  InvalidFieldName,
  InvalidFieldRelationship,
  Locked,
  LockedAuth,
  MissingCollectionLabel,
  MissingEditorProp,
  MissingFieldInputOptions,
  MissingFieldType,
  MissingFile,
  NotFound,
  QueryError,
  ValidationError,
  ValidationErrorName,
} from "./errors/index.js";
export type { ValidationFieldError } from "./errors/index.js";

export { baseBlockFields } from "./fields/baseFields/baseBlockFields.js";
export { baseIDField } from "./fields/baseFields/baseIDField.js";
export {
  createClientField,
  createClientFields,
  type ServerOnlyFieldAdminProperties,
  type ServerOnlyFieldProperties,
} from "./fields/config/client.js";

export { sanitizeFields } from "./fields/config/sanitize.js";
export type {
  AdminClient,
  ArrayField,
  ArrayFieldClient,
  BaseValidateOptions,
  Block,
  BlockJSX,
  BlocksField,
  BlocksFieldClient,
  CheckboxField,
  CheckboxFieldClient,
  ClientBlock,
  ClientField,
  ClientFieldProps,
  CodeField,
  CodeFieldClient,
  CollapsibleField,
  CollapsibleFieldClient,
  Condition,
  DateField,
  DateFieldClient,
  EmailField,
  EmailFieldClient,
  Field,
  FieldAccess,
  FieldAffectingData,
  FieldAffectingDataClient,
  FieldBase,
  FieldBaseClient,
  FieldHook,
  FieldHookArgs,
  FieldPresentationalOnly,
  FieldPresentationalOnlyClient,
  FieldTypes,
  FieldWithMany,
  FieldWithManyClient,
  FieldWithMaxDepth,
  FieldWithMaxDepthClient,
  FieldWithPath,
  FieldWithPathClient,
  FieldWithSubFields,
  FieldWithSubFieldsClient,
  FilterOptions,
  FilterOptionsProps,
  FlattenedArrayField,
  FlattenedBlock,
  FlattenedBlocksField,
  FlattenedField,
  FlattenedGroupField,
  FlattenedJoinField,
  FlattenedTabAsField,
  GroupField,
  GroupFieldClient,
  HookName,
  JoinField,
  JoinFieldClient,
  JSONField,
  JSONFieldClient,
  Labels,
  LabelsClient,
  NamedTab,
  NonPresentationalField,
  NonPresentationalFieldClient,
  NumberField,
  NumberFieldClient,
  Option,
  OptionLabel,
  OptionObject,
  PointField,
  PointFieldClient,
  PolymorphicRelationshipField,
  PolymorphicRelationshipFieldClient,
  RadioField,
  RadioFieldClient,
  RelationshipField,
  RelationshipFieldClient,
  RelationshipValue,
  RichTextField,
  RichTextFieldClient,
  RowField,
  RowFieldClient,
  SelectField,
  SelectFieldClient,
  SingleRelationshipField,
  SingleRelationshipFieldClient,
  Tab,
  TabAsField,
  TabAsFieldClient,
  TabsField,
  TabsFieldClient,
  TextareaField,
  TextareaFieldClient,
  TextField,
  TextFieldClient,
  UIField,
  UIFieldClient,
  UnnamedTab,
  UploadField,
  UploadFieldClient,
  Validate,
  ValidateOptions,
  ValueWithRelation,
} from "./fields/config/types.js";

export { getDefaultValue } from "./fields/getDefaultValue.js";

export { traverseFields as afterChangeTraverseFields } from "./fields/hooks/afterChange/traverseFields.js";
export { promise as afterReadPromise } from "./fields/hooks/afterRead/promise.js";
export { traverseFields as afterReadTraverseFields } from "./fields/hooks/afterRead/traverseFields.js";
export { traverseFields as beforeChangeTraverseFields } from "./fields/hooks/beforeChange/traverseFields.js";
export { traverseFields as beforeValidateTraverseFields } from "./fields/hooks/beforeValidate/traverseFields.js";
export { default as sortableFieldTypes } from "./fields/sortableFieldTypes.js";

export { validations } from "./fields/validations.js";
export type {
  ArrayFieldValidation,
  BlocksFieldValidation,
  CheckboxFieldValidation,
  CodeFieldValidation,
  ConfirmPasswordFieldValidation,
  DateFieldValidation,
  EmailFieldValidation,
  JSONFieldValidation,
  NumberFieldManyValidation,
  NumberFieldSingleValidation,
  NumberFieldValidation,
  PasswordFieldValidation,
  PointFieldValidation,
  RadioFieldValidation,
  RelationshipFieldManyValidation,
  RelationshipFieldSingleValidation,
  RelationshipFieldValidation,
  RichTextFieldValidation,
  SelectFieldManyValidation,
  SelectFieldSingleValidation,
  SelectFieldValidation,
  TextareaFieldValidation,
  TextFieldManyValidation,
  TextFieldSingleValidation,
  TextFieldValidation,
  UploadFieldManyValidation,
  UploadFieldSingleValidation,
  UploadFieldValidation,
  UsernameFieldValidation,
} from "./fields/validations.js";
export {
  type ClientGlobalConfig,
  createClientGlobalConfig,
  createClientGlobalConfigs,
  type ServerOnlyGlobalAdminProperties,
  type ServerOnlyGlobalProperties,
} from "./globals/config/client.js";

export type {
  AfterChangeHook as GlobalAfterChangeHook,
  AfterReadHook as GlobalAfterReadHook,
  BeforeChangeHook as GlobalBeforeChangeHook,
  BeforeReadHook as GlobalBeforeReadHook,
  BeforeValidateHook as GlobalBeforeValidateHook,
  DataFromGlobalSlug,
  GlobalAdminOptions,
  GlobalConfig,
  SanitizedGlobalConfig,
} from "./globals/config/types.js";

export { docAccessOperation as docAccessOperationGlobal } from "./globals/operations/docAccess.js";

export { findOneOperation } from "./globals/operations/findOne.js";
export { findVersionByIDOperation as findVersionByIDOperationGlobal } from "./globals/operations/findVersionByID.js";
export { findVersionsOperation as findVersionsOperationGlobal } from "./globals/operations/findVersions.js";
export { restoreVersionOperation as restoreVersionOperationGlobal } from "./globals/operations/restoreVersion.js";
export { updateOperation as updateOperationGlobal } from "./globals/operations/update.js";
export type {
  CollapsedPreferences,
  ColumnPreference,
  DocumentPreferences,
  FieldsPreferences,
  InsideFieldsPreferences,
  ListPreferences,
  PreferenceRequest,
  PreferenceUpdateRequest,
  TabsPreferences,
} from "./preferences/types.js";
export type { QueryPreset } from "./query-presets/types.js";
export { jobAfterRead } from "./queues/config/index.js";
export type {
  JobsConfig,
  RunJobAccess,
  RunJobAccessArgs,
} from "./queues/config/types/index.js";

export type {
  RunInlineTaskFunction,
  RunTaskFunction,
  RunTaskFunctions,
  TaskConfig,
  TaskHandler,
  TaskHandlerArgs,
  TaskHandlerResult,
  TaskHandlerResults,
  TaskInput,
  TaskOutput,
  TaskType,
} from "./queues/config/types/taskTypes.js";
export type {
  BaseJob,
  JobLog,
  JobTaskStatus,
  RunningJob,
  SingleTaskStatus,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowTypes,
} from "./queues/config/types/workflowTypes.js";
export { importHandlerPath } from "./queues/operations/runJobs/runJob/importHandlerPath.js";
export { getLocalI18n } from "./translations/getLocalI18n.js";
export * from "./types/index.js";
export { getFileByPath } from "./uploads/getFileByPath.js";
export type * from "./uploads/types.js";

export { addDataAndFileToRequest } from "./utilities/addDataAndFileToRequest.js";

export {
  addLocalesToRequestFromData,
  sanitizeLocales,
} from "./utilities/addLocalesToRequest.js";
export { commitTransaction } from "./utilities/commitTransaction.js";
export {
  configToJSONSchema,
  entityToJSONSchema,
  fieldsToJSONSchema,
  withNullableJSONSchemaType,
} from "./utilities/configToJSONSchema.js";
export { createArrayFromCommaDelineated } from "./utilities/createArrayFromCommaDelineated.js";
export { createLocalReq } from "./utilities/createLocalReq.js";
export { createPayloadRequest } from "./utilities/createPayloadRequest.js";
export {
  deepCopyObject,
  deepCopyObjectComplex,
  deepCopyObjectSimple,
} from "./utilities/deepCopyObject.js";
export {
  deepMerge,
  deepMergeWithCombinedArrays,
  deepMergeWithReactComponents,
  deepMergeWithSourceArrays,
} from "./utilities/deepMerge.js";
export {
  checkDependencies,
  type CustomVersionParser,
} from "./utilities/dependencies/dependencyChecker.js";
export { getDependencies } from "./utilities/dependencies/getDependencies.js";
export type { FieldSchemaJSON } from "./utilities/fieldSchemaToJSON.js";
export {
  findUp,
  findUpSync,
  pathExistsAndIsAccessible,
  pathExistsAndIsAccessibleSync,
} from "./utilities/findUp.js";
export { flattenAllFields } from "./utilities/flattenAllFields.js";
export { default as flattenTopLevelFields } from "./utilities/flattenTopLevelFields.js";
export { formatErrors } from "./utilities/formatErrors.js";
export {
  formatLabels,
  formatNames,
  toWords,
} from "./utilities/formatLabels.js";
export { getBlockSelect } from "./utilities/getBlockSelect.js";
export { getCollectionIDFieldTypes } from "./utilities/getCollectionIDFieldTypes.js";
export { getFieldByPath } from "./utilities/getFieldByPath.js";
export { getObjectDotNotation } from "./utilities/getObjectDotNotation.js";
export { getRequestLanguage } from "./utilities/getRequestLanguage.js";
export { handleEndpoints } from "./utilities/handleEndpoints.js";
export { headersWithCors } from "./utilities/headersWithCors.js";
export { initTransaction } from "./utilities/initTransaction.js";
export { isEntityHidden } from "./utilities/isEntityHidden.js";
export { default as isolateObjectProperty } from "./utilities/isolateObjectProperty.js";
export { isPlainObject } from "./utilities/isPlainObject.js";
export { isValidID } from "./utilities/isValidID.js";
export { killTransaction } from "./utilities/killTransaction.js";
export { logError } from "./utilities/logError.js";
export { defaultLoggerOptions } from "./utilities/logger.js";
export { mapAsync } from "./utilities/mapAsync.js";
export { mergeHeaders } from "./utilities/mergeHeaders.js";
export { sanitizeFallbackLocale } from "./utilities/sanitizeFallbackLocale.js";
export { sanitizeJoinParams } from "./utilities/sanitizeJoinParams.js";
export { sanitizePopulateParam } from "./utilities/sanitizePopulateParam.js";
export { sanitizeSelectParam } from "./utilities/sanitizeSelectParam.js";
export { stripUnselectedFields } from "./utilities/stripUnselectedFields.js";
export { traverseFields } from "./utilities/traverseFields.js";
export type { TraverseFieldsCallback } from "./utilities/traverseFields.js";
export { buildVersionCollectionFields } from "./versions/buildCollectionFields.js";
export { buildVersionGlobalFields } from "./versions/buildGlobalFields.js";
export { buildVersionCompoundIndexes } from "./versions/buildVersionCompoundIndexes.js";
export { versionDefaults } from "./versions/defaults.js";
// export { deleteCollectionVersions } from './versions/deleteCollectionVersions.js' // Already commented
// export { deleteScheduledPublishJobs } from './versions/deleteScheduledPublishJobs.js' // Already commented
// export { appendVersionToQueryKey } from "./versions/drafts/appendVersionToQueryKey.js"; // Commented out
// export { getQueryDraftsSort } from "./versions/drafts/getQueryDraftsSort.js"; // Commented out
// export { enforceMaxVersions } from "./versions/enforceMaxVersions.js"; // Commented out
// export { getLatestCollectionVersion } from "./versions/getLatestCollectionVersion.js"; // Commented out
// export { getLatestGlobalVersion } from "./versions/getLatestGlobalVersion.js"; // Commented out
// export { saveVersion } from "./versions/saveVersion.js"; // Commented out
// export type { SchedulePublishTaskInput } from "./versions/schedule/types.js"; // Commented out Type
// export type { TypeWithVersion } from "./versions/types.js"; // Commented out Type
// TODO: CONVEX_REFACTOR_PHASE_3 - Comment out problematic import
// export { deepMergeSimple } from '@convexcms/translations/utilities';
