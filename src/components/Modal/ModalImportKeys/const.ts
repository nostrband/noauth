import * as yup from 'yup'

export const schema = yup.object().shape({
  username: yup.string().required(),
  nsec: yup.string().required(),
})

export type FormInputType = yup.InferType<typeof schema>
