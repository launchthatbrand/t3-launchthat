import { execSync } from "node:child_process";
import type { PlopTypes } from "@turbo/gen";

interface PackageJson {
  name: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("init", {
    description: "Generate a new package for the Acme Monorepo",
    prompts: [
      {
        type: "input",
        name: "name",
        message:
          "What is the name of the package? (You can skip the `@acme/` prefix)",
      },
      {
        type: "input",
        name: "deps",
        message:
          "Enter a space separated list of dependencies you would like to install",
      },
    ],
    actions: [
      (answers) => {
        if ("name" in answers && typeof answers.name === "string") {
          if (answers.name.startsWith("@acme/")) {
            answers.name = answers.name.replace("@acme/", "");
          }
        }
        return "Config sanitized";
      },
      {
        type: "add",
        path: "packages/{{ name }}/eslint.config.js",
        templateFile: "templates/eslint.config.js.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/package.json",
        templateFile: "templates/package.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/tsconfig.json",
        templateFile: "templates/tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "packages/{{ name }}/src/index.ts",
        template: "export const name = '{{ name }}';",
      },
      {
        type: "modify",
        path: "packages/{{ name }}/package.json",
        async transform(content, answers) {
          if ("deps" in answers && typeof answers.deps === "string") {
            const pkg = JSON.parse(content) as PackageJson;
            for (const dep of answers.deps.split(" ").filter(Boolean)) {
              const version = await fetch(
                `https://registry.npmjs.org/-/package/${dep}/dist-tags`,
              )
                .then((res) => res.json())
                .then((json) => json.latest);
              if (!pkg.dependencies) pkg.dependencies = {};
              pkg.dependencies[dep] = `^${version}`;
            }
            return JSON.stringify(pkg, null, 2);
          }
          return content;
        },
      },
      async (answers) => {
        /**
         * Install deps and format everything
         */
        if ("name" in answers && typeof answers.name === "string") {
          // execSync("pnpm dlx sherif@latest --fix", {
          //   stdio: "inherit",
          // });
          execSync("pnpm i", { stdio: "inherit" });
          execSync(
            `pnpm prettier --write packages/${answers.name}/** --list-different`,
          );
          return "Package scaffolded";
        }
        return "Package not scaffolded";
      },
    ],
  });

  plop.setGenerator("portal-plugin", {
    description:
      "Generate a new LaunchThat Portal plugin package (packages/launchthat-plugin-*)",
    prompts: [
      {
        type: "input",
        name: "id",
        message:
          'Plugin id (package suffix), e.g. "support" -> launchthat-plugin-support',
      },
      {
        type: "input",
        name: "displayName",
        message: 'Human name, e.g. "Support"',
      },
      {
        type: "input",
        name: "description",
        message: "Short description (one sentence)",
      },
    ],
    actions: [
      (answers) => {
        const a = answers as Record<string, unknown>;
        if (typeof a.id !== "string") {
          throw new Error("Expected id");
        }
        const id = a.id.trim().toLowerCase();
        a.id = id;
        if (!id || !/^[a-z0-9-]+$/.test(id)) {
          throw new Error("Plugin id must match /^[a-z0-9-]+$/");
        }
        if (typeof a.displayName !== "string" || !a.displayName.trim()) {
          a.displayName = id;
        }
        if (typeof a.description !== "string") {
          a.description = "";
        }
        return "Config sanitized";
      },
      {
        type: "add",
        path: "packages/launchthat-plugin-{{ id }}/eslint.config.js",
        templateFile: "templates/portal-plugin/eslint.config.js.hbs",
      },
      {
        type: "add",
        path: "packages/launchthat-plugin-{{ id }}/package.json",
        templateFile: "templates/portal-plugin/package.json.hbs",
      },
      {
        type: "add",
        path: "packages/launchthat-plugin-{{ id }}/tsconfig.json",
        templateFile: "templates/portal-plugin/tsconfig.json.hbs",
      },
      {
        type: "add",
        path: "packages/launchthat-plugin-{{ id }}/src/plugin.ts",
        templateFile: "templates/portal-plugin/src/plugin.ts.hbs",
      },
      {
        type: "add",
        path: "packages/launchthat-plugin-{{ id }}/src/index.ts",
        templateFile: "templates/portal-plugin/src/index.ts.hbs",
      },
      {
        type: "add",
        path: "packages/launchthat-plugin-{{ id }}/src/admin/index.ts",
        template: "export {};",
      },
      {
        type: "add",
        path: "packages/launchthat-plugin-{{ id }}/src/frontend/index.ts",
        template: "export {};",
      },
      {
        type: "add",
        path: "packages/launchthat-plugin-{{ id }}/src/context/index.ts",
        template: "export {};",
      },
      async (answers) => {
        const a = answers as Record<string, unknown>;
        if (typeof a.id !== "string") {
          return "Plugin not scaffolded";
        }
        execSync(
          "pnpm prettier --write turbo/generators/templates/portal-plugin/**",
          {
            stdio: "inherit",
          },
        );
        execSync(
          `pnpm prettier --write packages/launchthat-plugin-${a.id}/** --list-different`,
          { stdio: "inherit" },
        );
        return "Portal plugin scaffolded";
      },
    ],
  });
}
