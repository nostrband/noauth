import { createTheme, Theme } from '@mui/material'

// declare module '@mui/material/styles' {
// 	interface Palette {
// 		light: Palette['primary']
// 		decorate: Palette['primary']
// 		actionPrimary: Palette['primary']
// 		textPrimaryDecorate: Palette['primary']
// 		textSecondaryDecorate: Palette['primary']
// 	}

// 	interface PaletteOptions {
// 		light?: Palette['primary']
// 		decorate?: Palette['primary']
// 		actionPrimary?: Palette['primary']
// 		textPrimaryDecorate?: Palette['primary']
// 		textSecondaryDecorate?: Palette['primary']
// 	}
// }

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
			main: '#9c27b0',
			light: '#00000029',
			dark: '#333333',
		},
		error: {
			main: '#f44336',
		},
		background: {
			default: '#f7f7f7',
			paper: '#f7f7f7',
		},
		text: {
			primary: '#333333',
			secondary: '#757575',
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
			main: '#f48fb1',
			light: '#FFFFFF29',
			dark: '#333333A8',
		},
		error: {
			main: '#ef9a9a',
		},
		background: {
			default: '#121212',
			paper: '#28282B',
		},
		text: {
			primary: '#ffffff',
			secondary: '#b3b3b3',
		},
	},
})

console.log({ lightTheme, darkTheme })

export { lightTheme, darkTheme }
