/* eslint-env node */
// Runs the unit tests with Node: `node tests/run.js` (exits non-zero on failure)
const Formats = require("../formats.js")
const runTests = require("./runner.js")
const defineFormatsTests = require("./formats.test.js")

const result = runTests(defineFormatsTests, Formats, console.log)

process.exitCode = result.failed > 0 ? 1 : 0
