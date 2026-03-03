
module.exports = function (api) {
  api.cache(true);

  const plugins = [
    [
      "module-resolver",
      {
        root: ["./"],
        extensions: [
          ".ios.ts",
          ".android.ts",
          ".ts",
          ".ios.tsx",
          ".android.tsx",
          ".tsx",
          ".jsx",
          ".js",
          ".json",
        ],
        alias: {
          "@": "./",
          "@components": "./components",
          "@style": "./style",
          "@hooks": "./hooks",
          "@types": "./types",
          "@contexts": "./contexts",
          "@lib": "./lib",
        },
      },
    ],
    "@babel/plugin-proposal-export-namespace-from",
  ];

  // Only add editable components plugins if they exist and edit mode is enabled
  if (
    process.env.EXPO_PUBLIC_ENABLE_EDIT_MODE === "TRUE" &&
    process.env.NODE_ENV === "development"
  ) {
    try {
      require.resolve("./babel-plugins/editable-elements.js");
      plugins.push(["./babel-plugins/editable-elements.js", {}]);
      console.log("✓ Loaded editable-elements babel plugin");
    } catch (e) {
      console.warn("⚠ Babel plugin not found: ./babel-plugins/editable-elements.js");
    }

    try {
      require.resolve("./babel-plugins/inject-source-location.js");
      plugins.push(["./babel-plugins/inject-source-location.js", {}]);
      console.log("✓ Loaded inject-source-location babel plugin");
    } catch (e) {
      console.warn("⚠ Babel plugin not found: ./babel-plugins/inject-source-location.js");
    }
  }

  // react-native-worklets/plugin must be listed last!
  plugins.push("react-native-worklets/plugin");

  return {
    presets: ["babel-preset-expo"],
    plugins: plugins,
  };
};
