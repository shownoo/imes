import { gql } from '@apollo/client'

export const GET_OUTBOUND = gql`query GetOutboundOrders($status: String, $orderNo: String, $dateFrom: DateTime, $dateTo: DateTime, $input: PaginationInput) { getOutboundOrders(status: $status, orderNo: $orderNo, dateFrom: $dateFrom, dateTo: $dateTo, input: $input) }`
export const GET_ORDER = gql`query GetOutboundOrder($input: IdInput!) { getOutboundOrder(input: $input) }`
export const GET_MATERIALS = gql`query GetMaterials($input: PaginationInput) { getMaterials(input: $input) }`
export const GET_OUTBOUND_PURPOSES = gql`query GetOutboundPurposes($enabledOnly: Boolean, $input: PaginationInput) { getOutboundPurposes(enabledOnly: $enabledOnly, input: $input) }`
export const GET_OUTBOUND_DESTINATIONS = gql`query GetOutboundDestinations($enabledOnly: Boolean, $city: String, $useOrgCity: Boolean, $input: PaginationInput) { getOutboundDestinations(enabledOnly: $enabledOnly, city: $city, useOrgCity: $useOrgCity, input: $input) }`
export const GET_ORG_CITY = gql`query GetOrgCity { getOrgCity }`
export const GET_PICK = gql`query GetPickSuggestions($materialId: ID!, $qty: Int!) { getPickSuggestions(materialId: $materialId, qty: $qty) }`
export const CREATE = gql`mutation CreateOutboundOrder($input: CreateOutboundInput!) { createOutboundOrder(input: $input) }`
export const UPDATE = gql`mutation UpdateOutboundOrder($input: UpdateOutboundInput!) { updateOutboundOrder(input: $input) }`
export const DEL = gql`mutation DelOutboundOrder($input: IdInput!) { delOutboundOrder(input: $input) }`
export const SUBMIT = gql`mutation SubmitOutboundOrder($input: IdInput!) { submitOutboundOrder(input: $input) }`
export const APPROVE = gql`mutation ApproveOutboundOrder($input: IdInput!, $approved: Boolean!, $rejectReason: String) { approveOutboundOrder(input: $input, approved: $approved, rejectReason: $rejectReason) }`
export const START_PICK = gql`mutation StartPicking($input: IdInput!) { startPicking(input: $input) }`
export const PICK = gql`mutation PickOutboundLine($input: PickStockInput!) { pickOutboundLine(input: $input) }`
export const SHIP = gql`mutation ShipOutboundOrder($input: IdInput!) { shipOutboundOrder(input: $input) }`
export const COMPLETE = gql`mutation CompleteOutboundOrder($input: IdInput!) { completeOutboundOrder(input: $input) }`
export const GET_APPROVAL = gql`query GetApprovalInstance($bizType: String!, $bizId: String!) { getApprovalInstance(bizType: $bizType, bizId: $bizId) }`
export const TRACE_STOCK = gql`query TraceStockForPick($qrCode: String!) { traceMaterial(qrCode: $qrCode) }`

export interface OutboundLineRow { materialId: string; requestedQty: number }

export const emptyOutboundForm = () => ({
  purposeId: '',
  destinationId: '',
  recipient: '',
  lines: [{ materialId: '', requestedQty: 1 }] as OutboundLineRow[],
})
