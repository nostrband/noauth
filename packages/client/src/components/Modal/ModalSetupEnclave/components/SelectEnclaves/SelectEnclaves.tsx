import { FC, MouseEvent, useRef, useState } from 'react'
import { Divider, IconButton, Menu, MenuItem, Stack } from '@mui/material'
import { EnclaveCard } from '../EnclaveCard/EnclaveCard'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import { IEnclave } from '../../types'
import { useResizeObserver } from 'usehooks-ts'

type SelectEnclavesProps = {
  onChange: (id: string) => void
  enclaves: IEnclave[]
  defaultValue?: IEnclave
}

export const SelectEnclaves: FC<SelectEnclavesProps> = ({ onChange, enclaves, defaultValue }) => {
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
        {defaultValue && <EnclaveCard fullWidth {...defaultValue} />}
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
          <MenuItem sx={{ width: width }} key={option.event.id} onClick={(event) => handleChange(option)}>
            <Stack width={'100%'}>
              <EnclaveCard fullWidth {...option} />
              <Divider />
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
