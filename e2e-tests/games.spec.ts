import { test, expect, type Response } from '@playwright/test';

test.describe('Game Listing and Navigation', () => {
  test('should display games with titles on index page', async ({ page }) => {
    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    await test.step('Verify games grid is visible', async () => {
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible({ timeout: 10000 });
    });

    await test.step('Verify game cards are displayed', async () => {
      // Instead of using regex, look for elements by role and position
      const gameLinks = page.getByRole('link').filter({ has: page.getByTestId('game-title') });
      const count = await gameLinks.count();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('Verify game cards have titles with content', async () => {
      const gameTitles = page.getByTestId('game-title');
      const firstTitle = gameTitles.first();
      await expect(firstTitle).toHaveText(/.+/);
    });
  });

  test('should navigate to correct game details page when clicking on a game', async ({ page }) => {
    let gameTitle: string | null = null;

    await test.step('Navigate to homepage and wait for games to load', async () => {
      await page.goto('/');
      const gamesGrid = page.getByTestId('games-grid');
      await expect(gamesGrid).toBeVisible({ timeout: 10000 });
    });

    await test.step('Get first game information and click it', async () => {
      // Find the first game link (link that contains a game-title element)
      const gameLinks = page.getByRole('link').filter({ has: page.getByTestId('game-title') });
      const firstLink = gameLinks.first();
      
      // Get the href to extract game ID
      const href = await firstLink.getAttribute('href');
      expect(href).toMatch(/^\/game\/\d+/);
      
      // Get the game title
      const titleElement = firstLink.locator('[data-testid="game-title"]');
      gameTitle = await titleElement.textContent();
      
      await firstLink.click();
    });

    await test.step('Verify navigation to game details page', async () => {
      await expect(page).toHaveURL(/\/game\/\d+/, { timeout: 10000 });
      await expect(page.getByTestId('game-details')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Verify game title matches clicked game', async () => {
      if (gameTitle) {
        const displayedTitle = await page.getByTestId('game-details-title').textContent();
        expect(displayedTitle).toContain(gameTitle);
      }
    });
  });

  test('should display game details with all required information', async ({ page }) => {
    await test.step('Navigate to specific game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify game title is displayed', async () => {
      const gameTitle = page.getByTestId('game-details-title');
      await expect(gameTitle).toBeVisible();
      await expect(gameTitle).not.toBeEmpty();
    });

    await test.step('Verify game description is displayed', async () => {
      const gameDescription = page.getByTestId('game-details-description');
      await expect(gameDescription).toBeVisible();
      await expect(gameDescription).not.toBeEmpty();
    });

    await test.step('Verify publisher or category information is present', async () => {
      const publisherExists = await page.getByTestId('game-details-publisher').isVisible();
      const categoryExists = await page.getByTestId('game-details-category').isVisible();
      expect(publisherExists || categoryExists).toBeTruthy();

      if (publisherExists) {
        await expect(page.getByTestId('game-details-publisher')).not.toBeEmpty();
      }

      if (categoryExists) {
        await expect(page.getByTestId('game-details-category')).not.toBeEmpty();
      }
    });
  });

  test('should display a button to back the game', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Verify back game button is visible and enabled', async () => {
      const backButton = page.getByTestId('back-game-button');
      await expect(backButton).toBeVisible();
      await expect(backButton).toContainText('Support This Game');
      await expect(backButton).toBeEnabled();
    });
  });

  test('should be able to navigate back to home from game details', async ({ page }) => {
    await test.step('Navigate to game details page', async () => {
      await page.goto('/game/1');
      await expect(page.getByTestId('game-details')).toBeVisible();
    });

    await test.step('Click back to all games link', async () => {
      const backLink = page.getByRole('link', { name: /back to all games/i });
      await expect(backLink).toBeVisible();
      await backLink.click();
    });

    await test.step('Verify navigation back to homepage', async () => {
      await expect(page).toHaveURL('/');
      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should return a 404 page for a non-existent game', async ({ page }) => {
    let response: Response | null;

    await test.step('Navigate to non-existent game', async () => {
      response = await page.goto('/game/99999');
    });

    await test.step('Verify a branded 404 page is served', async () => {
      expect(response?.status()).toBe(404);
      await expect(page).toHaveTitle(/Page Not Found - Tailspin Toys/);
      await expect(page.getByTestId('not-found')).toBeVisible();
      await expect(page.getByTestId('not-found-heading')).not.toBeEmpty();
      await expect(page.getByTestId('not-found-home-link')).toBeVisible();
    });
  });
});
