import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const RUN_LOCAL_SUPABASE = process.env.E2E_LOCAL_SUPABASE === '1';
const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? 'http://127.0.0.1:54324';

type MailAddress = { Address: string };
type MailSummary = { ID: string; To: MailAddress[] };
type MailpitList = { messages: MailSummary[] };
type MailpitMessage = { HTML: string; Text: string };

async function findMagicLink(request: APIRequestContext, email: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const listResponse = await request.get(`${MAILPIT_URL}/api/v1/messages?limit=50`);
    if (listResponse.ok()) {
      const list = await listResponse.json() as MailpitList;
      const summary = list.messages.find((message) =>
        message.To.some((recipient) => recipient.Address.toLowerCase() === email.toLowerCase()),
      );

      if (summary) {
        const messageResponse = await request.get(`${MAILPIT_URL}/api/v1/message/${summary.ID}`);
        if (messageResponse.ok()) {
          const message = await messageResponse.json() as MailpitMessage;
          const urls = `${message.HTML}\n${message.Text}`.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
          const magicLink = urls
            .map((url) => url.replaceAll('&amp;', '&'))
            .find((url) => url.includes('/auth/v1/verify'));
          if (magicLink) return magicLink;
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`No local Supabase magic-link email arrived for ${email}`);
}

async function signInWithMagicLink(page: Page, request: APIRequestContext, email: string) {
  await page.goto('/');
  await page.getByLabel('Your Email Address').fill(email);
  await page.getByRole('button', { name: 'Send Magic Link' }).click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();

  const magicLink = await findMagicLink(request, email);
  await page.goto(magicLink);
  await expect(page).toHaveURL(/\/($|\?)/);
  await expect(page.getByRole('heading', { name: 'Welcome to Baby Names' })).toBeVisible();
}

test.describe('two-person match flow against local Supabase', () => {
  test.skip(!RUN_LOCAL_SUPABASE, 'Set E2E_LOCAL_SUPABASE=1 after starting and resetting Supabase locally.');

  test('both people authenticate, join one couple, swipe, and see the match', async ({ browser, request }) => {
    await request.delete(`${MAILPIT_URL}/api/v1/messages`, { data: {} });

    const suffix = Date.now();
    const firstEmail = `jayme-${suffix}@example.test`;
    const secondEmail = `merel-${suffix}@example.test`;
    const sharedName = `Codex${String(suffix).slice(-7)}`;
    const displayedName = `${sharedName} Mata`;

    const firstContext = await browser.newContext();
    const secondContext = await browser.newContext();
    const first = await firstContext.newPage();
    const second = await secondContext.newPage();

    try {
      await signInWithMagicLink(first, request, firstEmail);
      await first.getByPlaceholder('e.g. Baby Mata').fill('E2E Baby Names');
      await first.getByRole('button', { name: 'Create & Get Code' }).click();
      const inviteCode = (await first.locator('#tappable-invite-code > div').textContent())?.trim();
      expect(inviteCode).toMatch(/^[A-Z0-9]{6}$/);
      await first.getByRole('button', { name: 'Start Swiping Now' }).click();
      await expect(first.getByRole('button', { name: 'Add your own name' })).toBeVisible();

      await signInWithMagicLink(second, request, secondEmail);
      await second.getByRole('button', { name: 'Join Partner' }).click();
      await second.getByPlaceholder('Q95N8X').fill(inviteCode!);
      await second.getByRole('button', { name: 'Join Partner List' }).click();
      await expect(second.getByRole('button', { name: 'Add your own name' })).toBeVisible();

      await first.getByRole('button', { name: 'Add your own name' }).click();
      await first.getByPlaceholder('e.g. Mateo, Juliette, Rowan...').fill(sharedName);
      await first.getByRole('button', { name: 'Add to Both Decks' }).click();
      await expect(first.getByText(/still need to swipe it/i)).toBeVisible();
      await first.locator('#btn-close-add-name').click();
      await expect(first.getByRole('heading', { name: displayedName })).toBeVisible();

      await second.reload();
      await expect(second.getByRole('heading', { name: displayedName })).toBeVisible();

      await first.getByRole('button', { name: 'Like this name' }).click();
      await second.getByRole('button', { name: 'Like this name' }).click();
      await expect(second.getByText("It's a Match!")).toBeVisible();
      await second.getByRole('button', { name: 'See Our Shared List' }).click();
      await expect(second.getByRole('heading', { name: displayedName })).toBeVisible();

      await first.getByRole('button', { name: 'View matches list' }).click();
      await expect(first.getByRole('heading', { name: displayedName })).toBeVisible();
    } finally {
      await firstContext.close();
      await secondContext.close();
    }
  });
});
