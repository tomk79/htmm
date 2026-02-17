/**
 * Injects all library styles into the document head.
 * Used for the UMD bundle so that no separate CSS file is needed.
 */

import nodeViewCss from './components/NodeView.css?inline'
import htmmMapCss from './components/HtmmMap.css?inline'
import attributesPanelCss from './components/AttributesPanel.css?inline'
import richContentEditorCss from './components/RichContentEditor.module.css?inline'
import printCss from './styles/print.css?inline'

const STYLE_ID = 'htmm-styles'

export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const combined = [
    nodeViewCss,
    htmmMapCss,
    attributesPanelCss,
    richContentEditorCss,
    printCss,
  ].join('\n')

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = combined
  document.head.appendChild(style)
}
