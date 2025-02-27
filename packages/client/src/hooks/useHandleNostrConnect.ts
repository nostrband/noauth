import { client } from '@/modules/client'
import { selectKeys } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEnqueueSnackbar } from './useEnqueueSnackbar'
import { parseNostrConnectMeta } from '@/components/Modal/ModalNostrConnect/utils/helpers'
import { useModalSearchParams } from './useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'

const NOSTR_CONNECT_PROTOCOL = 'nostrconnect://'
const IMPORT_QUERY_KEY = 'import'
const IMPORT_HASH_KEY = '#import'
const EMAIL_HASH_KEY = '#email'

export const useHandleNostrConnect = () => {
  const navigate = useNavigate()
  const notify = useEnqueueSnackbar()
  const { pathname, search, hash } = useLocation()

  const keys = useAppSelector(selectKeys)

  const { handleOpen } = useModalSearchParams()

  const connect = async (npub: string, pubkey: string) => {
    try {
      const meta = parseNostrConnectMeta(search)
      if (!meta) return notify('No meta details', 'error')

      const nostrconnect = `nostrconnect://${pubkey}${search}`
      const requestId = await client.nostrConnect(npub, nostrconnect, {
        appName: meta.appName,
        appUrl: meta.appUrl,
        appIcon: meta.appIcon,
        perms: meta.perms,
      })
      console.log('requestId', requestId)
      if (!requestId) {
        return navigate(`/key/${npub}`, { replace: true })
      }
      navigate(`/key/${npub}?confirm-connect=true&reqId=${requestId}&popup=true`)
    } catch (e) {
      notify('Error: ' + e, 'error')
    }
  }

  const handleConnectWithEmail = async (email: string, pubkey: string) => {
    try {
      const keyByEmail = keys.find((key) => key.email === email)

      if (keyByEmail) return await connect(keyByEmail.npub, pubkey)

      const checkEmail = await client.checkName(email)

      if (checkEmail === 'invalid_email') {
        return notify('Invalid email!', 'error')
      }
      if (checkEmail === 'is_user') {
        return handleOpen(MODAL_PARAMS_KEYS.EMAIL_LOGIN)
      }
      if (checkEmail === 'is_not_user') {
        return handleOpen(MODAL_PARAMS_KEYS.SIGNING_UP, { pathname: '/home', search: { email, pubkey } })
      }
    } catch (error: any) {
      notify('Error: ' + error.toString(), 'error')
    }
  }

  useEffect(() => {
    const exec = async () => {
      if (!pathname.includes(NOSTR_CONNECT_PROTOCOL)) return
      const pubkey = pathname.split(NOSTR_CONNECT_PROTOCOL)[1]
      const hashParams = new URLSearchParams(hash)
      const nsec = hashParams.get(IMPORT_HASH_KEY)
      const email = hashParams.get(EMAIL_HASH_KEY)
      const isImport = new URLSearchParams(search).get(IMPORT_QUERY_KEY) === 'true'

      if (email) {
        await handleConnectWithEmail(email, pubkey)
        return
      }

      if (nsec) {
        return navigate({
          pathname: `/importconnect/${pubkey}`,
          search: search,
          hash: hash,
        })
      } else if (isImport) {
        // cut / from pathname
        const nc = pathname.slice(1) + search
        return navigate({
          pathname: `/home`,
          search: `?import-keys=true&connect=${encodeURIComponent(nc)}`,
        })
      } else {
        navigate({ pathname: `/nostrconnect/${pubkey}`, search })
      }
    }
    exec()
    // eslint-disable-next-line
  }, [])
}
