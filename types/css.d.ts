// Next declares *.module.css but not plain stylesheets, so a side-effect
// import of a global one has no type to resolve. TypeScript 5.x reports that
// as TS2882 ("Cannot find module or type declarations for side-effect
// import"), which some editors surface even where the CLI does not.
declare module "*.css";
