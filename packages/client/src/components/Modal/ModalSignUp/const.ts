import * as yup from 'yup'

export const schema = yup.object().shape({
  username: yup.string().required('Required field'),
  password: yup.string().required('Required field'),
  rePassword: yup
    .string()
    .required('Please fill out all fields')
    .oneOf([yup.ref('password'), ''], 'Passwords must match'),
})

export type FormInputType = yup.InferType<typeof schema>
