import type { Page } from '@playwright/test';

export class ArticlePage {
  constructor(private page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`https://conduit.bondaracademy.com/article/${slug}`);
    await this.page.waitForSelector('.article-page');
  }

  async deleteIfOwned(): Promise<boolean> {
    const deleteButton = await this.page.$('button:has-text("Delete Article")');
    if (deleteButton) {
      await deleteButton.click();
      const confirmButton = await this.page.$('button:has-text("OK")');
      if (confirmButton) {
        await confirmButton.click();
      }
      await this.page.waitForURL('**/');
      return true;
    }
    return false;
  }
}
