import { forwardRef } from 'react'
import { Checkbox as MuiCheckbox, CheckboxProps, styled } from '@mui/material'
import { CheckedIcon, CheckedLightIcon, UnchekedIcon, UnchekedLightIcon } from '@/assets'
import { useAppSelector } from '@/store/hooks/redux'

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>((props, ref) => {
  const { themeMode } = useAppSelector((state) => state.ui)

  return <StyledCheckbox ref={ref} {...props} mode={themeMode} />
})

const StyledCheckbox = styled(
  forwardRef<HTMLButtonElement, CheckboxProps & { mode: 'dark' | 'light' }>(({ mode, ...restProps }, ref) => {
    const isDarkMode = mode === 'dark'
    return (
      <MuiCheckbox
        {...restProps}
        ref={ref}
        icon={isDarkMode ? <UnchekedLightIcon /> : <UnchekedIcon />}
        checkedIcon={isDarkMode ? <CheckedLightIcon /> : <CheckedIcon />}
      />
    )
  })
)(() => ({
  marginLeft: '-10px',
  '@media screen and (max-width: 485px)': {
    '& svg': {
      width: '24px',
      height: '24px',
    },
    padding: '7px',
  },
  '@media screen and (max-width: 320px)': {
    '& svg': {
      width: '20px',
      height: '20px',
    },
    padding: '6px',
  },
}))
