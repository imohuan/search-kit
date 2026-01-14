/**
 * Feature: doc-search-refactor, Property 9: Document List Sorting
 * Feature: doc-search-refactor, Property 10: Document Deletion Correctness
 * Validates: Requirements 3.3, 3.5
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import fc from "fast-check";
import "fake-indexeddb/auto";
import { useDocumentStore } from "./document.store";
import { dbService } from "@/services/db.service";
// import type { Document } from "@/types";

describe("Document Store - Property Tests", () => {
  beforeEach(async () => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());
    // Clear database before each test
    await dbService.clearAll();
  });

  afterEach(async () => {
    // Clean up after each test
    await dbService.clearAll();
  });

  /**
   * Document arbitrary generator
   * Generates valid document objects for property testing
   */
  const documentArb = fc.record({
    fileName: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    content: fc.string({ minLength: 0, maxLength: 1000 }),
    htmlContent: fc.string({ minLength: 0, maxLength: 1000 }),
    date: fc.date({
      min: new Date("2020-01-01"),
      max: new Date("2030-12-31"),
    }),
  });

  /**
   * Feature: doc-search-refactor, Property 9: Document List Sorting
   * Validates: Requirements 3.3
   *
   * Property: For any set of stored documents, the library view SHALL display
   * them sorted by date in descending order.
   */
  describe("Property 9: Document List Sorting", () => {
    it("should return documents sorted by date in descending order", async () => {
      await fc.assert(
        fc.asyncProperty(fc.array(documentArb, { minLength: 1, maxLength: 10 }), async (docs) => {
          const store = useDocumentStore();

          // Add all documents to the store
          for (const doc of docs) {
            await store.addDocument(doc);
          }

          // Load documents from database
          await store.loadDocuments();

          // Verify documents are sorted by date descending
          const documents = store.documents;
          for (let i = 0; i < documents.length - 1; i++) {
            const currentDate =
              documents[i]!.date instanceof Date
                ? documents[i]!.date.getTime()
                : new Date(documents[i]!.date).getTime();
            const nextDate =
              documents[i + 1]!.date instanceof Date
                ? documents[i + 1]!.date.getTime()
                : new Date(documents[i + 1]!.date).getTime();

            // Current date should be >= next date (descending order)
            expect(currentDate).toBeGreaterThanOrEqual(nextDate);
          }

          // Clean up for next iteration
          await store.clearAll();
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: doc-search-refactor, Property 10: Document Deletion Correctness
   * Validates: Requirements 3.5
   *
   * Property: For any document ID, after deletion is confirmed, querying for
   * that document SHALL return undefined.
   */
  describe("Property 10: Document Deletion Correctness", () => {
    it("should return undefined when querying a deleted document", async () => {
      await fc.assert(
        fc.asyncProperty(documentArb, async (doc) => {
          const store = useDocumentStore();

          // Add document to the store
          const id = await store.addDocument(doc);
          expect(id).toBeGreaterThan(0);

          // Verify document exists before deletion
          const beforeDelete = store.getDocumentById(id);
          expect(beforeDelete).toBeDefined();
          expect(beforeDelete!.id).toBe(id);

          // Delete the document
          await store.deleteDocument(id);

          // Verify document no longer exists in store
          const afterDeleteInStore = store.getDocumentById(id);
          expect(afterDeleteInStore).toBeUndefined();

          // Verify document no longer exists in database
          const afterDeleteInDb = await dbService.getDocumentById(id);
          expect(afterDeleteInDb).toBeUndefined();

          // Clean up for next iteration
          await store.clearAll();
        }),
        { numRuns: 100 },
      );
    });
  });
});
