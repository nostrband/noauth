import React from 'react'
import { StyledButton, StyledSettingContainer } from '../styled'
import { Stack, Typography } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { useCopyToClipboard } from 'usehooks-ts'
import { useParams } from 'react-router-dom'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { client } from '@/modules/client'

export const ExportKeySetting = () => {
  const { npub = '' } = useParams<{ npub: string }>()
  const [, copyToClipboard] = useCopyToClipboard()
  const notify = useEnqueueSnackbar()

  const exportKey = async () => {
    try {
      const key = await client.exportKey(npub)
      if (!key) notify('Specify Cloud Sync password first!', 'error')
      else if (await copyToClipboard(key)) notify('Key copied to clipboard!')
      else notify('Failed to copy to clipboard', 'error')
    } catch (error) {
      console.log('error', error)
      notify(`Failed to copy to clipboard: ${error}`, 'error')
    }
  }
  return (
    <StyledSettingContainer>
      <Stack direction={'row'} justifyContent={'space-between'}>
        <SectionTitle>Export</SectionTitle>
      </Stack>
      <Typography variant="body2" color={'GrayText'}>
        Export your key encrypted with your password (NIP-49)
      </Typography>
      <StyledButton type="button" fullWidth onClick={exportKey}>
        Export key
      </StyledButton>
    </StyledSettingContainer>
  )
}
