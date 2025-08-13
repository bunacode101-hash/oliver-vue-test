// src/__tests__/auth.spec.js
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/useAuthStore'

describe('Auth Store', () => {
  let auth

  beforeEach(() => {
    setActivePinia(createPinia())
    auth = useAuthStore()
  })

  it('sets simulate role correctly', () => {
    auth.simulateRole('creator', { onboardingPassed: true })
    expect(auth.simulate.role).toBe('creator')
    expect(auth.simulate.onboardingPassed).toBe(true)
  })

  it('updates current user attributes', () => {
    auth.currentUser = { email: 'test@test.com', kycPassed: false }
    auth.updateUserAttributesLocally({ kycPassed: true })
    expect(auth.currentUser.kycPassed).toBe(true)
  })

  it('clears state on logout', () => {
    auth.simulateRole('creator')
    auth.logout()
    expect(auth.simulate).toBe(null)
    expect(auth.currentUser).toBe(null)
  })
})
