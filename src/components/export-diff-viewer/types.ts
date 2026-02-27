export interface Group {
  id: string
  name: string
  lastSyncedAt: string | null
  lastSyncedMessagePreview: string | null
}

export interface Message {
  id: string
  sender: string
  timestamp: string
  content: string
  mediaFilename: string | null
}

export interface MediaAttachment {
  filename: string
  messageId: string
  sender: string
  timestamp: string
}

export interface ExportSummary {
  newMessageCount: number
  mediaAttachmentCount: number
  dateRangeStart: string
  dateRangeEnd: string
}

export type ViewState = "empty" | "uploading" | "results"

export interface ExportDiffViewerProps {
  groups: Group[]
  suggestedGroupId?: string
  uploadedFileName?: string
  newMessages: Message[]
  previousMessages: Message[]
  mediaAttachments: MediaAttachment[]
  summary?: ExportSummary

  /** Called when the user selects a group from the dropdown */
  onGroupSelect?: (groupId: string) => void
  /** Called when the user uploads or drops an export file */
  onFileUpload?: (file: File) => void
  /** Called when the user clicks "Mark as Synced" */
  onMarkSynced?: () => void
}
