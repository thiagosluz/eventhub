import React from "react";
import type { Preview, Decorator } from "@storybook/nextjs-vite";
import { withThemeByClassName } from "@storybook/addon-themes";

import "../src/app/globals.css";

const withThemeBase: Decorator = (Story) => (
  <div className="bg-background text-foreground min-h-screen antialiased">
    <div className="p-8">
      <Story />
    </div>
  </div>
);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    layout: "centered",
    a11y: {
      test: "error",
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
      parentSelector: "html",
    }),
    withThemeBase,
  ],
};

export default preview;
