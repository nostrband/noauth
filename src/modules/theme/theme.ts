import { createTheme, Theme } from '@mui/material'

declare module '@mui/material/styles' {
	interface Palette {
		textSecondaryDecorate: Palette['primary']
		backgroundSecondary: Palette['background']
	}

	interface PaletteOptions {
		textSecondaryDecorate?: Palette['primary']
		backgroundSecondary?: Palette['background']
	}
}

const commonTheme: Theme = createTheme({
	typography: {
		fontFamily: ['Inter', 'sans-serif'].join(','),
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					textTransform: 'initial',
				},
			},
		},
	},
})

const lightTheme: Theme = createTheme({
	...commonTheme,
	palette: {
		mode: 'light',
		primary: {
			main: '#000000',
		},
		secondary: {
			main: '#E8E9EB',
			dark: '#ACACAC',
		},
		error: {
			main: '#f44336',
		},
		background: {
			default: '#f7f7f7',
			paper: '#f7f7f7',
		},
		backgroundSecondary: {
			default: '#E8E9EB',
			paper: '#f7f7f7',
		},
		text: {
			primary: '#000000',
			secondary: '#ffffff',
		},
		textSecondaryDecorate: {
			main: '#6b6b6b',
			light: '#000',
			dark: '#000',
			contrastText: '#000',
		},
	},
})

const darkTheme: Theme = createTheme({
	...commonTheme,
	palette: {
		mode: 'dark',
		primary: {
			main: '#FFFFFF',
		},
		secondary: {
			main: '#222222',
		},
		error: {
			main: '#ef9a9a',
		},
		background: {
			default: '#121212',
			paper: '#28282B',
		},
		backgroundSecondary: {
			default: '#0d0d0d',
			paper: '#28282B',
		},
		text: {
			primary: '#ffffff',
			secondary: '#000000',
		},
		textSecondaryDecorate: {
			main: '#6b6b6b',
			light: '#000',
			dark: '#000',
			contrastText: '#000',
		},
	},
})

export { lightTheme, darkTheme }
