import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PanelState {
  // 面板可见性
  fileTreeVisible: boolean
  codePanelVisible: boolean
  panoramaVisible: boolean

  // 面板尺寸（百分比）
  sidebarSize: number
  fileTreeSize: number
  codePanelSize: number
  panoramaSize: number

  // 操作
  toggleFileTree: () => void
  toggleCodePanel: () => void
  togglePanorama: () => void
  setPanelSize: (panel: keyof Pick<PanelState, 'sidebarSize' | 'fileTreeSize' | 'codePanelSize' | 'panoramaSize'>, size: number) => void
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      fileTreeVisible: true,
      codePanelVisible: true,
      panoramaVisible: true,
      sidebarSize: 15,
      fileTreeSize: 20,
      codePanelSize: 40,
      panoramaSize: 25,

      toggleFileTree: () => set((state) => ({ fileTreeVisible: !state.fileTreeVisible })),
      toggleCodePanel: () => set((state) => ({ codePanelVisible: !state.codePanelVisible })),
      togglePanorama: () => set((state) => ({ panoramaVisible: !state.panoramaVisible })),
      setPanelSize: (panel, size) => set({ [panel]: size }),
    }),
    {
      name: 'codemagic-panel-layout',
    }
  )
)