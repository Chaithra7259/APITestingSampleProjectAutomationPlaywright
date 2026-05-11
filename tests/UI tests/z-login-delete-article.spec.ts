import { test } from '../../utils/fixtures';
import { expect } from '../../utils/custom-expect';
import { config } from '../../config';
import { readFileSync, unlinkSync } from 'fs';

test(
  'Z UI Flow - Login to Conduit and delete article',
  async ({ page }) => {
    // Read article slug from file created by API test
    let articleSlug = '';
    try {
      articleSlug = readFileSync('article-slug.txt', 'utf8').trim();
      console.log(`Found article slug: ${articleSlug}`);
    } catch (error) {
      console.log('No article slug file found - no article to delete');
      return;
    }

    // Navigate to the article page
    await page.goto(`https://conduit.bondaracademy.com/article/${articleSlug}`);

    // Click Sign in link if not logged in
    const signInLink = await page.$('a:has-text("Sign in")');
    if (signInLink) {
      await signInLink.click();
      // Wait for login page to load
      await page.waitForURL('**/login');
      // Fill in login credentials
      await page.fill('input[placeholder="Email"]', config.auth.email);
      await page.fill('input[placeholder="Password"]', config.auth.password);
      // Click Sign in button
      await page.click('button:has-text("Sign in")');
      // Wait for successful login
      await page.waitForURL('**/');
      // Go back to the article
      await page.goto(`https://conduit.bondaracademy.com/article/${articleSlug}`);
    }

    // Wait for article page to load
    await page.waitForSelector('.article-page');

    // Look for delete button
    const deleteButton = await page.$('button:has-text("Delete Article")');

    if (deleteButton) {
      // Click delete button
      await page.click('button:has-text("Delete Article")');

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = await page.$('button:has-text("OK")');
      if (confirmButton) {
        await confirmButton.click();
      }

      // Wait for redirect back to home or articles list
      await page.waitForURL('**/');

      // Clean up the slug file
      try {
        unlinkSync('article-slug.txt');
      } catch (error) {
        // Ignore if file doesn't exist
      }

      console.log('Article deleted successfully via UI');
    } else {
      console.log('Delete button not found - user may not own the article');
    }
  }
);