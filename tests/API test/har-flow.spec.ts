import { test } from '../../utils/fixtures';
import { expect } from '../../utils/custom-expect';
import { config } from '../../config';
import { faker } from '@faker-js/faker';
import { writeFileSync } from 'fs';

test(
  'A HAR Flow - Create, update, comment, and delete article with auth sequence',
  async ({ api }) => {
    // Step 1: Public listing of articles and tags before authentication.
    const publicArticlesResponse = await api
      .path('/articles')
      .params({ limit: '10', offset: '0' })
      .getRequest(200);
    await expect(publicArticlesResponse).shouldMatchSchema(
      'articles',
      'GET_articles',
      true
    );

    const publicTagsResponse = await api.path('/tags').getRequest(200);
    await expect(publicTagsResponse).shouldMatchSchema('tags', 'GET_tags', true);

    // Step 2: Successful login and token extraction for authenticated calls.
    const loginResponse = await api
      .path('/users/login')
      .body({
        user: {
          email: config.auth.email,
          password: config.auth.password,
        },
      })
      .postRequest(200);
    await expect(loginResponse).shouldMatchSchema(
      'users',
      'POST_users_login',
      true
    );

    const loginPayload = await loginResponse.json();
    const authToken = loginPayload?.user?.token;
    api.auth(`Token ${authToken}`);

    // Step 3: Authenticated article and tag listing.
    const authenticatedArticlesResponse = await api
      .path('/articles')
      .params({ limit: '10', offset: '0' })
      .getRequest(200);
    await expect(authenticatedArticlesResponse).shouldMatchSchema(
      'articles',
      'GET_articles',
      true
    );

    const authenticatedTagsResponse = await api.path('/tags').getRequest(200);
    await expect(authenticatedTagsResponse).shouldMatchSchema(
      'tags',
      'GET_tags',
      true
    );

    // Step 4: Create a new article and validate response schema.
    const articleTitle = faker.lorem.sentence(3);
    const articleRequest = {
      article: {
        title: articleTitle,
        description: 'PostAPI article',
        body: 'This article creates an article via HAR flow',
        tagList: [],
      },
    };

    const createArticleResponse = await api
      .path('/articles/')
      .body(articleRequest)
      .postRequest(201);
    await expect(createArticleResponse).shouldMatchSchema(
      'articles',
      'POST_articles',
      true
    );

    const createdArticle = await createArticleResponse.json();
    const articleSlug = createdArticle?.article?.slug;

    // Step 5: Retrieve the newly created article and its comments.
    const getArticleResponse = await api
      .path(`/articles/${articleSlug}`)
      .getRequest(200);
    await expect(getArticleResponse).shouldMatchSchema(
      'articles',
      'GET_articles_slug',
      true
    );

    const getArticleCommentsResponse = await api
      .path(`/articles/${articleSlug}/comments`)
      .getRequest(200);
    await expect(getArticleCommentsResponse).shouldMatchSchema(
      'articles',
      'GET_articles_comments',
      true
    );

    // Step 6: Add a comment to the article.
    const commentBody = faker.lorem.sentence(5);
    const createCommentResponse = await api
      .path(`/articles/${articleSlug}/comments`)
      .body({ comment: { body: commentBody } })
      .postRequest(200);
    await expect(createCommentResponse).shouldMatchSchema(
      'articles',
      'POST_articles_comments',
      true
    );

    // Step 7: Update the article title and verify the updated record.
    const updateTitle = `${articleTitle} Edited`;
    const updateArticleResponse = await api
      .path(`/articles/${articleSlug}`)
      .body({
        article: {
          title: updateTitle,
          description: 'PostAPI article',
          body: 'This article creates an article via HAR flow',
          tagList: [],
          slug: articleSlug,
        },
      })
      .putRequest(200);
    await expect(updateArticleResponse).shouldMatchSchema(
      'articles',
      'PUT_articles',
      true
    );

    const updatedArticle = await updateArticleResponse.json();
    const updatedArticleSlug = updatedArticle?.article?.slug;

    const getUpdatedArticleResponse = await api
      .path(`/articles/${updatedArticleSlug}`)
      .getRequest(200);
    await expect(getUpdatedArticleResponse).shouldMatchSchema(
      'articles',
      'GET_articles_slug',
      true
    );

    const getUpdatedArticleCommentsResponse = await api
      .path(`/articles/${updatedArticleSlug}/comments`)
      .getRequest(200);
    await expect(getUpdatedArticleCommentsResponse).shouldMatchSchema(
      'articles',
      'GET_articles_comments',
      true
    );

    // Step 8: Verify that the old slug is no longer available.
    const missingArticleResponse = await api
      .path(`/articles/${articleSlug}`)
      .getRequest(404);
    await expect(missingArticleResponse).shouldMatchSchema(
      'articles',
      'GET_articles_slug',
      true
    );

    // Step 9: Verify authenticated user details.
    const getUserResponse = await api.path('/user').getRequest(200);
    await expect(getUserResponse).shouldMatchSchema('user', 'GET_user', true);

    // Step 10: Verify article listing before deletion.
    const preDeleteArticlesResponse = await api
      .path('/articles')
      .params({ limit: '10', offset: '0' })
      .getRequest(200);
    await expect(preDeleteArticlesResponse).shouldMatchSchema(
      'articles',
      'GET_articles',
      true
    );

    // Step 11: Store article slug for UI test to delete
    writeFileSync('article-slug.txt', updatedArticleSlug);

    console.log(`Article created with slug: ${updatedArticleSlug}`);
  }
);
