import { gql } from '@apollo/client'

export const DOCUMENT_UPDATED = gql`
  subscription DocumentUpdated($scope: String!, $documentId: ID!) {
    documentUpdated(scope: $scope, documentId: $documentId)
  }
`

export const OPS_TODO_CHANGED = gql`
  subscription OpsTodoChanged {
    opsTodoChanged
  }
`

export type DocumentRealtimeEvent = {
  scope: 'inbound' | 'outbound'
  documentId: string
  action: string
  at: string
  actorId?: string
  actorName?: string | null
}
