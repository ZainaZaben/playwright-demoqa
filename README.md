# Playwright DemoQA Automation (TypeScript)

## Purpose
This project is a **beginner-friendly, professional Playwright + TypeScript** automation example that demonstrates how to build a stable end-to-end UI test with clean locators, helpful assertions, and reliable handling of dynamic UI components.

## Website Under Test
The automated test targets DemoQA’s practice form:

- `https://demoqa.com/automation-practice-form`

## Automated Test Scenario
The test file `tests/form.spec.ts` automates the following flow:

1. Open the practice form page
2. Remove/disable ads, footer, or overlays if they block interactions
3. Fill first name and last name
4. Fill email
5. Select **Female** gender
6. Enter mobile number
7. Select date of birth using the date picker
8. Add a subject
9. Select multiple hobbies
10. Upload a sample image
11. Fill current address
12. Select state and city (dynamic React dropdowns)
13. Submit the form
14. Verify the success modal appears
15. Verify the submitted data inside the modal

## Technologies Used
- **Playwright** (Test Runner + Browser Automation)
- **TypeScript**
- **Node.js**
- **Cursor AI** (used to help author and refine the automation project)

## Project Structure
```text
playwright-demoqa/
  playwright.config.ts
  tsconfig.json
  package.json
  tests/
    form.spec.ts
    fixtures/
      sample-image.svg
```

## Prerequisites
- **Node.js** (recommended: latest LTS)
- **npm** (comes with Node.js)

## Installation
1. Install dependencies:

```bash
npm install
```

2. Install Playwright browsers:

```bash
npx playwright install
```

## Running the Tests
Run all tests (headless by default):

```bash
npm test
```

Run tests in headed mode (required for this project’s validation):

```bash
npx playwright test --headed
```

Or using the convenience script:

```bash
npm run test:headed
```

## Notes / Best Practices Included
- Uses **stable selectors** (`id`-based and resilient locators where possible)
- Handles **dynamic dropdowns** (React-Select State/City)
- Adds meaningful assertions for the **success modal** and **submitted values**
- Removes common DemoQA overlays that can intercept clicks in UI automation

## Author
**Zaina Zaben**

