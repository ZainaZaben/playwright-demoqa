import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

/**
 * DemoQA sometimes overlays ads/footers that can intercept clicks.
 * This helper removes the usual suspects safely (no-op if not present).
 */
async function removeObstructions(page: Page) {
  await page.evaluate(() => {
    const selectors = [
      '#fixedban',
      'div[id^="google_ads_iframe"]',
      'iframe[id^="google_ads_iframe"]',
      'div[id^="google_ads"]',
      '.adsbygoogle',
      'footer',
    ];

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((el) => el.remove());
    }

    // If any element is still covering the page due to fixed positioning, hide it.
    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' && Number.parseInt(style.zIndex || '0', 10) > 1000) {
        el.style.display = 'none';
      }
    });
  });
}

/**
 * Select an option from DemoQA's React-Select dropdowns (State/City).
 * The control is not a native <select>, so we target the hidden input.
 */
async function selectReactSelectOption(page: Page, inputId: string, optionText: string) {
  const input = page.locator(`#${inputId}`);
  await expect(input, `React-Select input #${inputId} should be visible`).toBeVisible();
  await input.fill(optionText);
  await page.keyboard.press('Enter');
}

/**
 * Clicks a day in the date picker by visible day number.
 * We avoid selecting "outside month" days by excluding the dedicated class.
 */
async function pickDateOfBirth(page: Page, date: { year: string; month: string; day: string }) {
  // DemoQA's label is not reliably bound to the input, so we use the stable input id.
  await page.locator('#dateOfBirthInput').click();

  const monthSelect = page.locator('.react-datepicker__month-select');
  const yearSelect = page.locator('.react-datepicker__year-select');
  await expect(monthSelect).toBeVisible();
  await expect(yearSelect).toBeVisible();

  await monthSelect.selectOption({ label: date.month });
  await yearSelect.selectOption({ label: date.year });

  // Day buttons look like: .react-datepicker__day--0xx
  // We also exclude days from other months.
  const day = page.locator(
    `.react-datepicker__day:not(.react-datepicker__day--outside-month):has-text("${date.day}")`,
  );
  await day.first().click();
}

test.describe('DemoQA - Practice Form', () => {
  test('should submit form and verify modal data', async ({ page }) => {
    // Test data (kept together so beginners can easily change it)
    const data = {
      firstName: 'Zaina',
      lastName: 'Zaben',
      email: 'zaina.zaben@example.com',
      gender: 'Female',
      mobile: '1234567890',
      dob: { year: '1998', month: 'May', day: '11' },
      subject: 'Maths',
      hobbies: ['Sports', 'Music'] as const,
      address: 'Amman, Jordan',
      state: 'NCR',
      city: 'Delhi',
      uploadFileName: 'sample-image.svg',
    };

    // 1. Open the website
    await page.goto('/automation-practice-form', { waitUntil: 'domcontentloaded' });

    // 2. Remove ads/footer/popups if they block interactions
    await removeObstructions(page);

    // Ensure the form is present before interacting
    await expect(page.getByRole('heading', { name: 'Practice Form' })).toBeVisible();

    // 3. Fill first name and last name
    await page.getByPlaceholder('First Name').fill(data.firstName);
    await page.getByPlaceholder('Last Name').fill(data.lastName);

    // 4. Fill email
    await page.getByPlaceholder('name@example.com').fill(data.email);

    // 5. Select Female gender
    // Prefer label-based click (stable and readable).
    await page.getByText(data.gender, { exact: true }).click();

    // 6. Enter mobile number
    await page.getByPlaceholder('Mobile Number').fill(data.mobile);

    // 7. Select date of birth
    await pickDateOfBirth(page, data.dob);

    // 8. Add subject
    const subjectsInput = page.locator('#subjectsInput');
    await subjectsInput.fill(data.subject);
    await page.keyboard.press('Enter');

    // 9. Select multiple hobbies
    for (const hobby of data.hobbies) {
      await page.getByText(hobby, { exact: true }).click();
    }

    // 10. Upload a sample image
    const filePath = path.resolve(__dirname, 'fixtures', data.uploadFileName);
    await page.setInputFiles('#uploadPicture', filePath);

    // 11. Fill current address
    await page.locator('#currentAddress').fill(data.address);

    // 12. Select state and city (dynamic dropdowns)
    // DemoQA uses react-select input ids:
    // - State: react-select-3-input
    // - City:  react-select-4-input
    await selectReactSelectOption(page, 'react-select-3-input', data.state);
    await selectReactSelectOption(page, 'react-select-4-input', data.city);

    // 13. Submit the form
    // The button can be blocked by sticky elements; click after last cleanup.
    await removeObstructions(page);
    await page.getByRole('button', { name: 'Submit' }).click();

    // 14. Verify the success modal appears
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();
    // The modal title is an <h5> with a stable id on this page.
    await expect(page.locator('#example-modal-sizes-title-lg')).toHaveText(
      'Thanks for submitting the form',
    );

    // 15. Verify submitted data inside the modal
    const table = page.locator('.table-responsive');
    await expect(table).toBeVisible();

    // Helper to assert a specific row value in the modal table.
    const expectRowValue = async (label: string, value: string | RegExp) => {
      const row = table.getByRole('row', { name: new RegExp(`^${escapeRegExp(label)}\\s`, 'i') });
      await expect(row, `Row "${label}" should exist in modal`).toBeVisible();
      await expect(row, `Row "${label}" should contain expected value`).toContainText(value);
    };

    await expectRowValue('Student Name', `${data.firstName} ${data.lastName}`);
    await expectRowValue('Student Email', data.email);
    await expectRowValue('Gender', data.gender);
    await expectRowValue('Mobile', data.mobile);

    // Date formatting in the modal is typically: "11 May,1998" (note: no space after comma).
    // We assert the exact value string (instead of a regex with word boundaries) because the row
    // text concatenates label + value with no separator.
    await expectRowValue('Date of Birth', `${data.dob.day} ${data.dob.month},${data.dob.year}`);

    await expectRowValue('Subjects', data.subject);
    await expectRowValue('Hobbies', /Sports.*Music|Music.*Sports/);
    await expectRowValue('Picture', data.uploadFileName);
    await expectRowValue('Address', data.address);
    await expectRowValue('State and City', `${data.state} ${data.city}`);

    // Optional: close the modal.
    // Some environments (extensions/overlays) can prevent the close animation from completing;
    // since closing is not part of the user requirements, we intentionally skip asserting it.
    await page.getByRole('button', { name: 'Close' }).click();
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

