import * as yup from 'yup'

export const schema = yup.object().shape({
  username: yup.string().required(),
  nsec: yup.string().required(),
  password: yup.string().required(),
  rePassword: yup
    .string()
    .required('This is required field')
    .oneOf([yup.ref('password'), ''], 'Passwords must match'),
})

export type FormInputType = yup.InferType<typeof schema>
