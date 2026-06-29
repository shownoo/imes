import { gql } from '@apollo/client'

export const GET_USERS = gql`
  query GetUsers($input: PaginationInput) {
    getUsers(input: $input)
  }
`

export const GET_USER = gql`
  query GetUser($input: IdInput!) {
    getUser(input: $input)
  }
`

export const GET_ROLES = gql`
  query GetRoles {
    getRoles
  }
`

export const GET_ROLE = gql`
  query GetRole($input: IdInput!) {
    getRole(input: $input)
  }
`

export const GET_PERMISSIONS = gql`
  query GetPermissions {
    getPermissions
  }
`

export const GET_SYSTEM_LOGS = gql`
  query GetSystemLogs($module: String, $action: String, $userId: ID, $input: PaginationInput) {
    getSystemLogs(module: $module, action: $action, userId: $userId, input: $input)
  }
`

export const ADD_USER = gql`
  mutation AddUser($input: AddUserInput!) {
    addUser(input: $input)
  }
`

export const RESET_USER_PASSWORD = gql`
  mutation ResetUserPassword($input: ResetPasswordInput!) {
    resetUserPassword(input: $input)
  }
`

export const SET_USER_ACTIVE = gql`
  mutation SetUserActive($input: SetUserActiveInput!) {
    setUserActive(input: $input)
  }
`

export const ADD_ROLE = gql`
  mutation AddRole($input: AddRoleInput!) {
    addRole(input: $input)
  }
`

export const SET_ROLE_PERMISSIONS = gql`
  mutation SetRolePermissions($input: SetRolePermissionsInput!) {
    setRolePermissions(input: $input)
  }
`

export const DELETE_ROLE = gql`
  mutation DeleteRole($input: IdInput!) {
    deleteRole(input: $input)
  }
`
