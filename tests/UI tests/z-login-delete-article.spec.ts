import { test } from '../../utils/fixtures';
import { expect } from '../../utils/custom-expect';
import { config } from '../../config';
import { readFileSync, unlinkSync } from 'fs';
import { LoginPage } from '../pages/LoginPage';
import { ArticlePage } from '../pages/ArticlePage';

test('Z UI Flow - Login to Conduit and delete article', async ({ page }) => {
  // Read article slug from file created by API test
  let articleSlug = '';
  try {
    articleSlug = readFileSync('article-slug.txt', 'utf8').trim();
    console.log(`Found article slug: ${articleSlug}`);
  } catch (error) {
    console.log('No article slug file found - no article to delete');
    return;
  }

  const loginPage = new LoginPage(page);
  const articlePage = new ArticlePage(page);

  // Navigate to the article page using page object
  await articlePage.goto(articleSlug);

  // If not logged in, perform login using the LoginPage
  const signInLink = await page.$('a:has-text("Sign in")');
  if (signInLink) {
    await loginPage.goto();
    await loginPage.login(config.auth.email, config.auth.password);
    // Return to the article after login
    await articlePage.goto(articleSlug);
  }

  // Attempt to delete the article
  const deleted = await articlePage.deleteIfOwned();
  if (deleted) {
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
});