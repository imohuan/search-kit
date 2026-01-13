/**
 * Feature: doc-search-refactor, Property 8: Document Persistence Round-Trip
 * Validates: Requirements 3.2, 8.1
 *
 * Property: For any valid document object, saving to IndexedDB and then
 * retrieving by ID SHALL return an equivalent document (same fileName, content, htmlContent).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import 'fake-indexeddb/auto'
import { dbService } from './db.service'
import type { Document } from '@/types'

describe('DBService - Property 8: Document Persistence Round-Trip', () => {
  beforeEach(async () => {
    // Clear database before each test
    await dbService.clearAll()
  })

  afterEach(async () => {
    // Clean up after each test
    await dbService.clearAll()
  })

  /**
   * Document arbitrary generator
   * Generates valid document objects for property testing
   */
  const documentArb = fc.record({
    fileName: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    content: fc.string({ minLength: 0, maxLength: 5000 }),
    htmlContent: fc.string({ minLength: 0, maxLength: 5000 }),
    date: fc.date({
      min: new Date('2020-01-01'),
      max: new Date('2030-12-31'),
    }),
  })

  it('should persist and retrieve document with equivalent data (round-trip)', async () => {
    await fc.assert(
      fc.asyncProperty(documentArb, async (doc) => {
        // Save document
        const id = await dbService.addDocument(doc)
        expect(id).toBeGreaterThan(0)

        // Retrieve document by ID
        const retrieved = await dbService.getDocumentById(id)

        // Verify round-trip equivalence
        expect(retrieved).toBeDefined()
        expect(retrieved!.id).toBe(id)
        expect(retrieved!.fileName).toBe(doc.fileName)
        expect(retrieved!.content).toBe(doc.content)
        expect(retrieved!.htmlContent).toBe(doc.htmlContent)

        // Date comparison (allow for serialization differences)
        const originalTime = doc.date instanceof Date ? doc.date.getTime() : new Date(doc.date).getTime()
        const retrievedTime =
          retrieved!.date instanceof Date ? retrieved!.date.getTime() : new Date(retrieved!.date).getTime()
        expect(retrievedTime).toBe(originalTime)

        // Clean up for next iteration
        await dbService.deleteDocument(id)
      }),
      { numRuns: 100 },
    )
  })
})
