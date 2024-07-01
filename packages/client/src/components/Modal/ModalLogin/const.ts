import * as yup from 'yup'

export const schema = yup.object().shape({
  username: yup.string().required(),
  password: yup.string().required().min(4),
})

export type FormInputType = yup.InferType<typeof schema>
