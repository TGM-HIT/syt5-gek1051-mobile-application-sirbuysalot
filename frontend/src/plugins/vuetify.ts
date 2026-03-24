import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#4A90D9',
          'primary-darken-1': '#357ABD',
          secondary: '#6C63FF',
          accent: '#FF6B6B',
          success: '#2ECC71',
          warning: '#F39C12',
          error: '#E74C3C',
          info: '#3498DB',
          background: '#F5F7FA',
          surface: '#FFFFFF',
          'surface-variant': '#F0F2F5',
          'on-background': '#2C3E50',
          'on-surface': '#2C3E50',
        },
      },
      dark: {
        colors: {
          primary: '#5B9FE6',
          'primary-darken-1': '#4A90D9',
          secondary: '#7C75FF',
          accent: '#FF8A80',
          success: '#4CD964',
          warning: '#FFD60A',
          error: '#FF6B6B',
          info: '#64B5F6',
          background: '#1A1A2E',
          surface: '#16213E',
          'surface-variant': '#1F2B47',
          'on-background': '#E8E8E8',
          'on-surface': '#E8E8E8',
        },
      },
    },
  },
  defaults: {
    VBtn: { variant: 'flat', rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable', rounded: 'lg' },
    VCard: { rounded: 'xl', elevation: 0 },
    VDialog: { transition: 'dialog-bottom-transition' },
    VChip: { rounded: 'lg' },
  },
})
