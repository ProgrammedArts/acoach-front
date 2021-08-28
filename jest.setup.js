import '@testing-library/jest-dom/extend-expect'
import { toHaveNoViolations } from 'jest-axe'
import 'jest-localstorage-mock'
import fetch from 'node-fetch'

expect.extend(toHaveNoViolations)

window.fetch = fetch
