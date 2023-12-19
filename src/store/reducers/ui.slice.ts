import { createSlice } from '@reduxjs/toolkit'

type ThemeMode = 'light' | 'dark'

export interface UIState {
	themeMode: ThemeMode
}

const initialState: UIState = {
	themeMode: 'light',
}

export const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		setThemeMode: (state, action) => {
			state.themeMode = action.payload.mode
		},
	},
})

export const { setThemeMode } = uiSlice.actions
