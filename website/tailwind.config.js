/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // NEURAL NETWORK - Future AI Color Palette (2025+)
        'neural': {
          // Primary AI Intelligence - Electric Blue
          'primary': '#00d4ff',
          'primary-light': '#4adeff',
          'primary-dark': '#0284c7',
          'primary-glow': 'rgba(0, 212, 255, 0.1)',

          // Secondary Neural - Quantum Purple
          'secondary': '#a855f7',
          'secondary-light': '#c084fc',
          'secondary-dark': '#7c3aed',
          'secondary-glow': 'rgba(168, 85, 247, 0.1)',

          // Success State - Neon Green
          'success': '#00ff88',
          'success-light': '#4ade80',
          'success-dark': '#16a34a',

          // Warning State - Electric Orange
          'warning': '#ff6b35',
          'warning-light': '#fb923c',
          'warning-dark': '#ea580c',

          // Error State - Cyber Red
          'error': '#ff006e',
          'error-light': '#f472b6',
          'error-dark': '#be185d',

          // Neutral Palette - Future Dark Mode
          'black': '#000000',
          'gray-900': '#0f0f0f',
          'gray-800': '#1a1a1a',
          'gray-700': '#2a2a2a',
          'gray-600': '#3a3a3a',
          'gray-500': '#6b7280',
          'gray-400': '#9ca3af',
          'gray-300': '#d1d5db',
          'gray-200': '#e5e7eb',
          'gray-100': '#f3f4f6',
          'white': '#ffffff',

          // Glass Morphism Colors
          'glass-light': 'rgba(255, 255, 255, 0.05)',
          'glass-medium': 'rgba(255, 255, 255, 0.08)',
          'glass-heavy': 'rgba(255, 255, 255, 0.12)',
          'glass-border': 'rgba(255, 255, 255, 0.1)',
        },

        // Neural Network Pattern Colors
        'synapse': {
          'active': '#00d4ff',
          'inactive': 'rgba(0, 212, 255, 0.2)',
          'pulse': 'rgba(0, 212, 255, 0.6)',
        },

        // Quantum Effects
        'quantum': {
          'field': 'rgba(168, 85, 247, 0.05)',
          'particle': 'rgba(0, 212, 255, 0.8)',
          'entanglement': 'rgba(0, 255, 136, 0.3)',
        }
      },

      backgroundImage: {
        // Neural Network Patterns
        'neural-web': 'radial-gradient(circle at 25% 25%, rgba(0, 212, 255, 0.1) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 1px, transparent 1px)',
        'quantum-field': 'conic-gradient(from 0deg at 50% 50%, rgba(0, 212, 255, 0.1), rgba(168, 85, 247, 0.1), rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))',
        'ai-gradient': 'linear-gradient(135deg, #000000 0%, #0f0f0f 25%, #1a1a1a 50%, #0f0f0f 75%, #000000 100%)',

        // Glass Morphism Gradients
        'glass-primary': 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(168, 85, 247, 0.1))',
        'glass-secondary': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',

        // Holographic Effects (Modern)
        'holo-surface': 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
        'holo-border': 'linear-gradient(90deg, rgba(0, 212, 255, 0.5), rgba(168, 85, 247, 0.5), rgba(0, 212, 255, 0.5))',
      },

      backgroundSize: {
        'neural-small': '20px 20px',
        'neural-medium': '40px 40px',
        'neural-large': '80px 80px',
      },

      boxShadow: {
        // Glass Morphism Shadows
        'glass-subtle': '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-medium': '0 16px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-strong': '0 24px 64px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1)',

        // Neural Glow Effects
        'neural-primary': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.1)',
        'neural-secondary': '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.1)',
        'neural-success': '0 0 20px rgba(0, 255, 136, 0.3), 0 0 40px rgba(0, 255, 136, 0.1)',

        // Quantum Field Effects
        'quantum-field': 'inset 0 0 50px rgba(168, 85, 247, 0.05), 0 0 100px rgba(0, 212, 255, 0.1)',
        'quantum-pulse': '0 0 30px rgba(0, 212, 255, 0.4), 0 0 60px rgba(168, 85, 247, 0.2), inset 0 0 30px rgba(0, 255, 136, 0.1)',

        // Future UI Effects
        'future-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 -2px 4px rgba(255, 255, 255, 0.05)',
        'future-outset': '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 212, 255, 0.08)',
      },

      backdropBlur: {
        'glass': '20px',
        'glass-strong': '32px',
        'neural': '16px',
      },

      fontFamily: {
        'neural': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'mono-neural': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'display': ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      },

      animation: {
        // Neural Network Animations
        'synapse-pulse': 'synapse-pulse 2s ease-in-out infinite',
        'neural-flow': 'neural-flow 3s linear infinite',
        'quantum-float': 'quantum-float 6s ease-in-out infinite',
        'ai-glow': 'ai-glow 4s ease-in-out infinite',

        // Glass Morphism Animations
        'glass-shimmer': 'glass-shimmer 3s ease-in-out infinite',
        'holo-breathe': 'holo-breathe 4s ease-in-out infinite',

        // Future UI Interactions
        'future-hover': 'future-hover 0.3s ease-out',
        'future-press': 'future-press 0.15s ease-out',
      },

      keyframes: {
        'synapse-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' }
        },
        'neural-flow': {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' }
        },
        'quantum-float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' }
        },
        'ai-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.4), 0 0 80px rgba(0, 212, 255, 0.2)' }
        },
        'glass-shimmer': {
          '0%, 100%': { backgroundPosition: '-200% 0' },
          '50%': { backgroundPosition: '200% 0' }
        },
        'holo-breathe': {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' }
        },
        'future-hover': {
          '0%': { transform: 'translateY(0)', boxShadow: 'var(--tw-ring-offset-shadow), var(--tw-ring-shadow)' },
          '100%': { transform: 'translateY(-2px)', boxShadow: '0 20px 40px rgba(0, 212, 255, 0.15)' }
        },
        'future-press': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.98)' }
        }
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },

      borderRadius: {
        'neural': '1rem',
        'glass': '1.5rem',
        'quantum': '0.75rem',
      },

      ringColor: {
        'neural-primary': 'rgba(0, 212, 255, 0.5)',
        'neural-secondary': 'rgba(168, 85, 247, 0.5)',
      }
    },
  },
  plugins: [],
}
