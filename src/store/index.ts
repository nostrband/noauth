import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { contentSlice } from './reducers/content.slice'
import { uiSlice } from './reducers/ui.slice'

import {
	persistStore,
	persistReducer,
	// FLUSH,
	// REGISTER,
	// REHYDRATE,
	// PAUSE,
	// PERSIST,
	// PURGE,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web
import memoizeOne from 'memoize-one'
import isDeepEqual from 'lodash.isequal'

const persistConfig = {
	key: 'root',
	storage,
	whiteList: [uiSlice.name],
}

const rootReducer = combineReducers({
	[contentSlice.name]: contentSlice.reducer,
	[uiSlice.name]: uiSlice.reducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const selectKeys = (state: RootState) => state.content.keys

export const selectAppsByNpub = memoizeOne((state: RootState, npub: string) => {
	return state.content.apps.filter((app) => app.npub === npub)
}, isDeepEqual)

export const selectPermsByNpub = memoizeOne(
	(state: RootState, npub: string) => {
		return state.content.perms.filter((perm) => perm.npub === npub)
	},
	isDeepEqual,
)
