import { gql } from '@apollo/client'

export const GET_ORG_LICENSEE = gql`
  query GetOrgLicensee {
    getOrgLicensee
  }
`

export const SET_ORG_LICENSEE = gql`
  mutation SetOrgLicensee($input: SetOrgLicenseeInput!) {
    setOrgLicensee(input: $input)
  }
`
