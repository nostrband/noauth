import * as yup from 'yup'

export const schema = yup.object().shape({
	username: yup
		.string()
		.test('Domain validation', 'The domain is required!', function (value) {
			if (!value || !value.trim().length) return false

			const USERNAME_WITH_DOMAIN_REGEXP = new RegExp(
				/^[\w-.]+@([\w-]+\.)+[\w-]{2,8}$/g,
			)
			return USERNAME_WITH_DOMAIN_REGEXP.test(value)
		})
		.required(),
	password: yup.string().required(),
})

export type FormInputType = yup.InferType<typeof schema>
