import { IconButton, ListItemText } from '@mui/material'
import { StyledListItem, StyledRelaysList, StyledSettingContainer } from '../styled'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import { FC } from 'react'

const MOCK_RELAYS = [
  'wss://nos.lol/',
  'wss://nostr.land/',
  'wss://nostr.wine/',
  'wss://purplerelay.com/',
  'wss://nos.lol/',
  'wss://nostr.land/',
  'wss://nostr.wine/',
  'wss://purplerelay.com/',
]

type RelaysListProps = {
  onDeleteRelay: (relay: string) => void
}

export const RelaysList: FC<RelaysListProps> = ({ onDeleteRelay }) => {
  return (
    <StyledSettingContainer>
      <SectionTitle>List of relays</SectionTitle>
      <StyledRelaysList>
        {MOCK_RELAYS.map((relay) => {
          return (
            <StyledListItem
              key={relay}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => onDeleteRelay(relay)}>
                  <ClearRoundedIcon />
                </IconButton>
              }
            >
              <ListItemText>{relay}</ListItemText>
            </StyledListItem>
          )
        })}
      </StyledRelaysList>
    </StyledSettingContainer>
  )
}
