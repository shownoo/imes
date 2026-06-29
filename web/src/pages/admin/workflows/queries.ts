import { gql } from '@apollo/client'

export const GET_FLOWS = gql`query GetApprovalFlows { getApprovalFlows }`
export const GET_FLOW = gql`query GetApprovalFlow($bizType: String!) { getApprovalFlow(bizType: $bizType) }`
export const SAVE_FLOW = gql`mutation SaveApprovalFlow($input: SaveApprovalFlowInput!) { saveApprovalFlow(input: $input) }`
export const GET_INSTANCE = gql`query GetApprovalInstance($bizType: String!, $bizId: String!) { getApprovalInstance(bizType: $bizType, bizId: $bizId) }`
