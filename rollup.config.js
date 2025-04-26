import { terser } from "rollup-plugin-terser";

export default {
  input: 'matscraft Behavior/scripts/main.js',
  output: {
    file: 'dist/main.js',
    format: 'esm'
  },
  external: [
    '@minecraft/server',
    '@minecraft/server-admin',
    '@minecraft/server-net',
    '@minecraft/server-ui',
  ],
  plugins: [
    terser()
  ]
};
