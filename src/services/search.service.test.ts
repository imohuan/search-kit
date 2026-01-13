/**
 * Feature: doc-search-refactor - Search Engine Property Tests
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { SearchService } from './search.service'
import type { SearchResult } from '@/types'

const searchService = new SearchService()

/**
 * Feature: doc-search-refactor, Property 1: Interval Search Correctness
 * Validates: Requirements 2.1, 2.6
 *
 * Property: For any search query and document content, when performing interval search,
 * all returned matches SHALL have characters appearing in the same order as the query
 * with gaps not exceeding maxGap.
 */
describe('SearchService - Property 1: Interval Search Correctness', () => {
  // Generator for non-empty search queries
  const queryArb = fc
    .string({ minLength: 1, maxLength: 10 })
    .filter((s) => s.trim().length > 0 && !/[\s]/.test(s))

  // Generator for document content
  const contentArb = fc.string({ minLength: 1, maxLength: 500 })

  // Generator for maxGap (reasonable range)
  const maxGapArb = fc.integer({ min: 0, max: 50 })

  it('should return matches with characters in correct order and within maxGap', async () => {
    await fc.assert(
      fc.property(queryArb, contentArb, maxGapArb, (query, content, maxGap) => {
        const matches = searchService.findMatches(content, query, {
          maxGap,
          isExact: false,
          previewRange: 30,
        })

        for (const match of matches) {
          // Verify positions array has same length as query
          expect(match.positions.length).toBe(query.length)

          // Verify characters at positions match query characters (case-insensitive)
          for (let i = 0; i < query.length; i++) {
            const pos = match.positions[i]!
            const contentChar = content[pos]?.toLowerCase()
            const queryChar = query[i]?.toLowerCase()
            expect(contentChar).toBe(queryChar)
          }

          // Verify positions are in ascending order
          for (let i = 1; i < match.positions.length; i++) {
            expect(match.positions[i]).toBeGreaterThan(match.positions[i - 1]!)
          }

          // Verify gaps between consecutive positions don't exceed maxGap
          for (let i = 1; i < match.positions.length; i++) {
            const gap = match.positions[i]! - match.positions[i - 1]! - 1
            expect(gap).toBeLessThanOrEqual(maxGap)
          }
        }
      }),
      { numRuns: 100 },
    )
  })
})

/**
 * Feature: doc-search-refactor, Property 2: Exact Search Uniqueness
 * Validates: Requirements 2.2
 *
 * Property: For any search query and document content, when exact search mode is enabled,
 * the returned matches SHALL be unique (no duplicate positions) and each match SHALL be
 * a continuous substring.
 */
describe('SearchService - Property 2: Exact Search Uniqueness', () => {
  // Generator for non-empty search queries
  const queryArb = fc
    .string({ minLength: 1, maxLength: 10 })
    .filter((s) => s.trim().length > 0)

  // Generator for document content that may contain the query
  const contentArb = fc.string({ minLength: 1, maxLength: 500 })

  it('should return unique, non-overlapping continuous matches in exact mode', async () => {
    await fc.assert(
      fc.property(queryArb, contentArb, (query, content) => {
        const matches = searchService.findMatches(content, query, {
          maxGap: 30,
          isExact: true,
          previewRange: 30,
        })

        // Collect all match start positions
        const startPositions = matches.map((m) => m.index)

        // Verify no duplicate start positions
        const uniquePositions = new Set(startPositions)
        expect(uniquePositions.size).toBe(startPositions.length)

        // Verify matches don't overlap
        for (let i = 0; i < matches.length; i++) {
          for (let j = i + 1; j < matches.length; j++) {
            const match1 = matches[i]!
            const match2 = matches[j]!
            // Matches should not overlap
            const end1 = match1.index + match1.length
            const end2 = match2.index + match2.length
            expect(match1.index >= end2 || match2.index >= end1).toBe(true)
          }
        }

        // Verify each match is a continuous substring matching the query
        for (const match of matches) {
          expect(match.length).toBe(query.length)
          const matchedText = content.slice(match.index, match.index + match.length)
          expect(matchedText.toLowerCase()).toBe(query.toLowerCase())

          // Verify positions are consecutive
          for (let i = 0; i < match.positions.length; i++) {
            expect(match.positions[i]).toBe(match.index + i)
          }
        }
      }),
      { numRuns: 100 },
    )
  })
})

/**
 * Feature: doc-search-refactor, Property 3: Search Results Sorting
 * Validates: Requirements 2.3
 *
 * Property: For any set of search results, the results SHALL be sorted by matchLength
 * in ascending order (tightest matches first).
 */
describe('SearchService - Property 3: Search Results Sorting', () => {
  // Generator for search results
  const searchResultArb = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    fileName: fc.string({ minLength: 1, maxLength: 50 }),
    content: fc.string({ minLength: 1, maxLength: 200 }),
    matchIndex: fc.integer({ min: 0, max: 100 }),
    matchLength: fc.integer({ min: 1, max: 100 }),
    highlightedSnippet: fc.string({ minLength: 1, maxLength: 200 }),
  })

  const searchResultsArb = fc.array(searchResultArb, { minLength: 0, maxLength: 50 })

  it('should sort results by matchLength in ascending order', async () => {
    await fc.assert(
      fc.property(searchResultsArb, (results: SearchResult[]) => {
        const sorted = searchService.sortResults(results)

        // Verify sorted array has same length
        expect(sorted.length).toBe(results.length)

        // Verify ascending order by matchLength
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i]!.matchLength).toBeGreaterThanOrEqual(sorted[i - 1]!.matchLength)
        }

        // Verify all original elements are present (same set of matchLengths)
        const originalLengths = results.map((r) => r.matchLength).sort((a, b) => a - b)
        const sortedLengths = sorted.map((r) => r.matchLength)
        expect(sortedLengths).toEqual(originalLengths)
      }),
      { numRuns: 100 },
    )
  })
})

/**
 * Feature: doc-search-refactor, Property 4: Search Highlight Correctness
 * Validates: Requirements 2.4
 *
 * Property: For any search result snippet, the highlighted HTML SHALL contain mark tags
 * around exactly the matched character positions.
 */
describe('SearchService - Property 4: Search Highlight Correctness', () => {
  // Generator for text content
  const textArb = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0)

  // Generator for search queries
  const queryArb = fc
    .string({ minLength: 1, maxLength: 10 })
    .filter((s) => s.trim().length > 0 && !/[\s]/.test(s))

  it('should highlight exact matches with mark tags in exact mode', async () => {
    await fc.assert(
      fc.property(textArb, queryArb, (text, query) => {
        const highlighted = searchService.highlightText(text, query, true)

        // Count occurrences of query in text (case-insensitive)
        const lowerText = text.toLowerCase()
        const lowerQuery = query.toLowerCase()
        let count = 0
        let pos = 0
        while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
          count++
          pos += query.length
        }

        // Count mark tags in highlighted output
        const markCount = (highlighted.match(/<mark>/g) || []).length
        const markEndCount = (highlighted.match(/<\/mark>/g) || []).length

        // Should have equal opening and closing tags
        expect(markCount).toBe(markEndCount)

        // Number of mark tags should equal number of matches
        expect(markCount).toBe(count)
      }),
      { numRuns: 100 },
    )
  })

  it('should highlight query characters with mark tags in interval mode', async () => {
    await fc.assert(
      fc.property(textArb, queryArb, (text, query) => {
        const highlighted = searchService.highlightText(text, query, false)

        // Get unique query characters (lowercase)
        const queryChars = new Set(query.toLowerCase().split(''))

        // Count characters in text that match query characters
        let expectedHighlightCount = 0
        for (const char of text) {
          if (queryChars.has(char.toLowerCase())) {
            expectedHighlightCount++
          }
        }

        // Count mark tags in highlighted output
        const markCount = (highlighted.match(/<mark>/g) || []).length
        const markEndCount = (highlighted.match(/<\/mark>/g) || []).length

        // Should have equal opening and closing tags
        expect(markCount).toBe(markEndCount)

        // Number of mark tags should equal number of matching characters
        expect(markCount).toBe(expectedHighlightCount)
      }),
      { numRuns: 100 },
    )
  })
})
