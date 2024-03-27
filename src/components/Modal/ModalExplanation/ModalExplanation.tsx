import { FC } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { EXPLANATION_MODAL_KEYS, MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { useSearchParams } from 'react-router-dom'

type ModalExplanationProps = {
  explanationText?: string
}

export const ModalExplanation: FC<ModalExplanationProps> = () => {
  const { getModalOpened } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.EXPLANATION)
  const [searchParams, setSearchParams] = useSearchParams()

  const handleCloseModal = () => {
    searchParams.delete('type')
    searchParams.delete(MODAL_PARAMS_KEYS.EXPLANATION)
    setSearchParams(searchParams, { replace: true })
  }

  const type = searchParams.get('type')

  let title = ''
  let explanationText
  switch (type) {
    case EXPLANATION_MODAL_KEYS.NPUB: {
      title = 'What is NPUB?'
      explanationText = (
        <>
          NPUB is your Nostr PUBlic key.
          <br />
          <br />
          It is your global unique identifier on the Nostr network, and is derived from your private key.
          <br />
          <br />
          You can share your NPUB with other people so that they could unambiguously find you on the network.
        </>
      )
      break
    }
    case EXPLANATION_MODAL_KEYS.LOGIN: {
      title = 'What is Login?'
      explanationText = (
        <>
          Login (username) is your human-readable name on the Nostr network.
          <br />
          <br />
          Unlike your NPUB, which is a long string of random symbols, your login is a meaningful name tied to a website
          address (like name@nsec.app).
          <br />
          <br />
          Use your username to log in to Nostr apps.
          <br />
          <br />
          You can have many usernames all pointing to your NPUB. People also refer to these names as nostr-addresses or
          NIP05 names.
        </>
      )
      break
    }
    case EXPLANATION_MODAL_KEYS.BUNKER: {
      title = 'What is Bunker URL?'
      explanationText = (
        <>
          Bunker URL is a string used to connect to Nostr apps.
          <br />
          <br />
          Some apps require bunker URL to connect to your keys. Paste it to the app and then confirm a connection
          request.
          <br />
          <br />
          Do not share your bunker URL strings publicly! Only copy and paste them to the app you're connecting with. 
          <br />
          <br />
          Don't worry, bunker URL strings expire
          after several minutes or if already used to connect with some app, so even if shared publicly, they will 
          probably be useless. If unsure, just find a connection with this bunker URL
          and delete it.
        </>
      )
      break
    }
    case EXPLANATION_MODAL_KEYS.HOW: {
      title = 'How Nsec.app works?'
      explanationText = (
        <>
          Nsec.app stores your nsec keys and gives permissioned access to apps.
          <br />
          <br />
          Your username (name@nsec.app) is a NIP-05 name assigned to your public key,
          it can be used to login to Nostr apps. You don't really need a username 
          on Nostr, it's just there for convenience.
          <br />
          <br />
          Your password is used to encrypt your keys and sync them across devices. 
          This way you can manage connected apps on any device. You can also export your 
          nsec encrypted with your password (NIP-49).
          <br />
          <br />
          Since your keys are located in your device, nsec.app website needs permission to
          send you push notifications - our server sends a push message to wake up 
          your keys when apps make their requests.
          <br />
        </>
      )
      break
    }
  }
  return (
    <Modal
      title={title}
      open={isModalOpened}
      onClose={handleCloseModal}
      withCloseButton={false}
      PaperProps={{
        sx: {
          minHeight: '60%',
        },
      }}
    >
      <Stack height={'100%'} gap={2}>
        <Typography flex={1}>{explanationText}</Typography>
        <Button fullWidth onClick={handleCloseModal}>
          Got it!
        </Button>
      </Stack>
    </Modal>
  )
}
