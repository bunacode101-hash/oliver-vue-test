import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '@/App.vue'
import { useAuthStore } from '@/stores/useAuthStore'

describe('App.vue', () => {
  let auth

  beforeEach(() => {
    setActivePinia(createPinia())
    auth = useAuthStore()
  })

  it('simulates vendor role correctly', () => {
    auth.simulateRole('vendor', { onboardingPassed: true, kycPassed: true })
    expect(auth.simulate.role).toBe('vendor')
    expect(auth.simulate.onboardingPassed).toBe(true)
  })

  it('mounts without crashing', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()]
      }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
