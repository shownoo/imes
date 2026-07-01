import { gql } from '@apollo/client'

export const GET_STOCKTAKE_TASKS = gql`
  query GetStocktakeTasks($status: String, $input: PaginationInput) {
    getStocktakeTasks(status: $status, input: $input)
  }
`

export const GET_STOCKTAKE_TASK = gql`
  query GetStocktakeTask($id: ID!) {
    getStocktakeTask(id: $id)
  }
`

export const CREATE_STOCKTAKE_TASK = gql`
  mutation CreateStocktakeTask($warehouseId: ID, $shelfId: ID, $zone: String, $title: String) {
    createStocktakeTask(warehouseId: $warehouseId, shelfId: $shelfId, zone: $zone, title: $title)
  }
`

export const COUNT_STOCKTAKE_LINE = gql`
  mutation CountStocktakeLine($taskId: ID!, $qrCode: String!, $actualQty: Int!) {
    countStocktakeLine(taskId: $taskId, qrCode: $qrCode, actualQty: $actualQty)
  }
`

export const COMPLETE_STOCKTAKE_TASK = gql`
  mutation CompleteStocktakeTask($id: ID!) {
    completeStocktakeTask(id: $id)
  }
`

export const TRANSFER_STOCK_ITEM = gql`
  mutation TransferStockItem($qrCode: String!, $toShelfCode: String!) {
    transferStockItem(qrCode: $qrCode, toShelfCode: $toShelfCode)
  }
`

export const GET_EXPIRING_STOCK_ITEMS = gql`
  query GetExpiringStockItems($warehouseId: ID, $level: String, $take: Int) {
    getExpiringStockItems(warehouseId: $warehouseId, level: $level, take: $take)
  }
`

export const GET_MOBILE_ALERTS = gql`
  query GetMobileAlerts($resolved: Boolean, $take: Int) {
    getAlerts(resolved: $resolved, take: $take)
  }
`

export const ACKNOWLEDGE_ALERT = gql`
  mutation AcknowledgeAlert($id: ID!) {
    acknowledgeAlert(id: $id)
  }
`
