import './App.css';
import { nip19 } from 'nostr-tools'
import { DbApp, DbKey, DbPending, DbPerm, dbi } from './db';
import { useEffect, useState } from 'react';
import { swicCall, swicOnRender } from './swic';
import { NIP46_RELAYS } from './consts';

function App() {

  const [render, setRender] = useState(0)
  const [keys, setKeys] = useState<DbKey[]>([])
  const [apps, setApps] = useState<DbApp[]>([])
  const [perms, setPerms] = useState<DbPerm[]>([])
  const [pending, setPending] = useState<DbPending[]>([])

  const load = async () => {
    const keys = await dbi.listKeys()
    setKeys(keys)

    const apps = await dbi.listApps()
    setApps(apps)

    const perms = await dbi.listPerms()
    setPerms(perms)

    const pending = await dbi.listPending()
    const firstPending = new Map<string, DbPending>()
    for (const p of pending) {
      if (firstPending.get(p.appNpub)) continue
      firstPending.set(p.appNpub, p)
    }

    // @ts-ignore
    setPending([...firstPending.values()])

    // rerender
    setRender(r => r + 1)
  }

  useEffect(() => {
    load()
  }, [render])

  async function log(s: string) {
    const log = document.getElementById('log')
    if (log) log.innerHTML = s
  }

  async function askNotificationPermission() {
    return new Promise<void>((ok, rej) => {
      // Let's check if the browser supports notifications
      if (!("Notification" in window)) {
        log("This browser does not support notifications.")
        rej()
      } else {
        Notification.requestPermission().then(() => {
          log("notifications perm" + Notification.permission)
          if (Notification.permission === 'granted') ok()
          else rej()
        });
      }
    })
  }

  async function enableNotifications() {
    await askNotificationPermission()
    try {
      const r = await swicCall('enablePush')
      if (!r) {
        log(`Failed to enable push subscription`)
        return
      }

      log(`enabled!`)
    } catch (e) {
      log(`Error: ${e}`)
    }
  }

  async function call(cb: () => any) {
    try {
      return await cb()
    } catch (e) {
      log(`Error: ${e}`)
    }
  }

  async function generateKey() {
    call(async () => {
      const k: any = await swicCall('generateKey');
      log("New key " + k.npub)
    })
  }

  async function confirmPending(id: string, allow: boolean, remember: boolean) {
    call(async () => {
      await swicCall('confirm', id, allow, remember);
      console.log("confirmed", id, allow, remember)
    })
  }

  async function deleteApp(appNpub: string) {
    call(async () => {
      await swicCall('deleteApp', appNpub);
      log('App deleted')
    })
  }

  async function deletePerm(id: string) {
    call(async () => {
      await swicCall('deletePerm', id);
      log('Perm deleted')
    })
  }

  async function saveKey(npub: string) {
    call(async () => {
      // @ts-ignore
      const passphrase = document.getElementById(`passphrase${npub}`)?.value
      await swicCall('saveKey', npub, passphrase)
      log('Key saved')
    })
  }

  async function importKey() {
    call(async () => {
      // @ts-ignore
      const nsec = document.getElementById(`nsec`)?.value
      await swicCall('importKey', nsec)
      log('Key imported')
    })
  }

  async function fetchNewKey() {
    call(async () => {
      // @ts-ignore
      const npub = document.getElementById('npub')?.value
      // @ts-ignore
      const passphrase = document.getElementById('passphrase')?.value
      console.log("fetch", npub, passphrase)
      const k: any = await swicCall('fetchKey', npub, passphrase)
      log("Fetched " + k.npub)
    })
  }

  // subscribe to updates from the service worker
  swicOnRender(() => {
    console.log("render")
    setRender(r => r + 1)
  })

  return (
    <div className="App">
      <header className="App-header">
        Nostr Login
      </header>
      <div>
        <h4>Keys:</h4>
        {keys.map((k) => {
          const { data: pubkey } = nip19.decode(k.npub)
          const str = `bunker://${pubkey}?relay=${NIP46_RELAYS[0]}`
          return (
            <div key={k.npub} style={{ marginBottom: "10px" }}>
              {k.npub}
              <div>{str}</div>
              <div>
                <input id={`passphrase${k.npub}`} placeholder='save password' />
                <button onClick={() => saveKey(k.npub)}>save</button>
              </div>
            </div>
          )
        })}

<div>
          <button onClick={generateKey}>generate key</button>
        </div>
        <div>
          <input id='nsec' placeholder='nsec' />
          <button onClick={importKey}>import key (DANGER!)</button>
        </div>
        <div>
          <input id='npub' placeholder='npub' />
          <input id='passphrase' placeholder='password' />
          <button onClick={fetchNewKey}>fetch key</button>
        </div>
        <hr />

        <h4>Connected apps:</h4>
        {apps.map((a) => (
          <div key={a.npub} style={{ marginTop: "10px" }}>
            <div>
              {a.npub} =&gt; {a.appNpub}
              <button onClick={() => deleteApp(a.appNpub)}>x</button>
            </div>
            <h5>Perms:</h5>
            {perms.filter(p => p.appNpub === a.appNpub).map(p => (
              <div key={p.id}>
                {p.perm}: {p.value}
                <button onClick={() => deletePerm(p.id)}>x</button>
              </div>
            ))}
            <hr />
          </div>
        ))}

        <h4>Pending requests:</h4>
        {pending.map((p) => (
          <div key={p.id}>
            {p.appNpub} =&gt; {p.npub} ({p.method})
            <button onClick={() => confirmPending(p.id, true, false)}>yes</button>
            <button onClick={() => confirmPending(p.id, false, false)}>no</button>
            <button onClick={() => confirmPending(p.id, true, true)}>yes all</button>
            <button onClick={() => confirmPending(p.id, false, true)}>no all</button>
          </div>
        ))}
        <hr />

        <div>
          <button onClick={enableNotifications}>enable background signing</button>
        </div>
        <div>
          <textarea id='log'></textarea>
        </div>
      </div>
    </div>
  );
}

export default App;
