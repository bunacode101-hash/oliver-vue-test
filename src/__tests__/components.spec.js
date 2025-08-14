import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '@/App.vue'
import LogIn from '@/components/auth/log-in.vue'
import DashboardOverviewCreator from '@/components/dashboard/dashboardOverviewCreator.vue'

describe('Components', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('App mounts without crashing', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        stubs: ['router-view'] // avoid router-view error
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('LogIn page renders', () => {
    const wrapper = mount(LogIn, {
      global: {
        plugins: [pinia]
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('DashboardOverviewCreator renders', () => {
    const wrapper = mount(DashboardOverviewCreator, {
      global: {
        plugins: [pinia]
      }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
