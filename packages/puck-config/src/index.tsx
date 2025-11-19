import { Button } from "./blocks/Button";
import { Card } from "./blocks/Card";
import { Flex } from "./blocks/Flex";
import { Grid } from "./blocks/Grid";
import { Hero } from "./blocks/Hero";
import { Logos } from "./blocks/Logos";
import { Space } from "./blocks/Space";
import { Stats } from "./blocks/Stats";
import { Template } from "./blocks/Template";
import { Text } from "./blocks/Text";
import { initialData } from "./initial-data";
import Root from "./root";
import { UserConfig } from "./types";

// We avoid the name config as next gets confused
export const puckConfig: UserConfig = {
  root: Root,
  categories: {
    layout: {
      components: ["Grid", "Flex", "Space"],
    },
    typography: {
      components: ["Heading", "Text"],
    },
    interactive: {
      title: "Actions",
      components: ["Button"],
    },
    other: {
      title: "Other",
      components: ["Card", "Hero", "Logos", "Stats", "Template"],
    },
  },
  components: {
    Button,
    Card,
    Grid,
    Hero,
    Flex,
    Logos,
    Stats,
    Template,
    Text,
    Space,
  },
};

export const componentKey = Buffer.from(
  `${Object.keys(puckConfig.components).join("-")}-${JSON.stringify(initialData)}`,
).toString("base64");

export default puckConfig;
