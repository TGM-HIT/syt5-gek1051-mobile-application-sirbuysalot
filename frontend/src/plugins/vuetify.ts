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
          primary: '#1B6B4A',
          'primary-darken-1': '#145238',
          secondary: '#C8963E',
          accent: '#E8734A',
          success: '#2D9F6F',
          warning: '#E5A630',
          error: '#D44545',
          info: '#3B82A0',
          background: '#F7F6F3',
          surface: '#FFFFFF',
          'surface-variant': '#F0EEEA',
          'on-background': '#1C2520',
          'on-surface': '#1C2520',
        },
      },
      dark: {
        colors: {
          primary: '#3DA876',
          'primary-darken-1': '#2D8A5E',
          secondary: '#D4A84B',
          accent: '#F08A64',
          success: '#45B882',
          warning: '#F0B840',
          error: '#E06060',
          info: '#5BA8C8',
          background: '#151A17',
          surface: '#1C2420',
          'surface-variant': '#243028',
          'on-background': '#E8E6E1',
          'on-surface': '#E8E6E1',
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
