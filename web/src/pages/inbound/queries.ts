import { gql } from '@apollo/client'

export const GET_INBOUND = gql`query GetInboundOrders($type: String, $status: String, $input: PaginationInput) { getInboundOrders(type: $type, status: $status, input: $input) }`
export const GET_ORDER = gql`query GetInboundOrder($input: IdInput!) { getInboundOrder(input: $input) }`
export const GET_SUPPLIERS = gql`query GetSuppliers($input: PaginationInput) { getSuppliers(input: $input) }`
export const GET_MATERIALS = gql`query GetMaterials($input: PaginationInput) { getMaterials(input: $input) }`
export const CREATE = gql`mutation CreateInboundOrder($input: CreateInboundInput!) { createInboundOrder(input: $input) }`
export const DEL = gql`mutation DelInboundOrder($input: IdInput!) { delInboundOrder(input: $input) }`
export const SUBMIT = gql`mutation SubmitInboundOrder($input: IdInput!) { submitInboundOrder(input: $input) }`
export const APPROVE = gql`mutation ApproveInboundOrder($input: IdInput!) { approveInboundOrder(input: $input) }`
export const REJECT = gql`mutation RejectInboundOrder($input: IdInput!, $reason: String) { rejectInboundOrder(input: $input, reason: $reason) }`
export const RECEIVE = gql`mutation ReceiveInboundLine($input: ReceiveInboundInput!) { receiveInboundLine(input: $input) }`
export const COMPLETE = gql`mutation CompleteInboundOrder($input: IdInput!) { completeInboundOrder(input: $input) }`
export const GET_APPROVAL = gql`query GetApprovalInstance($bizType: String!, $bizId: String!) { getApprovalInstance(bizType: $bizType, bizId: $bizId) }`
export const PARSE_INBOUND_TEXT = gql`mutation ParseInboundDocumentText($text: String!) { parseInboundDocumentText(text: $text) }`

export interface InboundLineRow { materialId: string; expectedQty: number }
