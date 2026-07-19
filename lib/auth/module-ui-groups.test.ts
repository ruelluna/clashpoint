import { describe, expect, it } from 'vitest'

import { ALL_MODULE_IDS } from '@/lib/auth/modules'
import {
  MODULE_EVENT_TAB_ACCESS_IDS,
  MODULE_PAGE_ACCESS_IDS,
  getEventTabAccessModules,
  getPageAccessModules,
} from '@/lib/auth/module-ui-groups'

describe('module-ui-groups', () => {
  it('assigns every module to exactly one section', () => {
    const pageIds = new Set(MODULE_PAGE_ACCESS_IDS)
    const tabIds = new Set(MODULE_EVENT_TAB_ACCESS_IDS)

    for (const id of MODULE_PAGE_ACCESS_IDS) {
      expect(tabIds.has(id)).toBe(false)
    }

    for (const id of MODULE_EVENT_TAB_ACCESS_IDS) {
      expect(pageIds.has(id)).toBe(false)
    }

    const combined = [...MODULE_PAGE_ACCESS_IDS, ...MODULE_EVENT_TAB_ACCESS_IDS]
    expect(new Set(combined).size).toBe(combined.length)
    expect(combined).toHaveLength(ALL_MODULE_IDS.length)
    expect([...combined].sort()).toEqual([...ALL_MODULE_IDS].sort())
  })

  it('returns stable module lists with labels', () => {
    expect(getPageAccessModules()).toHaveLength(MODULE_PAGE_ACCESS_IDS.length)
    expect(getEventTabAccessModules()).toHaveLength(MODULE_EVENT_TAB_ACCESS_IDS.length)

    for (const mod of getPageAccessModules()) {
      expect(mod.label.length).toBeGreaterThan(0)
    }

    for (const mod of getEventTabAccessModules()) {
      expect(mod.label.length).toBeGreaterThan(0)
    }
  })
})
