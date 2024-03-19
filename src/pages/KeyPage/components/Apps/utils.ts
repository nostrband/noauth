import { IAppGroup, IClientApp } from '@/types/general'

export const groupAppsByURL = (apps: IClientApp[] = []): IAppGroup[] => {
  const filteredApps = apps
  const groups = filteredApps.reduce(
    (acc, app) => {
      const { url, appNpub } = app
      if (!url.trim()) {
        acc[appNpub] = [app]
        return acc
      }
      if (!acc[url]) {
        acc[url] = [app]
      }
      acc[url].push(app)
      return acc
    },
    {} as Record<string, IClientApp[]>
  )

  const displayData = Object.keys(groups)
    .map((key) => {
      const groupApps = groups[key]
      const size = groupApps.length
      const lastActive = Math.max(...groupApps.map((app) => app.lastActive))
      const [firstAppOfGroup] = groupApps

      const appGroup: IAppGroup = {
        ...firstAppOfGroup,
        lastActive,
        size,
        apps: size === 1 ? [firstAppOfGroup] : groupApps.sort((a, b) => b.updateTimestamp - a.updateTimestamp),
      }
      return appGroup
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return displayData
}
