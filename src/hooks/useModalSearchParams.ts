import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { useCallback } from 'react'
import {
	createSearchParams,
	useLocation,
	useNavigate,
	useSearchParams,
} from 'react-router-dom'

type SearchParamsType = {
	[key: string]: string
}

export type IExtraOptions = {
	search?: SearchParamsType
	replace?: boolean
	append?: boolean
}

export const useModalSearchParams = () => {
	const [searchParams, setSearchParams] = useSearchParams()

	const location = useLocation()
	const navigate = useNavigate()

	const getEnumParam = useCallback((modal: MODAL_PARAMS_KEYS) => {
		return Object.values(MODAL_PARAMS_KEYS)[
			Object.values(MODAL_PARAMS_KEYS).indexOf(modal)
		]
	}, [])

	const handleClose =
		(modal: MODAL_PARAMS_KEYS, onClose?: (s: URLSearchParams) => void) =>
		() => {
			const enumKey = getEnumParam(modal)
			searchParams.delete(enumKey)
			onClose && onClose(searchParams)
			setSearchParams(searchParams)
		}

	const handleOpen = useCallback(
		(modal: MODAL_PARAMS_KEYS, extraOptions?: IExtraOptions) => {
			const enumKey = getEnumParam(modal)

			let searchParamsData: SearchParamsType = { [enumKey]: 'true' }
			if (extraOptions?.search) {
				searchParamsData = {
					...searchParamsData,
					...extraOptions.search,
				}
			}

			const searchString = !extraOptions?.append
				? createSearchParams(searchParamsData).toString()
				: `${location.search}&${createSearchParams(
						searchParamsData,
				  ).toString()}`

			navigate(
				{
					pathname: location.pathname,
					search: searchString,
				},
				{ replace: extraOptions?.replace || true },
			)
		},
		[location, navigate, getEnumParam],
	)

	const getModalOpened = useCallback(
		(modal: MODAL_PARAMS_KEYS) => {
			const enumKey = getEnumParam(modal)
			const modalOpened = searchParams.get(enumKey) === 'true'
			return modalOpened
		},
		[getEnumParam, searchParams],
	)

	return {
		getModalOpened,
		handleClose,
		handleOpen,
	}
}
