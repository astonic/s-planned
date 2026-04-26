'use client'

import { makeStyles, tokens, Button } from '@fluentui/react-components'
import { AppsListRegular, TableRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
})

// This component is a placeholder — view state is managed inside WorkspaceView.
// We expose the toggle here for visual consistency in the header area.
// The actual toggle is embedded in WorkspaceView.
export function WorkspaceViewToggle({ projectId: _projectId }: { projectId: string }) {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <Button appearance="subtle" icon={<AppsListRegular />} aria-label="Accordion view" />
      <Button appearance="subtle" icon={<TableRegular />} aria-label="Table view" />
    </div>
  )
}
