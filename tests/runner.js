/* global module */
// A minimal test runner shared by tests/run.js (Node) and tests/index.html (browser); no dependencies.
const runTests = (defineTests, Formats, log) => {
    "use strict"

    const tests = []
    const test = (name, fn, options = {}) => tests.push({name, fn, needsDom: options.needsDom === true})

    const show = (value) => JSON.stringify(value)

    const isEqual = (a, b) => {
        if (a === b || (Number.isNaN(a) && Number.isNaN(b))) {
            return true
        }
        if (typeof a !== "object" || typeof b !== "object" || a === null || b === null ||
            Array.isArray(a) !== Array.isArray(b)) {
            return false
        }

        const keys = Object.keys(a)

        return keys.length === Object.keys(b).length &&
            keys.every((key) => Object.prototype.hasOwnProperty.call(b, key) && isEqual(a[key], b[key]))
    }

    const assert = {
        ok: (value, message = "expected a truthy value") => {
            if (!value) {
                throw new Error(message)
            }
        },
        equal: (actual, expected, message = "") => {
            if (!isEqual(actual, expected)) {
                throw new Error(`${message}\n      expected ${show(expected)}\n      actual   ${show(actual)}`)
            }
        },
        // Numbers (or arrays of numbers) equal up to floating point error
        close: (actual, expected, message = "") => {
            const a = [].concat(actual)
            const e = [].concat(expected)

            if (a.length !== e.length || a.some((value, i) => !(Math.abs(value - e[i]) < 1e-9))) {
                throw new Error(`${message}\n      expected ${show(expected)}\n      actual   ${show(actual)}`)
            }
        }
    }

    defineTests(Formats, test, assert)

    const hasDom = typeof DOMParser !== "undefined"
    const result = {passed: 0, failed: 0, skipped: 0}

    tests.forEach(({name, fn, needsDom}) => {
        if (needsDom && !hasDom) {
            result.skipped++
            log(`SKIP ${name} (needs DOMParser; open tests/index.html in a browser)`)

            return
        }

        try {
            fn()
            result.passed++
            log(`PASS ${name}`)
        } catch (error) {
            result.failed++
            log(`FAIL ${name}: ${error.message}`)
        }
    })

    log(`\n${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`)

    return result
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = runTests
}
