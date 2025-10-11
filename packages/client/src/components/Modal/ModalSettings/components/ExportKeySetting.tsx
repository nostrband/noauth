import React, { useState } from 'react'
import { StyledButton, StyledSettingContainer } from '../styled'
import { Stack, Typography } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useParams } from 'react-router-dom'
import { client } from '@/modules/client'

export const ExportKeySetting = () => {
  const { npub = '' } = useParams<{ npub: string }>()
  const notify = useEnqueueSnackbar()
  const [exportedKey, setExportedKey] = useState('')

  const exportKey = async () => {
    if (!npub) return notify('No key identifier provided!', 'error')

    try {
      const key = await client.exportKey(npub)
      if (!key) return notify('Specify Cloud Sync password first!', 'error')

      // Try clipboard first
      try {
        await navigator.clipboard.writeText(key)
        notify('Key copied to clipboard!')
        return
      } catch (err) {
        console.warn('Clipboard failed, falling back', err)
      }

      // Show key in visible textarea fallback
      setExportedKey(key)
      notify('Safari blocked clipboard — please copy manually or use the download below.', 'warning')
    } catch (err) {
      console.error('Export failed', err)
      notify(`Failed to export key: ${err}`, 'error')
    }
  }

  const downloadKey = () => {
    if (!exportedKey) return
    const blob = new Blob([exportedKey], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exported-key-${npub.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <StyledSettingContainer>
      <Stack direction="row" justifyContent="space-between">
        <SectionTitle>Export</SectionTitle>
      </Stack>

      <Typography variant="body2" color="GrayText" sx={{ mb: 1 }}>
        Export your key encrypted with your password (NIP-49)
      </Typography>

      <StyledButton type="button" fullWidth onClick={exportKey}>
        Export key
      </StyledButton>

      {exportedKey && (
        <div style={{ marginTop: '1rem' }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Safari / Clipboard fallback:
          </Typography>
          <textarea
            readOnly
            value={exportedKey}
            style={{
              width: '100%',
              height: '100px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
            }}
            onFocus={(e) => e.target.select()}
          />
          <StyledButton onClick={downloadKey} sx={{ mt: 1 }}>
            Download Key as .txt
          </StyledButton>
        </div>
      )}
    </StyledSettingContainer>
  )
}
