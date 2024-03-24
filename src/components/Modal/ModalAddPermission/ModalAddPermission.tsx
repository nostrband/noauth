import React, { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getUsablePermList, isEmptyString } from '@/utils/helpers/helpers'
import { MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { useAppSelector } from '@/store/hooks/redux'
import { selectApps } from '@/store'
import { useParams } from 'react-router-dom'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'

export const ModalAddPermission: FC = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.ADD_PERMISSION)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.ADD_PERMISSION)

  const { npub = '', appNpub = '' } = useParams()
  const apps = useAppSelector(selectApps)
  const notify = useEnqueueSnackbar()

  const [type, setType] = useState('')
  const [param, setParam] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const permOptions = getUsablePermList()

  const handleSelectType = (e: SelectChangeEvent<string>) => {
    setType(e.target.value)
  }

  const handleChangeParam = (e: ChangeEvent<HTMLInputElement>) => {
    setParam(e.target.value)
  }

  const resetStates = () => {
    setType('')
    setParam('')
    setIsLoading(false)
  }

  const isFormValid = !isEmptyString(param) && !!type

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid) throw new Error('Please fill out all fields!')
    setIsLoading(true)
    try {
      const kindOrParam = type === 'sign_event' ? Number(param) : param
      const permission = `${type}:${kindOrParam}`
      await swicCall('addPerm', appNpub, npub, permission)
      setIsLoading(false)
      notify('Permission successfully added!', 'success')
      resetStates()
      handleCloseModal()
    } catch (error: any) {
      notify(error?.message || 'Failed to add a permission', 'error')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (isModalOpened) resetStates() // modal closed
    }
  }, [isModalOpened])

  const isAppNpubExists = appNpub.trim().length && apps.some((app) => app.appNpub === appNpub && app.npub === npub)

  if (isModalOpened && !isAppNpubExists) {
    handleCloseModal()
    return null
  }

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} title="Add a permission" fixedHeight="50%">
      <Stack gap={'1rem'} minHeight={'40%'} component={'form'} onSubmit={handleSubmit}>
        <Select
          onChange={handleSelectType}
          value={type}
          input={<Input fullWidth label="Type" />}
          endAdornment={<ArrowDropDownIcon htmlColor="white" />}
          displayEmpty
          renderValue={(value: string) =>
            value || (
              <Typography variant="body2" color={'GrayText'}>
                Select a permission type
              </Typography>
            )
          }
        >
          {permOptions.map((permOption) => {
            return <MenuItem value={permOption}>{permOption}</MenuItem>
          })}
        </Select>

        <Input
          fullWidth
          placeholder="Enter a additional param"
          label="Additional param"
          onChange={handleChangeParam}
          value={param}
        />

        <Button type="submit" fullWidth sx={{ marginTop: '1rem' }} disabled={!isFormValid || isLoading}>
          Add {isLoading && <LoadingSpinner />}
        </Button>
      </Stack>
    </Modal>
  )
}
