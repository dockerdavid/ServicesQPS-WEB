import { definePreset } from "@primevue/themes";
import Aura from '@primevue/themes/aura';

export const MyCustomPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#eef3ff',
            100: '#d9e4ff',
            200: '#b8ccff',
            300: '#8fafef',
            400: '#5f86e5',
            500: '#2d6cdf',
            600: '#235aa9',
            700: '#1f4b99',
            800: '#1b3f7a',
            900: '#17355e',
            950: '#0e213c'
        }
    }
});
