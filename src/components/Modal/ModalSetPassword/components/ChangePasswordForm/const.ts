import * as yup from 'yup'

export const schema = yup.object().shape({
  existingPassword: yup.string().required('Please fill out all fields'),
  password: yup.string().required('Please fill out all fields'),
  rePassword: yup
    .string()
    .required('Please fill out all fields')
    .oneOf([yup.ref('password'), ''], 'Passwords must match'),
})

export type FormInputType = yup.InferType<typeof schema>
