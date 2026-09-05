import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getAllCategories,
    getAllPublishers,
    getGamesByFilters,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

async function seedDiverseGames(db: Database): Promise<{ catId1: number; catId2: number; pubId1: number; pubId2: number }> {
    const [cat1] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'Strategy games' })
        .returning({ id: categories.id });
    const [cat2] = await db
        .insert(categories)
        .values({ name: 'Puzzle', description: 'Puzzle games' })
        .returning({ id: categories.id });
    const [pub1] = await db
        .insert(publishers)
        .values({ name: 'Publisher A', description: 'Publisher A' })
        .returning({ id: publishers.id });
    const [pub2] = await db
        .insert(publishers)
        .values({ name: 'Publisher B', description: 'Publisher B' })
        .returning({ id: publishers.id });

    // Create games with different category/publisher combinations
    const gameData = [
        { title: 'Game 1', category: cat1, publisher: pub1 },
        { title: 'Game 2', category: cat1, publisher: pub2 },
        { title: 'Game 3', category: cat2, publisher: pub1 },
        { title: 'Game 4', category: cat2, publisher: pub2 },
    ];

    for (const data of gameData) {
        await db.insert(games).values({
            title: data.title,
            description: `Description for ${data.title}`,
            starRating: 4.0,
            categoryId: data.category.id,
            publisherId: data.publisher.id,
        });
    }

    return { catId1: cat1.id, catId2: cat2.id, pubId1: pub1.id, pubId2: pub2.id };
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    describe('category filtering', () => {
        it('returns all categories ordered by name', async () => {
            const [cat2] = await db
                .insert(categories)
                .values({ name: 'Puzzle', description: 'Puzzle games' })
                .returning({ id: categories.id });
            const [cat1] = await db
                .insert(categories)
                .values({ name: 'Strategy', description: 'Strategy games' })
                .returning({ id: categories.id });

            const cats = await getAllCategories(db);
            expect(cats.map((c) => c.name)).toEqual(['Puzzle', 'Strategy']);
            expect(cats).toEqual([
                { id: cat2.id, name: 'Puzzle' },
                { id: cat1.id, name: 'Strategy' },
            ]);
        });

        it('filters games by single category', async () => {
            const { catId1 } = await seedDiverseGames(db);
            const filtered = await getGamesByFilters(db, [catId1]);
            expect(filtered.map((g) => g.title).sort()).toEqual(['Game 1', 'Game 2']);
        });

        it('filters games by multiple categories (OR logic)', async () => {
            const { catId1, catId2 } = await seedDiverseGames(db);
            const filtered = await getGamesByFilters(db, [catId1, catId2]);
            expect(filtered.map((g) => g.title).sort()).toEqual(['Game 1', 'Game 2', 'Game 3', 'Game 4']);
        });
    });

    describe('publisher filtering', () => {
        it('returns all publishers ordered by name', async () => {
            const [pub2] = await db
                .insert(publishers)
                .values({ name: 'Publisher B', description: 'Publisher B' })
                .returning({ id: publishers.id });
            const [pub1] = await db
                .insert(publishers)
                .values({ name: 'Publisher A', description: 'Publisher A' })
                .returning({ id: publishers.id });

            const pubs = await getAllPublishers(db);
            expect(pubs.map((p) => p.name)).toEqual(['Publisher A', 'Publisher B']);
            expect(pubs).toEqual([
                { id: pub1.id, name: 'Publisher A' },
                { id: pub2.id, name: 'Publisher B' },
            ]);
        });

        it('filters games by single publisher', async () => {
            const { pubId1 } = await seedDiverseGames(db);
            const filtered = await getGamesByFilters(db, undefined, [pubId1]);
            expect(filtered.map((g) => g.title).sort()).toEqual(['Game 1', 'Game 3']);
        });

        it('filters games by multiple publishers (OR logic)', async () => {
            const { pubId1, pubId2 } = await seedDiverseGames(db);
            const filtered = await getGamesByFilters(db, undefined, [pubId1, pubId2]);
            expect(filtered.map((g) => g.title).sort()).toEqual(['Game 1', 'Game 2', 'Game 3', 'Game 4']);
        });
    });

    describe('combined filtering', () => {
        it('combines category and publisher filters with AND logic', async () => {
            const { catId1, pubId1 } = await seedDiverseGames(db);
            // Games matching (cat1 OR cat2) AND (pub1 OR pub2)
            const filtered = await getGamesByFilters(db, [catId1], [pubId1]);
            expect(filtered.map((g) => g.title)).toEqual(['Game 1']);
        });

        it('handles complex filter combinations', async () => {
            const { catId1, catId2, pubId1 } = await seedDiverseGames(db);
            // Games matching (cat1 OR cat2) AND pub1
            const filtered = await getGamesByFilters(db, [catId1, catId2], [pubId1]);
            expect(filtered.map((g) => g.title).sort()).toEqual(['Game 1', 'Game 3']);
        });

        it('returns all games when no filters are provided', async () => {
            await seedDiverseGames(db);
            const all = await getAllGames(db);
            const noFilter = await getGamesByFilters(db);
            expect(noFilter).toEqual(all);
        });

        it('returns empty array when no games match filters', async () => {
            const { pubId1 } = await seedDiverseGames(db);
            const filtered = await getGamesByFilters(db, [99999], [pubId1]);
            expect(filtered).toEqual([]);
        });
    });
});
