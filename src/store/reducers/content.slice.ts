import { createSlice } from '@reduxjs/toolkit'
import { DbApp, DbKey, DbPerm, DbPending } from '../../modules/db'

export interface IContentState {
  keys: DbKey[]
  apps: DbApp[]
  perms: DbPerm[]
  pending: DbPending[]
}

const initialState: IContentState = {
  keys: [],
  apps: [],
  perms: [],
  pending: [],
}

export const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setKeys: (state, action) => {
      state.keys = action.payload.keys
    },
    setApps: (state, action) => {
      state.apps = action.payload.apps
    },
    setPerms: (state, action) => {
      state.perms = action.payload.perms
    },
    setPending: (state, action) => {
      state.pending = action.payload.pending
    },
  },
})

export const { setKeys, setApps, setPerms, setPending } = contentSlice.actions
