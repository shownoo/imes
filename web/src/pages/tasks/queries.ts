import { gql } from '@apollo/client'

export const GET_WORKBENCH = gql`
  query GetWorkbench($take: Int) {
    getWorkbench(take: $take)
  }
`

/** @deprecated 使用 GET_WORKBENCH */
export const GET_INBOX = gql`query GetMyPendingApprovalTasks { getMyPendingApprovalTasks }`

export const GET_INBOX_COUNT = gql`query GetApprovalInboxCount { getApprovalInboxCount }`

export const COMPLETE_TASK = gql`
  mutation CompleteApprovalTask($input: CompleteApprovalTaskInput!) {
    completeApprovalTask(input: $input)
  }
`
