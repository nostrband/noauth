import { client } from '@/modules/client'
import { selectKeys } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'
import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useEnqueueSnackbar } from './useEnqueueSnackbar'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { parseNostrConnectMeta } from '@/utils/helpers/helpers'

const NOSTR_CONNECT_PROTOCOL = 'nostrconnect://'
const IMPORT_QUERY_KEY = 'import'
const IMPORT_HASH_KEY = 'import'
const EMAIL_HASH_KEY = 'email'

export const useHandleNostrConnect = () => {
  const navigate = useNavigate()
  const notify = useEnqueueSnackbar()
  const { pathname, search, hash } = useLocation()
  const [searchParams] = useSearchParams()

  const keys = useAppSelector(selectKeys)

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
      console.log('checkEmail', checkEmail)

      if (checkEmail === 'invalid_email') {
        return notify('Invalid email!', 'error')
      }

      const nc = pathname.slice(1) + search
      console.log('nc', nc)
      if (checkEmail === 'is_user' || checkEmail.startsWith('npub')) {
        return navigate({
          pathname: '/home',
          search: `?${MODAL_PARAMS_KEYS.EMAIL_LOGIN}=true&connect=${encodeURIComponent(nc)}&email=${email}`,
        })
      }
      if (checkEmail === 'is_not_user') {
        return navigate({
          pathname: '/home',
          search: `?${MODAL_PARAMS_KEYS.SIGNING_UP}=true&email=${email}&connect=${encodeURIComponent(nc)}`,
        })
      }
    } catch (error: any) {
      notify('Error: ' + error.toString(), 'error')
    }
  }

  useEffect(() => {
    const exec = async () => {
      if (!pathname.includes(NOSTR_CONNECT_PROTOCOL)) return
      const pubkey = pathname.split(NOSTR_CONNECT_PROTOCOL)[1]
      const hashParams = new URLSearchParams(hash.substring(1))
      const nsec = hashParams.get(IMPORT_HASH_KEY)
      const email = hashParams.get(EMAIL_HASH_KEY)
      const isImport = searchParams.get(IMPORT_QUERY_KEY) === 'true'

      if (email) {
        return handleConnectWithEmail(email, pubkey)
      } else if (nsec) {
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
        // choose which key to connect to
        navigate({ pathname: `/nostrconnect/${pubkey}`, search })
      }
    }
    exec()
    // eslint-disable-next-line
  }, [])
}
