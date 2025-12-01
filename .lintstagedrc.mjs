export default {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix --cache",
    "prettier --write",
    // Run typecheck once for all TypeScript files
    // This function will be called for each batch, but we only want to run once
    (filenames) => {
      const tsFiles = filenames.filter((f) => /\.(ts|tsx)$/.test(f));
      // Only run typecheck if there are TypeScript files in this batch
      // Note: This will run for each batch, but tsc checks the whole project anyway
      if (tsFiles.length > 0) {
        return "tsc --noEmit";
      }
      return [];
    },
  ],
  "*.{json,md,css,scss,yml,yaml}": ["prettier --write"],
};
