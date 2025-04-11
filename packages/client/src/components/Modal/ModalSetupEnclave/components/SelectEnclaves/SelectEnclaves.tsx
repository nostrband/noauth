import { FC, MouseEvent, useRef, useState } from 'react'
import { Divider, IconButton, Menu, MenuItem, Stack } from '@mui/material'
import { EnclaveCard } from '../EnclaveCard/EnclaveCard'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import { IEnclave } from '../../types'
import { useResizeObserver } from 'usehooks-ts'

type SelectEnclavesProps = {
  onChange: (id: string) => void
  value: IEnclave
  enclaves: IEnclave[]
}

export const SelectEnclaves: FC<SelectEnclavesProps> = ({ onChange, enclaves, value }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const ref = useRef<HTMLDivElement>(null)
  const { width = 0 } = useResizeObserver({
    ref,
    box: 'border-box',
  })

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleChange = (option: IEnclave) => {
    onChange(option.event.id)
    handleClose()
  }

  console.log('defaultValue', value)
  console.log('enclaves', enclaves)
  return (
    <>
      <Stack
        onClick={handleOpenMenu}
        border={'1px solid gray'}
        pr={'0.5rem'}
        borderRadius={'8px'}
        direction={'row'}
        alignItems={'center'}
        ref={ref}
      >
        <EnclaveCard fullWidth {...value} />
        <IconButton>
          <ExpandMoreOutlinedIcon fontSize="large" />
        </IconButton>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        {enclaves.map((option) => (
          <MenuItem
            selected={value.event.id === option.event.id}
            sx={{ width: width }}
            key={option.event.id}
            onClick={() => handleChange(option)}
          >
            <Stack width={'100%'}>
              <EnclaveCard fullWidth noPing={true} noLinkToExplorer={true} {...option} />
              <Divider />
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
