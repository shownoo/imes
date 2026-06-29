import { gql } from '@apollo/client'

export const GET_PRINT_TEMPLATE = gql`
  query GetPrintTemplate($input: GetPrintTemplateInput!) {
    getPrintTemplate(input: $input)
  }
`

export const GET_INBOUND_FOR_PRINT = gql`
  query GetInboundOrderForPrint($input: IdInput!) {
    getInboundOrderForPrint(input: $input)
  }
`

export const GET_OUTBOUND_FOR_PRINT = gql`
  query GetOutboundOrderForPrint($input: IdInput!) {
    getOutboundOrderForPrint(input: $input)
  }
`

export const GET_BUILTIN_PRINT_TEMPLATE = gql`
  query GetBuiltinPrintTemplate($input: GetPrintTemplateInput!) {
    getBuiltinPrintTemplate(input: $input)
  }
`

export const SET_PRINT_TEMPLATE = gql`
  mutation SetPrintTemplate($input: SetPrintTemplateInput!) {
    setPrintTemplate(input: $input)
  }
`

export const RESET_PRINT_TEMPLATE = gql`
  mutation ResetPrintTemplate($input: GetPrintTemplateInput!) {
    resetPrintTemplate(input: $input)
  }
`
