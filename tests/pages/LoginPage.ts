import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('https://conduit.bondaracademy.com/login');
    await this.page.waitForURL('**/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[placeholder="Email"]', email);
    await this.page.fill('input[placeholder="Password"]', password);
    await this.page.click('button:has-text("Sign in")');
    await this.page.waitForURL('**/');
  }
}
